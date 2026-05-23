/**
 * ClawForge SDK Usage Example
 * Demonstrates how AI agents can use ClawForge programmatically
 */

import { ClawForgeSDK, ErrorCodes } from 'clawforge';

async function main() {
  // Create SDK instance with options
  const forge = new ClawForgeSDK({
    checkpointDir: './checkpoints',
    verbose: true,
    retryPolicy: {
      maxRetries: 3,
      backoffStrategy: 'exponential',
    },
  });

  // Set up event listeners for progress tracking
  forge.on('stage:start', ({ stage }) => {
    console.log(`\n▶️  Starting: ${stage}`);
  });

  forge.on('stage:complete', ({ stage, ...data }) => {
    console.log(`✅ Completed: ${stage}`);
    if (stage === 'narration') {
      console.log(`   Total duration: ${data.totalDuration}s`);
    }
  });

  forge.on('scene:start', ({ scene, index, total }) => {
    console.log(`   Scene ${index + 1}/${total}: ${scene.name}`);
  });

  forge.on('retry', ({ stage, attempt, maxRetries, delay }) => {
    console.log(`   ⚠️  Retry ${attempt}/${maxRetries} in ${delay}ms`);
  });

  forge.on('checkpoint', ({ stage, path }) => {
    console.log(`   💾 Checkpoint: ${stage}`);
  });

  // Define the video script
  const script = {
    project: {
      name: 'Agent Demo',
      url: 'http://localhost:3000',
      output: './output',
      viewport: {
        width: 1280,
        height: 720,
      },
    },
    voice: {
      engine: 'edge-tts',
      voice: 'en-US-AndrewMultilingualNeural',
      rate: '-5%',
    },
    scenes: [
      {
        name: 'intro',
        narration: 'Welcome to this automated demo video, generated entirely by an AI agent.',
        actions: [
          { type: 'goto', url: 'http://localhost:3000' },
          { type: 'wait', ms: 2000 },
          { type: 'scroll', dy: 300 },
        ],
      },
      {
        name: 'feature-demo',
        narration: 'Let me show you the main features. First, we click the start button.',
        actions: [
          { type: 'click', selector: 'button.start' },
          { type: 'wait', ms: 1500 },
          { type: 'fill', selector: 'input[name="query"]', text: 'Hello from AI agent' },
          { type: 'press', selector: 'input[name="query"]', key: 'Enter' },
          { type: 'wait', ms: 3000 },
        ],
      },
      {
        name: 'results',
        narration: 'And here are the results. Pretty impressive, right?',
        actions: [
          { type: 'scroll', y: 0 },
          { type: 'wait', ms: 2000 },
          { type: 'screenshot', name: 'final-result' },
        ],
      },
      {
        name: 'outro',
        narration: 'Thanks for watching. This video was created automatically by ClawForge.',
        actions: [
          { type: 'wait', ms: 3000 },
        ],
      },
    ],
  };

  try {
    console.log('🤖 AI Agent: Starting video production...\n');

    // Validate script first
    console.log('🔍 Validating script...');
    const validation = await forge.validate(script);

    if (!validation.valid) {
      console.error('❌ Script validation failed:');
      validation.errors.forEach(err => {
        console.error(`   • ${err.path}: ${err.message}`);
      });
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      validation.warnings.forEach(warn => {
        console.warn(`   • ${warn.path}: ${warn.message}`);
      });
    }

    console.log('✅ Script is valid\n');

    // Check dependencies
    console.log('🔍 Checking dependencies...');
    const deps = await ClawForgeSDK.checkDependencies();

    if (!deps.allInstalled) {
      console.error('❌ Missing dependencies:', deps.missing);
      process.exit(1);
    }

    console.log('✅ All dependencies installed\n');

    // Produce video
    const startTime = Date.now();
    const result = await forge.produce(script);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n🎉 Video production complete!');
    console.log(`📹 Output: ${result.outputPath}`);
    console.log(`⏱️  Duration: ${elapsed}s`);
    console.log(`📊 File size: ${(result.stats.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎬 Scenes: ${result.stats.scenes}`);
    console.log(`🎙️  Narration: ${result.stats.totalNarrationDuration.toFixed(1)}s`);

  } catch (error) {
    console.error('\n❌ Production failed:', error.message);

    if (error.code === ErrorCodes.MISSING_DEPENDENCY) {
      console.error('💡 Install missing dependencies:', error.missing);
    } else if (error.code === ErrorCodes.SELECTOR_NOT_FOUND) {
      console.error('💡 Check if the selector exists:', error.selector);
      console.error('   Scene:', error.scene);
    } else if (error.suggestion) {
      console.error('💡 Suggestion:', error.suggestion);
    }

    if (error.recoverable) {
      console.log('\n🔄 This error is recoverable. You can fix the issue and retry.');
    }

    process.exit(1);
  }
}

main();
