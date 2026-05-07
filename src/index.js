/**
 * ClawForge — Main Orchestrator
 * Script → Narrate → Record → Compose → MP4
 */

import { loadScript } from './script-loader.js';
import { narrate } from './narrator.js';
import { record } from './recorder.js';
import { compose } from './composer.js';
import { resolve } from 'path';

export async function produce(scriptPath, options = {}) {
  const startTime = Date.now();
  console.log('⚡ ClawForge — AI Agent Video Production');
  console.log(`📄 Script: ${scriptPath}\n`);

  // Step 1: Load script
  const script = loadScript(resolve(scriptPath));
  script.project.output = resolve(options.output || script.project.output);
  console.log(`📁 Output: ${script.project.output}`);
  console.log(`🎬 Scenes: ${script.scenes.length}`);
  console.log(`🔊 Voice: ${script.voice.voice} (${script.voice.engine})\n`);

  // Step 2: Generate narration audio
  const { audioDir, durations } = await narrate(script);
  console.log('');

  // Step 3: Record browser with Playwright (timed to audio)
  const videoPath = await record(script, durations);
  console.log('');

  // Step 4: Compose final video
  const finalPath = await compose(videoPath, audioDir, script.scenes, script.project.output);
  console.log('');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 Done in ${elapsed}s`);
  console.log(`📹 ${finalPath}`);

  return finalPath;
}
