/**
 * ClawForge TypeScript Example
 * Demonstrates type-safe usage with TypeScript
 */

import {
  ClawForgeSDK,
  ClawForgeScript,
  ProductionResult,
  ValidationResult,
  ClawForgeError,
  ErrorCodes,
  RetryPolicy,
} from 'clawforge';

async function produceVideo(): Promise<void> {
  // Type-safe script definition
  const script: ClawForgeScript = {
    project: {
      name: 'TypeScript Demo',
      url: 'http://localhost:3000',
      output: './output',
      viewport: {
        width: 1920,
        height: 1080,
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
        narration: 'This is a type-safe demo video.',
        actions: [
          { type: 'goto', url: 'http://localhost:3000' },
          { type: 'wait', ms: 2000 },
        ],
      },
      {
        name: 'demo',
        narration: 'TypeScript ensures type safety at compile time.',
        actions: [
          { type: 'click', selector: 'button.demo' },
          { type: 'fill', selector: 'input', text: 'TypeScript rocks!' },
          { type: 'press', key: 'Enter' },
          { type: 'wait', ms: 3000 },
        ],
      },
    ],
  };

  // Create SDK with typed options
  const forge = new ClawForgeSDK({
    checkpointDir: './checkpoints',
    verbose: true,
    retryPolicy: new RetryPolicy({
      maxRetries: 3,
      backoffStrategy: 'exponential',
    }),
  });

  // Type-safe event handlers
  forge.on('stage:start', (data) => {
    console.log(`Starting: ${data.stage}`);
  });

  forge.on('progress', (data) => {
    if (data.percent !== undefined) {
      console.log(`Progress: ${data.percent}%`);
    }
  });

  forge.on('error', (data) => {
    console.error('Error:', data.error.message);
    console.error('Recoverable:', data.recoverable);
  });

  try {
    // Validate with typed result
    const validation: ValidationResult = await forge.validate(script);

    if (!validation.valid) {
      console.error('Validation errors:');
      validation.errors.forEach((err) => {
        console.error(`  ${err.path}: ${err.message} (${err.code})`);
      });
      return;
    }

    // Produce with typed result
    const result: ProductionResult = await forge.produce(script);

    console.log('Success!');
    console.log('Output:', result.outputPath);
    console.log('Duration:', result.duration, 'ms');
    console.log('Stats:', result.stats);

  } catch (error) {
    if (error instanceof ClawForgeError) {
      console.error('ClawForge Error:', error.code);
      console.error('Message:', error.message);

      // Type-safe error code checking
      switch (error.code) {
        case ErrorCodes.MISSING_DEPENDENCY:
          console.error('Install dependencies first');
          break;
        case ErrorCodes.SELECTOR_NOT_FOUND:
          console.error('Check your selectors');
          break;
        case ErrorCodes.NETWORK_TIMEOUT:
          console.error('Check network connection');
          break;
        default:
          console.error('Unknown error');
      }

      if (error.suggestion) {
        console.log('Suggestion:', error.suggestion);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

produceVideo();
