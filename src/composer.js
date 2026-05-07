/**
 * AgentCast — Composer
 * Merges video + audio into final MP4 using ffmpeg.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

const execFileAsync = promisify(execFile);

export async function compose(videoPath, audioDir, scenes, outputDir) {
  mkdirSync(outputDir, { recursive: true });

  const concatAudioPath = join(outputDir, 'narration.mp3');
  const finalPath = join(outputDir, 'output.mp4');

  console.log('🎞️  Composing final video');

  // Step 1: Concatenate audio segments with gaps
  const audioFiles = scenes
    .filter((s) => s.narration)
    .map((s) => join(audioDir, `${s.name}.mp3`))
    .filter((f) => existsSync(f));

  if (audioFiles.length > 0) {
    await concatAudio(audioFiles, scenes, concatAudioPath);
    console.log('  ✅ Audio concatenated');
  }

  // Step 2: Merge video + audio → MP4
  if (videoPath && existsSync(videoPath)) {
    const ffmpegArgs = [
      '-y',
      '-i', videoPath,
    ];

    if (existsSync(concatAudioPath)) {
      ffmpegArgs.push('-i', concatAudioPath);
      ffmpegArgs.push(
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        finalPath
      );
    } else {
      ffmpegArgs.push(
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-an',
        finalPath
      );
    }

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
