#!/usr/bin/env node

/**
 * ClawForge CLI
 * Usage: clawforge <script.yaml> [--output <dir>]
 */

import { ClawForgeSDK } from '../src/sdk/clawforge-sdk.js';
import { ClawForgeError } from '../src/errors/clawforge-errors.js';
import { getDependencyInstallInstructions } from '../src/utils/deps.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
⚡ ClawForge — AI Agent Video Production Toolkit

Usage:
  clawforge <script.yaml>              Produce video from script
  clawforge <script.yaml> -o <dir>     Specify output directory
  clawforge validate <script.yaml>     Validate script without executing
  clawforge check-deps                 Check dependencies
  clawforge resume <checkpoint.json>   Resume from checkpoint

Options:
  -o, --output <dir>   Output directory (default: ./output)
  -v, --verbose        Enable verbose logging
  --skip-deps          Skip dependency check
  -h, --help           Show this help
  --version            Show version

Examples:
  clawforge demo-script.yaml
  clawforge my-app.yaml --output ./videos
  clawforge validate my-app.yaml
  clawforge check-deps
`);
  process.exit(0);
}

if (args.includes('--version')) {
  const { readFileSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  console.log(`clawforge v${pkg.version}`);
  process.exit(0);
}

// Handle subcommands
const command = args[0];

if (command === 'validate') {
  await handleValidate(args.slice(1));
  process.exit(0);
}

if (command === 'check-deps') {
  await handleCheckDeps();
  process.exit(0);
}

if (command === 'resume') {
  await handleResume(args.slice(1));
  process.exit(0);
}

// Main produce command
const scriptPath = args.find((a) => !a.startsWith('-'));
if (!scriptPath) {
  console.error('❌ No script file specified. Run: clawforge --help');
  process.exit(1);
}

const outputIdx = args.findIndex((a) => a === '-o' || a === '--output');
const output = outputIdx !== -1 ? args[outputIdx + 1] : undefined;
const verbose = args.includes('-v') || args.includes('--verbose');
const skipDeps = args.includes('--skip-deps');

try {
  const forge = new ClawForgeSDK({
    skipDependencyCheck: skipDeps,
    verbose,
  });

  console.log('⚡ ClawForge — AI Agent Video Production');
  console.log(`📄 Script: ${scriptPath}\n`);

  forge.on('stage:start', ({ stage }) => {
    const stageNames = {
      'dependency-check': '🔍 Checking dependencies',
      'load-script': '📄 Loading script',
      'validate-script': '✅ Validating script',
      'narration': '🎙️  Generating narration',
      'recording': '🎬 Recording video',
      'composition': '🎞️  Composing final video',
    };
    console.log(stageNames[stage] || `▶️  ${stage}`);
  });

  forge.on('stage:complete', ({ stage, ...data }) => {
    if (stage === 'load-script') {
      console.log(`   Project: ${data.script.name}`);
      console.log(`   Scenes: ${data.script.scenes}`);
      console.log(`   Voice: ${data.script.voice}\n`);
    }
  });

  forge.on('retry', ({ stage, attempt, maxRetries, delay }) => {
    console.log(`   ⚠️  Retry ${attempt}/${maxRetries} in ${delay}ms...`);
  });

  forge.on('checkpoint', ({ stage, path }) => {
    if (verbose) {
      console.log(`   💾 Checkpoint: ${path}`);
    }
  });

  const startTime = Date.now();
  const result = await forge.produce(scriptPath, { output });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Done in ${elapsed}s`);
  console.log(`📹 ${result.outputPath}`);
  console.log(`📊 Size: ${(result.stats.fileSize / 1024 / 1024).toFixed(2)} MB`);

} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);

  if (error instanceof ClawForgeError) {
    if (error.suggestion) {
      console.error(`💡 Suggestion: ${error.suggestion}`);
    }

    if (error.code === 'MISSING_DEPENDENCY' && error.missing) {
      const instructions = getDependencyInstallInstructions(error.missing);
      console.error('\nInstallation instructions:');
      instructions.forEach(inst => console.error(`  • ${inst}`));
    }

    if (verbose && error.context) {
      console.error('\nContext:', JSON.stringify(error.context, null, 2));
    }
  }

  process.exit(1);
}

async function handleValidate(args) {
  const scriptPath = args.find((a) => !a.startsWith('-'));
  if (!scriptPath) {
    console.error('❌ No script file specified');
    process.exit(1);
  }

  console.log('🔍 Validating script...\n');

  const forge = new ClawForgeSDK({ skipDependencyCheck: true });
  const validation = await forge.validate(scriptPath);

  if (validation.valid) {
    console.log('✅ Script is valid');
    if (validation.warnings.length > 0) {
      console.log(`\n⚠️  ${validation.warnings.length} warning(s):`);
      validation.warnings.forEach(w => {
        console.log(`   • ${w.path}: ${w.message}`);
      });
    }
  } else {
    console.log(`❌ Script has ${validation.errors.length} error(s):\n`);
    validation.errors.forEach(e => {
      console.log(`   • ${e.path}: ${e.message}`);
    });
    process.exit(1);
  }
}

async function handleCheckDeps() {
  console.log('🔍 Checking dependencies...\n');

  const deps = await ClawForgeSDK.checkDependencies();

  Object.entries(deps.dependencies).forEach(([name, status]) => {
    const icon = status.installed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${status.installed ? 'installed' : 'missing'}`);
    if (status.message) {
      console.log(`   ${status.message}`);
    }
  });

  if (!deps.allInstalled) {
    console.log('\n❌ Some dependencies are missing');
    const instructions = getDependencyInstallInstructions(deps.missing);
    console.log('\nInstallation instructions:');
    instructions.forEach(inst => console.log(`  • ${inst}`));
    process.exit(1);
  } else {
    console.log('\n✅ All dependencies installed');
  }
}

async function handleResume(args) {
  const checkpointPath = args.find((a) => !a.startsWith('-'));
  if (!checkpointPath) {
    console.error('❌ No checkpoint file specified');
    process.exit(1);
  }

  console.log('🔄 Resuming from checkpoint...\n');

  const forge = new ClawForgeSDK();

  forge.on('stage:start', ({ stage }) => {
    console.log(`▶️  ${stage}`);
  });

  const startTime = Date.now();
  const result = await forge.resume(checkpointPath);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Resumed and completed in ${elapsed}s`);
  console.log(`📹 ${result.outputPath}`);
}
