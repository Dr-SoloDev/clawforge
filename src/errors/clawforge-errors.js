/**
 * ClawForge Error System
 * Structured errors with recovery information for AI agents
 */

export const ErrorCodes = {
  // Dependency errors
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  DEPENDENCY_CHECK_FAILED: 'DEPENDENCY_CHECK_FAILED',

  // Script errors
  INVALID_SCRIPT: 'INVALID_SCRIPT',
  SCRIPT_LOAD_FAILED: 'SCRIPT_LOAD_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // Runtime errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  PLAYWRIGHT_ERROR: 'PLAYWRIGHT_ERROR',
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  NAVIGATION_FAILED: 'NAVIGATION_FAILED',

  // Processing errors
  FFMPEG_ERROR: 'FFMPEG_ERROR',
  TTS_ERROR: 'TTS_ERROR',
  AUDIO_GENERATION_FAILED: 'AUDIO_GENERATION_FAILED',
  VIDEO_RECORDING_FAILED: 'VIDEO_RECORDING_FAILED',
  COMPOSITION_FAILED: 'COMPOSITION_FAILED',

  // System errors
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  CHECKPOINT_ERROR: 'CHECKPOINT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export class ClawForgeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ClawForgeError';
    this.code = code;
    this.recoverable = details.recoverable ?? false;
    this.retryable = details.retryable ?? false;
    this.context = details.context || {};
    this.suggestion = details.suggestion || null;
    this.originalError = details.originalError || null;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClawForgeError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      retryable: this.retryable,
      context: this.context,
      suggestion: this.suggestion,
      stack: this.stack,
    };
  }

  static fromError(error, code = ErrorCodes.UNKNOWN_ERROR, context = {}) {
    if (error instanceof ClawForgeError) {
      return error;
    }

    return new ClawForgeError(code, error.message, {
      originalError: error,
      context,
      recoverable: false,
      retryable: false,
    });
  }
}

export class DependencyError extends ClawForgeError {
  constructor(missing, message) {
    super(
      ErrorCodes.MISSING_DEPENDENCY,
      message || `Missing dependencies: ${missing.join(', ')}`,
      {
        recoverable: true,
        retryable: false,
        context: { missing },
        suggestion: `Install missing dependencies: ${missing.join(', ')}`,
      }
    );
    this.missing = missing;
  }
}

export class ValidationError extends ClawForgeError {
  constructor(errors, message) {
    super(
      ErrorCodes.VALIDATION_FAILED,
      message || 'Script validation failed',
      {
        recoverable: true,
        retryable: false,
        context: { errors },
        suggestion: 'Fix validation errors in your script',
      }
    );
    this.validationErrors = errors;
  }
}

export class NetworkError extends ClawForgeError {
  constructor(url, message, originalError) {
    super(
      ErrorCodes.NETWORK_TIMEOUT,
      message || `Network timeout: ${url}`,
      {
        recoverable: false,
        retryable: true,
        context: { url },
        suggestion: 'Check network connection and URL accessibility',
        originalError,
      }
    );
    this.url = url;
  }
}

export class PlaywrightError extends ClawForgeError {
  constructor(action, message, originalError) {
    super(
      ErrorCodes.PLAYWRIGHT_ERROR,
      message || `Playwright error during ${action}`,
      {
        recoverable: false,
        retryable: true,
        context: { action },
        suggestion: 'Check if the target element exists and is interactable',
        originalError,
      }
    );
    this.action = action;
  }
}

export class SelectorError extends ClawForgeError {
  constructor(selector, scene, originalError) {
    super(
      ErrorCodes.SELECTOR_NOT_FOUND,
      `Selector not found: ${selector} in scene "${scene}"`,
      {
        recoverable: false,
        retryable: true,
        context: { selector, scene },
        suggestion: 'Verify the selector exists in the page or increase wait time',
        originalError,
      }
    );
    this.selector = selector;
    this.scene = scene;
  }
}

export class FFmpegError extends ClawForgeError {
  constructor(operation, message, originalError) {
    super(
      ErrorCodes.FFMPEG_ERROR,
      message || `FFmpeg error during ${operation}`,
      {
        recoverable: false,
        retryable: false,
        context: { operation },
        suggestion: 'Check ffmpeg installation and input files',
        originalError,
      }
    );
    this.operation = operation;
  }
}

export class TTSError extends ClawForgeError {
  constructor(scene, message, originalError) {
    super(
      ErrorCodes.TTS_ERROR,
      message || `TTS generation failed for scene "${scene}"`,
      {
        recoverable: false,
        retryable: true,
        context: { scene },
        suggestion: 'Check edge-tts installation and network connection',
        originalError,
      }
    );
    this.scene = scene;
  }
}
