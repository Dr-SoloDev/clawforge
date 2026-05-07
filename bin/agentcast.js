#!/usr/bin/env node

/**
 * AgentCast CLI
 * Usage: agentcast <script.yaml> [--output <dir>]
 */

import { produce } from '../src/index.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
⚡ AgentCast — AI Agent Video Production Toolkit

Usage:
  agentcast <script.yaml>              Produce video from script
  agentcast <script.yaml> -o <dir>     Specify output directory

Options:
  -o, --output <dir>   Output directory (default: ./output)
  -h, --help           Show this help
  -v, --version        Show version

Examples:
  agentcast demo-script.yaml
  agentcast my-app.yaml --output ./videos
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const { readFileSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  console.log(`agentcast v${pkg.version}`);
  process.exit(0);
}

const scriptPath = args.find((a) => !a.startsWith('-'));
if (!scriptPath) {
  console.error('❌ No script file specified. Run: agentcast --help');
  process.exit(1);
}

const outputIdx = args.findIndex((a) => a === '-o' || a === '--output');
const output = outputIdx !== -1 ? args[outputIdx + 1] : undefined;

try {
  await produce(scriptPath, { output });
} catch (err) {
  console.error(`\n❌ Error: ${err.message}`);
  if (err.message.includes('edge-tts')) {
    console.error('   Install: pip install edge-tts');
  }
  if (err.message.includes('ffmpeg') || err.message.includes('ffprobe')) {
    console.error('   Install: https://johnvansickle.com/ffmpeg/');
  }
  if (err.message.includes('playwright') || err.message.includes('browserType')) {
    console.error('   Install: npx playwright install chromium');
  }
  process.exit(1);
}
