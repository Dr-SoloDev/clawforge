/**
 * ClawForge SDK - Main Entry Point
 * Programmatic API for AI agents
 */

import { EventEmitter } from 'events';
import { resolve } from 'path';
import { loadScript } from '../script-loader.js';
import { checkAllDependencies, getDependencyInstallInstructions } from '../utils/deps.js';
import { DependencyError, ClawForgeError, ErrorCodes } from '../errors/clawforge-errors.js';
import { RetryPolicy, DEFAULT_RETRY_POLICY } from '../errors/retry-policy.js';
import { ProductionSession } from '../session/production-session.js';
import { validateScript } from '../schema/validator.js';

export class ClawForgeSDK extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      checkpointDir: options.checkpointDir || './.clawforge-checkpoints',
      retryPolicy: options.retryPolicy instanceof RetryPolicy
        ? options.retryPolicy
        : new RetryPolicy(options.retryPolicy || {}),
      skipDependencyCheck: options.skipDependencyCheck ?? false,
      verbose: options.verbose ?? false,
    };
  }

  async produce(scriptOrPath, options = {}) {
    try {
      this.emit('start', { timestamp: Date.now() });

      if (!this.options.skipDependencyCheck) {
        await this._checkDependencies();
      }

      const script = await this._loadAndValidate(scriptOrPath, options);

      const session = new ProductionSession(script, this, {
        checkpointDir: this.options.checkpointDir,
        retryPolicy: this.options.retryPolicy,
        ...options,
      });

      session.on('progress', (data) => this.emit('progress', data));
      session.on('stage:start', (data) => this.emit('stage:start', data));
      session.on('stage:complete', (data) => this.emit('stage:complete', data));
      session.on('scene:start', (data) => this.emit('scene:start', data));
      session.on('scene:complete', (data) => this.emit('scene:complete', data));
      session.on('checkpoint', (data) => this.emit('checkpoint', data));
      session.on('error', (data) => this.emit('error', data));

      const result = await session.run();

      this.emit('complete', result);

      return result;
    } catch (error) {
      const clawError = error instanceof ClawForgeError
        ? error
        : ClawForgeError.fromError(error);

      this.emit('error', {
        error: clawError,
        recoverable: clawError.recoverable,
        retryable: clawError.retryable,
      });

      throw clawError;
    }
  }

  async validate(scriptOrPath) {
    try {
      const script = typeof scriptOrPath === 'string'
        ? loadScript(resolve(scriptOrPath))
        : scriptOrPath;

      const validation = validateScript(script);

      return validation;
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: '',
          message: error.message,
          code: 'SCRIPT_LOAD_ERROR',
        }],
        warnings: [],
      };
    }
  }

  async dryRun(scriptOrPath, options = {}) {
    const validation = await this.validate(scriptOrPath);

    if (!validation.valid) {
      return {
        success: false,
        validation,
      };
    }

    const deps = await ClawForgeSDK.checkDependencies();

    return {
      success: deps.allInstalled,
      validation,
      dependencies: deps,
    };
  }

  async resume(checkpointPath) {
    const session = await ProductionSession.fromCheckpoint(checkpointPath, this);

    session.on('progress', (data) => this.emit('progress', data));
    session.on('stage:start', (data) => this.emit('stage:start', data));
    session.on('stage:complete', (data) => this.emit('stage:complete', data));
    session.on('scene:start', (data) => this.emit('scene:start', data));
    session.on('scene:complete', (data) => this.emit('scene:complete', data));
    session.on('checkpoint', (data) => this.emit('checkpoint', data));
    session.on('error', (data) => this.emit('error', data));

    const result = await session.run();

    this.emit('complete', result);

    return result;
  }

  static async checkDependencies() {
    return await checkAllDependencies();
  }

  async _checkDependencies() {
    this.emit('stage:start', { stage: 'dependency-check', timestamp: Date.now() });

    const deps = await checkAllDependencies();

    if (!deps.allInstalled) {
      const instructions = getDependencyInstallInstructions(deps.missing);
      throw new DependencyError(
        deps.missing,
        `Missing dependencies: ${deps.missing.join(', ')}\n\n${instructions.join('\n')}`
      );
    }

    this.emit('stage:complete', {
      stage: 'dependency-check',
      timestamp: Date.now(),
      dependencies: deps.dependencies,
    });

    return deps;
  }

  async _loadAndValidate(scriptOrPath, options = {}) {
    this.emit('stage:start', { stage: 'load-script', timestamp: Date.now() });

    let script;

    if (typeof scriptOrPath === 'string') {
      script = loadScript(resolve(scriptOrPath));
    } else {
      script = scriptOrPath;
    }

    if (options.output) {
      script.project.output = resolve(options.output);
    } else {
      script.project.output = resolve(script.project.output);
    }

    this.emit('stage:complete', {
      stage: 'load-script',
      timestamp: Date.now(),
      script: {
        name: script.project.name,
        scenes: script.scenes.length,
        voice: script.voice.voice,
      },
    });

    this.emit('stage:start', { stage: 'validate-script', timestamp: Date.now() });

    const validation = validateScript(script);

    if (!validation.valid) {
      throw new ClawForgeError(
        ErrorCodes.VALIDATION_FAILED,
        'Script validation failed',
        {
          recoverable: true,
          retryable: false,
          context: { errors: validation.errors },
          suggestion: 'Fix validation errors in your script',
        }
      );
    }

    this.emit('stage:complete', {
      stage: 'validate-script',
      timestamp: Date.now(),
      validation,
    });

    return script;
  }
}
