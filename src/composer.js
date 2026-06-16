/**
 * ClawForge — Composer
 * Merges video + audio into final MP4 using ffmpeg.
 * Supports optional SRT subtitle burn-in, background music ducking,
 * and webcam picture-in-picture overlay.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import {
  buildNarrationTimeline,
  buildDuckingFilter,
  calculateTotalDuration,
} from './music/ducker.js';
import { buildWebcamOverlay } from './webcam/index.js';

const execFileAsync = promisify(execFile);

/**
 * @param {string} videoPath — path to recorded video
 * @param {string} audioDir — directory with scene MP3 files
 * @param {Array} scenes — scene definitions
 * @param {string} outputDir — output directory
 * @param {string} [srtPath] — optional path to SRT subtitle file for burn-in
 * @param {object} [musicConfig] — optional background music config
 * @param {number[]} [audioDurations] — per-scene audio durations (needed for ducking)
 * @param {object} [webcamConfig] — optional webcam PiP config
 * @returns {Promise<string>} path to final video
 */
export async function compose(videoPath, audioDir, scenes, outputDir,
  srtPath, musicConfig, audioDurations, webcamConfig) {
  mkdirSync(outputDir, { recursive: true });

  const concatAudioPath = join(outputDir, 'narration.mp3');
  const finalPath = join(outputDir, 'output.mp4');

  console.log('🎞️  Composing final video');

  // Step 1: Concatenate audio segments
  const audioFiles = scenes
    .filter((s) => s.narration)
    .map((s) => join(audioDir, `${s.name}.mp3`))
    .filter((f) => existsSync(f));

  let audioTrackPath = concatAudioPath;

  if (audioFiles.length > 0) {
    await concatAudio(audioFiles, scenes, concatAudioPath);
    console.log('  ✅ Audio concatenated');
  }

  // Step 2 (optional): Mix narration with background music (ducking)
  if (musicConfig && musicConfig.file && audioFiles.length > 0) {
    const musicFile = musicConfig.file;

    if (!existsSync(musicFile)) {
      console.warn(`  ⚠️ Music file not found: "${musicFile}" — skipping background music`);
    } else {
      console.log('  🎵 Mixing background music with ducking...');
      const mixedAudioPath = join(outputDir, 'mixed_audio.mp3');
      await mixWithMusic(concatAudioPath, musicFile, scenes, audioDurations || [], musicConfig, mixedAudioPath);
      audioTrackPath = mixedAudioPath;
      console.log('  ✅ Music mixed');
    }
  }

  // Step 3: Merge video + audio → MP4 (with optional subtitles & webcam)
  if (videoPath && existsSync(videoPath)) {
    await mergeVideoAudio(videoPath, audioTrackPath, outputDir, finalPath,
      srtPath, webcamConfig);
  } else {
    console.warn('  ⚠️ No video file found — skipping merge');
  }

  return finalPath;
}

/**
 * Mix narration track with background music using ffmpeg ducking
 */
async function mixWithMusic(narrationPath, musicPath, scenes, audioDurations, musicConfig, outputPath) {
  const {
    volume = 0.3,
    duckLevel = 0.1,
    fadeIn = 2,
    fadeOut = 3,
  } = musicConfig;

  const segments = buildNarrationTimeline(scenes, audioDurations);
  const totalDuration = calculateTotalDuration(scenes, audioDurations);

  const filterParts = [];
  let prevLabel = '[1:a]';

  if (volume !== 1) {
    filterParts.push(`[1:a]volume=${volume}[bgm_scaled]`);
    prevLabel = '[bgm_scaled]';
  }

  const duckRaw = buildDuckingFilter(segments, duckLevel);
  filterParts.push(duckRaw.replace('[1:a]', prevLabel));
  prevLabel = '[bgm_ducked]';

  if (fadeIn > 0) {
    filterParts.push(`${prevLabel}afade=t=in:ss=0:d=${fadeIn}[bgm_fadein]`);
    prevLabel = '[bgm_fadein]';
  }

  if (fadeOut > 0 && totalDuration > 0) {
    const fadeOutStart = Math.max(0, totalDuration - fadeOut);
    filterParts.push(`${prevLabel}afade=t=out:st=${fadeOutStart}:d=${fadeOut}[bgm_fadeout]`);
    prevLabel = '[bgm_fadeout]';
  }

  filterParts.push(`[0:a]${prevLabel}amix=inputs=2:duration=first:dropout_transition=2[aout]`);

  const filterComplex = filterParts.join('; ');

  const args = [
    '-y',
    '-i', narrationPath,
    '-i', musicPath,
    '-filter_complex', filterComplex,
    '-map', '[aout]',
    '-b:a', '192k',
    outputPath,
  ];

  await execFileAsync('ffmpeg', args);
}

