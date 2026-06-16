/**
 * ClawForge — Composer
 * Merges video + audio into final MP4 using ffmpeg.
 * Supports optional SRT subtitle burn-in and background music ducking.
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

const execFileAsync = promisify(execFile);

/**
 * @param {string} videoPath — path to recorded video
 * @param {string} audioDir — directory with scene MP3 files
 * @param {Array} scenes — scene definitions
 * @param {string} outputDir — output directory
 * @param {string} [srtPath] — optional path to SRT subtitle file for burn-in
 * @param {object} [musicConfig] — optional background music config
 * @param {number[]} [audioDurations] — per-scene audio durations (needed for ducking)
 * @returns {Promise<string>} path to final video
 */
export async function compose(videoPath, audioDir, scenes, outputDir, srtPath, musicConfig, audioDurations) {
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

  // Step 3: Merge video + audio → MP4 (with optional subtitles)
  if (videoPath && existsSync(videoPath)) {
    await mergeVideoAudio(videoPath, audioTrackPath, outputDir, finalPath, srtPath);
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

  // Build narration timeline
  const segments = buildNarrationTimeline(scenes, audioDurations);
  const totalDuration = calculateTotalDuration(scenes, audioDurations);

  // Build filter chain
  // Inputs: [0:a] = narration, [1:a] = bgm
  const filterParts = [];
  let prevLabel = '[1:a]';

  // Step 1: Base volume scaling
  if (volume !== 1) {
    filterParts.push(`[1:a]volume=${volume}[bgm_scaled]`);
    prevLabel = '[bgm_scaled]';
  }

  // Step 2: Ducking during narration
  const duckRaw = buildDuckingFilter(segments, duckLevel);
  // Replace [1:a] reference with the actual previous label
  filterParts.push(duckRaw.replace('[1:a]', prevLabel));
  prevLabel = '[bgm_ducked]';

  // Step 3: Fade in
  if (fadeIn > 0) {
    filterParts.push(`${prevLabel}afade=t=in:ss=0:d=${fadeIn}[bgm_fadein]`);
    prevLabel = '[bgm_fadein]';
  }

  // Step 4: Fade out
  if (fadeOut > 0 && totalDuration > 0) {
    const fadeOutStart = Math.max(0, totalDuration - fadeOut);
    filterParts.push(`${prevLabel}afade=t=out:st=${fadeOutStart}:d=${fadeOut}[bgm_fadeout]`);
    prevLabel = '[bgm_fadeout]';
  }

  // Step 5: Mix narration + processed music
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
 */
async function mergeVideoAudio(videoPath, audioPath, outputDir, finalPath, srtPath) {
  const ffmpegArgs = [
    '-y',
    '-i', videoPath,
  ];

  if (existsSync(audioPath)) {
    ffmpegArgs.push('-i', audioPath);
  }

  // Add subtitle burn-in filter if SRT file exists
  const hasSubtitles = srtPath && existsSync(srtPath);
  if (hasSubtitles) {
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

  if (existsSync(audioPath)) {
    ffmpegArgs.push(
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
    );
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
