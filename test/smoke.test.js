/**
 * Smoke test: validate core functionality without running full pipeline
 * Run: node test/smoke.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ClawForgeSDK } from '../src/sdk/clawforge-sdk.js';
import { loadScript } from '../src/script-loader.js';

test('SDK can be instantiated', () => {
  const forge = new ClawForgeSDK({ skipDependencyCheck: true });
  assert.ok(forge);
  assert.ok(typeof forge.produce === 'function');
  assert.ok(typeof forge.validate === 'function');
  assert.ok(typeof forge.dryRun === 'function');
});

test('Script loader parses example YAML', async () => {
  const script = await loadScript('./examples/demo-script.yaml');
  assert.equal(script.project.name, 'My App Demo');
  assert.equal(script.scenes.length, 4);
  assert.equal(script.voice.engine, 'edge-tts');
});

test('Script loader parses self-demo YAML', async () => {
  const script = await loadScript('./examples/clawforge-self-demo.yaml');
  assert.equal(script.project.name, 'ClawForge Demo');
  assert.equal(script.scenes.length, 4);
});

test('Self-demo YAML has subtitles enabled', async () => {
  const script = await loadScript('./examples/clawforge-self-demo.yaml');
  assert.equal(script.project.subtitles, true);
});

test('Demo YAML has music config', async () => {
  const script = await loadScript('./examples/demo-script.yaml');
  assert.ok(script.project.music);
  assert.equal(typeof script.project.music.file, 'string');
  assert.equal(typeof script.project.music.volume, 'number');
  assert.equal(typeof script.project.music.duckLevel, 'number');
  assert.equal(typeof script.project.music.fadeIn, 'number');
  assert.equal(typeof script.project.music.fadeOut, 'number');
  assert.equal(script.project.music.loop, true);
});
test('Demo YAML has subtitles config object', async () => {
  const script = await loadScript('./examples/demo-script.yaml');
  assert.ok(script.project.subtitles);
  assert.equal(script.project.subtitles.enabled, true);
  assert.equal(script.project.subtitles.lang, 'eng');
  assert.equal(script.project.subtitles.fontSize, 22);
});

test('Validator accepts valid script', async () => {
  const forge = new ClawForgeSDK({ skipDependencyCheck: true });
  const result = await forge.validate('./examples/demo-script.yaml');
  assert.equal(result.valid, true);
});

test('Validator rejects invalid script', async () => {
  const forge = new ClawForgeSDK({ skipDependencyCheck: true });
  const invalid = {
    project: { name: 'bad', url: 'http://x', output: './out' },
    scenes: [], // empty scenes should fail
  };
  const result = await forge.validate(invalid);
  assert.equal(result.valid, false);
});

test('Dry run on valid script returns expected shape', async () => {
  const forge = new ClawForgeSDK({ skipDependencyCheck: true });
  const result = await forge.dryRun('./examples/demo-script.yaml');
  assert.ok('valid' in result || 'validation' in result);
});

test('checkDependencies returns object', async () => {
  const deps = await ClawForgeSDK.checkDependencies();
  assert.ok(typeof deps === 'object');
});