/**
 * Merge video track with audio track, optionally burning in subtitles
 * and/or overlaying webcam PiP.
 *
 * Input layout (no webcam):
 *   0 = video.mp4, 1 = audio.mp3
 *
 * Input layout (with webcam):
 *   0 = video.mp4, 1 = audio.mp3, 2 = webcam.mp4
 */
async function mergeVideoAudio(videoPath, audioPath, outputDir, finalPath,
  srtPath, webcamConfig) {
  const hasAudio = existsSync(audioPath);
  const hasSubtitles = srtPath && existsSync(srtPath);
  const hasWebcam = webcamConfig && webcamConfig.file && existsSync(webcamConfig.file);

  // Build ffmpeg args
  const ffmpegArgs = ['-y', '-i', videoPath];

  if (hasAudio) {
    ffmpegArgs.push('-i', audioPath); // input 1
  }

  if (hasWebcam) {
    ffmpegArgs.push('-i', webcamConfig.file); // input 2
    console.log('  📸 Webcam PiP overlay enabled');
  }

  const webcamIdx = hasAudio ? 2 : 1; // webcam input index
  const audioIdx = 1; // always input 1 if present

  // Build video filter chain
  let useFilterComplex = false;
  let filterChain = '';

  if (hasWebcam) {
    const viewportRes = { width: 1280, height: 720 };
    const overlay = buildWebcamOverlay(webcamConfig, viewportRes, {
      mainLabel: '[0:v]',
      camLabel: `[${webcamIdx}:v]`,
    });
    filterChain = overlay.filterComplex;
    let videoOut = overlay.videoOut;

    if (hasSubtitles) {
      const absSrtPath = join(process.cwd(), srtPath);
      filterChain += `; ${videoOut}subtitles='${absSrtPath}'[v_final]`;
      videoOut = '[v_final]';
    }

    useFilterComplex = true;
    ffmpegArgs.push('-filter_complex', filterChain);
    ffmpegArgs.push('-map', videoOut); // video from filter
    if (hasAudio) {
      ffmpegArgs.push('-map', `${audioIdx}:a`); // audio from narration track
    }
  } else if (hasSubtitles) {
    // Simple subtitle burn-in (no -filter_complex needed)
    const absSrtPath = join(process.cwd(), srtPath);
    ffmpegArgs.push('-vf', `subtitles='${absSrtPath}'`);
    console.log('  📝 Subtitles enabled');
  }

  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
  );

  if (hasAudio) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  } else {
    ffmpegArgs.push('-an');
  }

  ffmpegArgs.push(finalPath);

  console.log('  🔄 Encoding MP4...');
  await execFileAsync('ffmpeg', ffmpegArgs);
  console.log(`  ✅ Output: ${finalPath}`);
}

async function concatAudio(audioFiles, scenes, outputPath) {
  const gapMs = 1500;
  const inputs = [];
  const filterParts = [];

  audioFiles.forEach((file, i) => {
    inputs.push('-i', file);
    filterParts.push(`[${i}:a]`);
  });

  const filterComplex = filterParts.join('') +
    `concat=n=${audioFiles.length}:v=0:a=1[out]`;

  const args = [
    '-y',
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    outputPath,
  ];

  await execFileAsync('ffmpeg', args);
}
