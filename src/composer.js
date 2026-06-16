/**
 * ClawForge — Composer
 * Merges video + audio into final MP4 using ffmpeg.
 * Supports optional SRT subtitle burn-in.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const execFileAsync = promisify(execFile);

/**
 * @param {string} videoPath — path to recorded video
 * @param {string} audioDir — directory with scene MP3 files
 * @param {Array} scenes — scene definitions
 * @param {string} outputDir — output directory
 * @param {string} [srtPath] — optional path to SRT subtitle file for burn-in
 * @returns {Promise<string>} path to final video
 */
export async function compose(videoPath, audioDir, scenes, outputDir, srtPath) {
  mkdirSync(outputDir, { recursive: true });

  const concatAudioPath = join(outputDir, 'narration.mp3');
  const finalPath = join(outputDir, 'output.mp4');

  console.log('🎞️  Composing final video');

  // Step 1: Concatenate audio segments
  const audioFiles = scenes
    .filter((s) => s.narration)
    .map((s) => join(audioDir, `${s.name}.mp3`))
    .filter((f) => existsSync(f));

  if (audioFiles.length > 0) {
    await concatAudio(audioFiles, scenes, concatAudioPath);
    console.log('  ✅ Audio concatenated');
  }

  // Step 2: Merge video + audio → MP4 (with optional subtitles)
  if (videoPath && existsSync(videoPath)) {
    const ffmpegArgs = [
      '-y',
      '-i', videoPath,
    ];

    if (existsSync(concatAudioPath)) {
      ffmpegArgs.push('-i', concatAudioPath);
    }

    // Add subtitle burn-in filter if SRT file exists
    const hasSubtitles = srtPath && existsSync(srtPath);
    if (hasSubtitles) {
      // Use absolute path for subtitles filter (ffmpeg needs it for .srt)
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

    if (existsSync(concatAudioPath)) {
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
  } else {
    console.warn('  ⚠️ No video file found — skipping merge');
  }

  return finalPath;
}

async function concatAudio(audioFiles, scenes, outputPath) {
  // Build ffmpeg filter for concatenation with gaps between segments
  const gapMs = 1500;
  const inputs = [];
  const filterParts = [];

  audioFiles.forEach((file, i) => {
    inputs.push('-i', file);
    filterParts.push(`[${i}:a]`);
  });

  // Use concat filter with gaps via adelay on all but the first segment
  // Simpler approach: concat all segments with a short silence between each
  const silenceDuration = gapMs / 1000;
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
