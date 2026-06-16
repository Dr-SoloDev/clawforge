/**
 * Unit tests: ClawForge Error Classes
 * Updated to match actual implementation
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ClawForgeError,
  TTSError,
  PlaywrightError,
  FFmpegError,
  ValidationError,
  ErrorCodes,
} from '../src/errors/clawforge-errors.js';

test('ClawForgeError is base error class', () => {
  const err = new ClawForgeError('TEST', 'Something went wrong');
  assert.ok(err instanceof Error);
  assert.ok(err instanceof ClawForgeError);
  assert.equal(err.code, 'TEST');
  assert.equal(err.message, 'Something went wrong');
  assert.equal(err.name, 'ClawForgeError');
});

test('ClawForgeError stores details', () => {
  const details = { recoverable: true, retryable: false, suggestion: 'try again' };
  const err = new ClawForgeError('TEST', 'msg', details);
  assert.equal(err.recoverable, true);
  assert.equal(err.retryable, false);
  assert.equal(err.suggestion, 'try again');
});

test('TTSError extends ClawForgeError', () => {
  const err = new TTSError('intro-scene', 'TTS failed');
  assert.ok(err instanceof TTSError);
  assert.ok(err instanceof ClawForgeError);
  assert.equal(err.code, 'TTS_ERROR');
  assert.equal(err.scene, 'intro-scene');
});

test('TTSError wraps originalError', () => {
  const cause = new Error('network timeout');
  const err = new TTSError('intro', 'TTS failed', cause);
  assert.equal(err.originalError, cause);
});

test('PlaywrightError extends ClawForgeError', () => {
  const err = new PlaywrightError('click-selector', 'Browser crashed');
  assert.ok(err instanceof PlaywrightError);
  assert.equal(err.code, 'PLAYWRIGHT_ERROR');
  assert.equal(err.action, 'click-selector');
});

test('FFmpegError extends ClawForgeError', () => {
  const err = new FFmpegError('merge', 'ffmpeg failed');
  assert.ok(err instanceof FFmpegError);
  assert.equal(err.code, 'FFMPEG_ERROR');
  assert.equal(err.operation, 'merge');
});

test('ValidationError extends ClawForgeError', () => {
  const err = new ValidationError([{ path: 'scenes[0]', message: 'missing name' }]);
  assert.ok(err instanceof ValidationError);
  assert.equal(err.code, 'VALIDATION_FAILED');
  assert.ok(Array.isArray(err.validationErrors));
});

test('ClawForgeError toJSON includes expected keys', () => {
  const err = new ClawForgeError('TEST', 'msg', { recoverable: true });
  const json = err.toJSON();
  assert.equal(json.code, 'TEST');
  assert.equal(json.recoverable, true);
  assert.equal(json.suggestion, null);
});

test('ErrorCodes contains expected constants', () => {
  assert.equal(ErrorCodes.TTS_ERROR, 'TTS_ERROR');
  assert.equal(ErrorCodes.PLAYWRIGHT_ERROR, 'PLAYWRIGHT_ERROR');
  assert.equal(ErrorCodes.FFMPEG_ERROR, 'FFMPEG_ERROR');
  assert.equal(ErrorCodes.CHECKPOINT_ERROR, 'CHECKPOINT_ERROR');
  assert.equal(ErrorCodes.INVALID_SCRIPT, 'INVALID_SCRIPT');
});
