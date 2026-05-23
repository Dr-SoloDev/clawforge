/**
 * Retry Policy
 * Configurable retry logic for recoverable errors
 */

import { ErrorCodes } from './clawforge-errors.js';

export class RetryPolicy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.initialDelay = options.initialDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.backoffStrategy = options.backoffStrategy ?? 'exponential'; // 'exponential' | 'linear' | 'constant'

    this.retryableErrors = new Set(options.retryableErrors ?? [
      ErrorCodes.NETWORK_TIMEOUT,
      ErrorCodes.PLAYWRIGHT_ERROR,
      ErrorCodes.SELECTOR_NOT_FOUND,
      ErrorCodes.TTS_ERROR,
      ErrorCodes.NAVIGATION_FAILED,
    ]);
  }

  isRetryable(error) {
    if (error.retryable !== undefined) {
      return error.retryable;
    }
    return this.retryableErrors.has(error.code);
  }

  getDelay(attemptNumber) {
    switch (this.backoffStrategy) {
      case 'exponential':
        return Math.min(
          this.initialDelay * Math.pow(this.backoffMultiplier, attemptNumber),
          this.maxDelay
        );

      case 'linear':
        return Math.min(
          this.initialDelay + (attemptNumber * this.initialDelay),
          this.maxDelay
        );

      case 'constant':
      default:
        return this.initialDelay;
    }
  }

  async execute(fn, context = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxRetries || !this.isRetryable(error)) {
          throw error;
        }

        const delay = this.getDelay(attempt);

        if (context.onRetry) {
          context.onRetry({
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            delay,
            error,
          });
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

export const DEFAULT_RETRY_POLICY = new RetryPolicy();
