/**
 * Unit tests: SRT subtitle generator
 * Tests pure subtitle generation logic with various scene + duration combos
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSRT } from '../src/subtitles/generator.js';

test('generateSRT produces valid SRT format', () => {
  const scenes = [
    { name: 'intro', narration: 'Hello world.' },
    { name: 'demo', narration: 'This is a demo.' },
  ];
  const durations = [4.5, 6.2];

  const srt = generateSRT(scenes, durations);

  // SRT format: index number + blank line + timecode + blank line + text + blank line
  assert.ok(srt.startsWith('1\n'));
  assert.ok(srt.includes(' --> '));
  assert.ok(srt.includes('Hello world.'));
  assert.ok(srt.includes('This is a demo.'));
});

test('generateSRT shows correct timing — cumulative per clip', () => {
  const scenes = [
    { name: 'a', narration: 'First clip.' },
    { name: 'b', narration: 'Second clip.' },
    { name: 'c', narration: 'Third clip.' },
  ];
  const durations = [3.0, 2.5, 4.0];

  const srt = generateSRT(scenes, durations);

  // Clip 1: 0:00.000 → 0:03.000
  assert.ok(srt.includes('00:00:00,000 --> 00:00:03,000'));
  // Clip 2: 0:03.000 → 0:05.500
  assert.ok(srt.includes('00:00:03,000 --> 00:00:05,500'));
  // Clip 3: 0:05.500 → 0:09.500
  assert.ok(srt.includes('00:00:05,500 --> 00:00:09,500'));
});

test('generateSRT skips scenes without narration', () => {
  const scenes = [
    { name: 'intro', narration: 'Has narration.' },
    { name: 'silent', narration: '' },
    { name: 'demo', narration: 'Also has narration.' },
  ];
  const durations = [4.0, 0, 3.5];

  const srt = generateSRT(scenes, durations);

  // Should only contain 2 subtitle entries
  const entries = srt.trim().split('\n\n');
  assert.equal(entries.length, 2);
  assert.ok(entries[0].includes('Has narration.'));
  assert.ok(entries[1].includes('Also has narration.'));
});

test('generateSRT handles scenes with undefined narration', () => {
  const scenes = [
    { name: 'intro', narration: 'Welcome.' },
    { name: 'no-narration', actions: [{ type: 'wait', ms: 3000 }] },
    { name: 'outro', narration: 'Goodbye.' },
  ];
  const durations = [3.0, 0, 2.0];

  const srt = generateSRT(scenes, durations);
  const entries = srt.trim().split('\n\n');
  assert.equal(entries.length, 2);
});

test('generateSRT handles empty scene array', () => {
  const srt = generateSRT([], []);
  assert.equal(srt, '');
});

test('generateSRT handles single scene', () => {
  const scenes = [{ name: 'solo', narration: 'Just one scene.' }];
  const durations = [5.0];

  const srt = generateSRT(scenes, durations);
  assert.ok(srt.includes('Just one scene.'));
  assert.ok(srt.includes('00:00:00,000 --> 00:00:05,000'));
});

test('generateSRT handles special characters in narration', () => {
  const scenes = [
    { name: 'chars', narration: 'Over 90% of users agree: it\'s "awesome" & fast!' },
  ];
  const durations = [3.0];

  const srt = generateSRT(scenes, durations);
  assert.ok(srt.includes('Over 90%'));
  assert.ok(srt.includes('&'));
});

test('generateSRT handles very long narration text', () => {
  const longNarration = 'A. '.repeat(200).trim();
  const scenes = [{ name: 'long', narration: longNarration }];
  const durations = [60.0];

  const srt = generateSRT(scenes, durations);
  // Should contain the full text
  assert.equal(srt.trim().split('\n').slice(-1)[0].trim(), longNarration);
});
