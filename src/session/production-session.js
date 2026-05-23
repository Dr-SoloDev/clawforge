/**
 * Production Session
 * Manages video production lifecycle with checkpointing and event emission
 */

import { EventEmitter } from 'events';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { narrate } from '../narrator.js';
import { record } from '../recorder.js';
import { compose } from '../composer.js';
import { ClawForgeError, ErrorCodes, TTSError, PlaywrightError, FFmpegError } from '../errors/clawforge-errors.js';

export class ProductionSession extends EventEmitter {
  constructor(script, sdk, options = {}) {
    super();

    this.script = script;
    this.sdk = sdk;
    this.options = options;

    this.state = {
      stage: 'init',
      startTime: Date.now(),
      completedScenes: [],
      narrationFiles: {},
      audioDurations: [],
      videoPath: null,
      outputPath: null,
      checkpoints: [],
    };

    this.checkpointDir = resolve(options.checkpointDir || './.clawforge-checkpoints');
    this.retryPolicy = options.retryPolicy || sdk.options.retryPolicy;
  }

  async run() {
    try {
      await this.checkpoint('start');

      if (this.state.stage === 'init' || this.state.stage === 'start') {
        await this.generateNarration();
      }

      if (this.state.stage === 'narration-complete') {
        await this.recordVideo();
      }

      if (this.state.stage === 'recording-complete') {
        await this.composeVideo();
      }

      const result = {
        success: true,
        outputPath: this.state.outputPath,
        duration: Date.now() - this.state.startTime,
        stats: {
          scenes: this.script.scenes.length,
          totalNarrationDuration: this.state.audioDurations.reduce((a, b) => a + b, 0),
          fileSize: existsSync(this.state.outputPath)
            ? require('fs').statSync(this.state.outputPath).size
            : 0,
        },
      };

      await this.checkpoint('complete', result);

      return result;
    } catch (error) {
      await this.checkpoint('error', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async generateNarration() {
    this.emit('stage:start', {
      stage: 'narration',
      timestamp: Date.now(),
      total: this.script.scenes.filter(s => s.narration).length,
    });

    try {
      const result = await this.retryPolicy.execute(
        async () => await narrate(this.script),
        {
          onRetry: ({ attempt, maxRetries, delay, error }) => {
            this.emit('retry', {
              stage: 'narration',
              attempt,
              maxRetries,
              delay,
              error: error.message,
            });
          },
        }
      );

      this.state.narrationFiles = result.audioDir;
      this.state.audioDurations = result.durations;

      await this.checkpoint('narration-complete', {
        audioDir: result.audioDir,
        durations: result.durations,
      });

      this.emit('stage:complete', {
        stage: 'narration',
        timestamp: Date.now(),
        audioDir: result.audioDir,
        totalDuration: result.durations.reduce((a, b) => a + b, 0),
      });
    } catch (error) {
      throw new TTSError(
        'narration',
        `Failed to generate narration: ${error.message}`,
        error
      );
    }
  }

  async recordVideo() {
    this.emit('stage:start', {
      stage: 'recording',
      timestamp: Date.now(),
      total: this.script.scenes.length,
    });

    try {
      const videoPath = await this.retryPolicy.execute(
        async () => await record(this.script, this.state.audioDurations),
        {
          onRetry: ({ attempt, maxRetries, delay, error }) => {
            this.emit('retry', {
              stage: 'recording',
              attempt,
              maxRetries,
              delay,
              error: error.message,
            });
          },
        }
      );

      this.state.videoPath = videoPath;

      await this.checkpoint('recording-complete', {
        videoPath,
      });

      this.emit('stage:complete', {
        stage: 'recording',
        timestamp: Date.now(),
        videoPath,
      });
    } catch (error) {
      throw new PlaywrightError(
        'recording',
        `Failed to record video: ${error.message}`,
        error
      );
    }
  }

  async composeVideo() {
    this.emit('stage:start', {
      stage: 'composition',
      timestamp: Date.now(),
    });

    try {
      const outputPath = await this.retryPolicy.execute(
        async () => await compose(
          this.state.videoPath,
          this.state.narrationFiles,
          this.script.scenes,
          this.script.project.output
        ),
        {
          onRetry: ({ attempt, maxRetries, delay, error }) => {
            this.emit('retry', {
              stage: 'composition',
              attempt,
              maxRetries,
              delay,
              error: error.message,
            });
          },
        }
      );

      this.state.outputPath = outputPath;

      await this.checkpoint('composition-complete', {
        outputPath,
      });

      this.emit('stage:complete', {
        stage: 'composition',
        timestamp: Date.now(),
        outputPath,
      });
    } catch (error) {
      throw new FFmpegError(
        'composition',
        `Failed to compose video: ${error.message}`,
        error
      );
    }
  }

  async checkpoint(stage, data = {}) {
    this.state.stage = stage;
    this.state.timestamp = Date.now();
    Object.assign(this.state, data);

    mkdirSync(this.checkpointDir, { recursive: true });

    const checkpointPath = join(
      this.checkpointDir,
      `${this.script.project.name}-${stage}-${Date.now()}.json`
    );

    const checkpointData = {
      ...this.state,
      script: this.script,
      options: this.options,
    };

    writeFileSync(checkpointPath, JSON.stringify(checkpointData, null, 2));

    this.state.checkpoints.push(checkpointPath);

    this.emit('checkpoint', {
      stage,
      path: checkpointPath,
      state: this.state,
    });

    return checkpointPath;
  }

  static async fromCheckpoint(checkpointPath, sdk) {
    if (!existsSync(checkpointPath)) {
      throw new ClawForgeError(
        ErrorCodes.CHECKPOINT_ERROR,
        `Checkpoint file not found: ${checkpointPath}`,
        {
          recoverable: false,
          retryable: false,
        }
      );
    }

    const checkpointData = JSON.parse(readFileSync(checkpointPath, 'utf-8'));

    const session = new ProductionSession(
      checkpointData.script,
      sdk,
      checkpointData.options
    );

    session.state = checkpointData;

    return session;
  }
}
