/**
 * AgentCast — Narrator
 * Generates voiceover audio from scene narrations via edge-tts.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdirSync, statSync } from 'fs';

const execFileAsync = promisify(execFile);

export async function narrate(script) {
  const { voice, scenes, project } = script;
  const audioDir = `${project.output}/audio`;
  mkdirSync(audioDir, { recursive: true });

  const scenesWithNarration = scenes.filter((s) => s.narration);
  console.log(`🎙️  Generating ${scenesWithNarration.length} voiceover segments (${voice.engine})`);

  const durations = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (!scene.narration) {
      durations.push(3);
      continue;
    }

    const outPath = `${audioDir}/${scene.name}.mp3`;
    console.log(`  🔊 ${scene.name}: "${scene.narration.substring(0, 60)}..."`);

    if (voice.engine === 'edge-tts') {
      const args = [
        '--voice', voice.voice,
        '--text', scene.narration,
        '--write-media', outPath,
      ];
      if (voice.rate) {
        args.push('--rate', voice.rate);
      }
      await execFileAsync('edge-tts', args);
    } else {
      throw new Error(`Unsupported voice engine: ${voice.engine} (supported: edge-tts)`);
    }

    const duration = await getAudioDuration(outPath);
    durations.push(duration);
    console.log(`  ✅ ${scene.name} (${duration.toFixed(1)}s)`);
  }

  console.log(`  🎙️  Total narration: ${durations.reduce((a, b) => a + b, 0).toFixed(1)}s`);
  return { audioDir, durations };
}

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath,
    ]);
    return parseFloat(stdout.trim()) || 5;
  } catch {
    const size = statSync(filePath).size;
    return size / 16000;
  }
}
