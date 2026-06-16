/**
 * Tests for Audio Ducking Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildNarrationTimeline,
  buildDuckingFilter,
  calculateTotalDuration,
} from '../src/music/ducker.js';

describe('buildNarrationTimeline', () => {
  it('should build empty timeline for no narration', () => {
    const scenes = [
      { name: 's1', actions: [{ type: 'goto', url: 'https://example.com' }] },
    ];
    const durations = [0];
    const result = buildNarrationTimeline(scenes, durations);
    assert.deepEqual(result, []);
  });

  it('should build single narration segment', () => {
    const scenes = [
      { name: 's1', narration: 'Hello world', actions: [{ type: 'wait', ms: 1000 }] },
    ];
    const durations = [3.5];
    const result = buildNarrationTimeline(scenes, durations);
    assert.equal(result.length, 1);
    assert.equal(result[0].start, 0);
    assert.equal(result[0].end, 3.5);
  });

  it('should build multiple segments with gaps', () => {
    const scenes = [
      { name: 's1', narration: 'First', actions: [{ type: 'wait', ms: 1000 }] },
      { name: 's2', narration: 'Second', actions: [{ type: 'wait', ms: 1000 }] },
      { name: 's3', narration: 'Third', actions: [{ type: 'wait', ms: 1000 }] },
    ];
    const durations = [2.0, 3.0, 1.5];
    const result = buildNarrationTimeline(scenes, durations);
    assert.equal(result.length, 3);

    // s1: 0 → 2.0, gap 1.5s
    assert.equal(result[0].start, 0);
    assert.equal(result[0].end, 2.0);

    // s2: 2.0 + 1.5 = 3.5 → 3.5 + 3.0 = 6.5
    assert.equal(result[1].start, 3.5);
    assert.equal(result[1].end, 6.5);

    // s3: 6.5 + 1.5 = 8.0 → 8.0 + 1.5 = 9.5
    assert.equal(result[2].start, 8.0);
    assert.equal(result[2].end, 9.5);
  });

  it('should skip scenes without narration', () => {
    const scenes = [
      { name: 's1', narration: 'First', actions: [{ type: 'wait', ms: 1000 }] },
      { name: 's2', actions: [{ type: 'screenshot', name: 'shot' }] },
      { name: 's3', narration: 'Third', actions: [{ type: 'wait', ms: 1000 }] },
    ];
    const durations = [2.0, 0, 1.5];
    const result = buildNarrationTimeline(scenes, durations);
    assert.equal(result.length, 2);

    assert.equal(result[0].start, 0);
    assert.equal(result[0].end, 2.0);

    // s3 starts after s1 (2.0) + gap (1.5) = 3.5, but also gap after s2 (another 1.5)
    // Actually s2 has no narration, so it just advances by GAP_MS
    // So: s1 ends at 2.0, +1.5 gap = 3.5, +1.5 gap for s2 = 5.0
    assert.equal(result[1].start, 5.0);
    assert.equal(result[1].end, 6.5); // 5.0 + 1.5
  });

  it('should handle single scene with 0 duration narration', () => {
    const scenes = [
      { name: 's1', narration: 'Empty', actions: [{ type: 'wait', ms: 1000 }] },
    ];
    const durations = [0];
    const result = buildNarrationTimeline(scenes, durations);
    assert.deepEqual(result, []);
  });
});

describe('buildDuckingFilter', () => {
  it('should return pass-through filter for empty segments', () => {
    const result = buildDuckingFilter([], 0.1);
    assert.equal(result, '[1:a]acopy[bgm_ducked]');
  });

  it('should return pass-through filter for null segments', () => {
    const result = buildDuckingFilter(null, 0.1);
    assert.equal(result, '[1:a]acopy[bgm_ducked]');
  });

  it('should generate enable expression for single segment', () => {
    const segments = [{ start: 0, end: 3.5 }];
    const result = buildDuckingFilter(segments, 0.15);
    assert.match(result, /volume=enable='between\(t,0,3.5\)'/);
    assert.match(result, /volume=0\.15/);
    assert.ok(result.endsWith('[bgm_ducked]'));
  });

  it('should generate enable expression for multiple segments', () => {
    const segments = [
      { start: 0, end: 2.0 },
      { start: 3.5, end: 6.5 },
      { start: 8.0, end: 9.5 },
    ];
    const result = buildDuckingFilter(segments, 0.1);
    assert.match(result, /between\(t,0,2\)/);
    assert.match(result, /between\(t,3\.5,6\.5\)/);
    assert.match(result, /between\(t,8,9\.5\)/);
    // Should have all 3 conditions joined by +
    const plusCount = (result.match(/\+between/g) || []).length;
    assert.equal(plusCount, 2);
  });

  it('should use default duckLevel of 0.1', () => {
    const segments = [{ start: 0, end: 5 }];
    const result = buildDuckingFilter(segments);
    assert.match(result, /volume=0\.1/);
  });
});

describe('calculateTotalDuration', () => {
  it('should return 0 for no scenes', () => {
    assert.equal(calculateTotalDuration([], []), 0);
  });

  it('should calculate single scene duration', () => {
    const scenes = [
      { name: 's1', narration: 'Hello', actions: [] },
    ];
    assert.equal(calculateTotalDuration(scenes, [4.0]), 4.0);
  });

  it('should calculate duration with gaps', () => {
    const scenes = [
      { name: 's1', narration: 'First', actions: [] },
      { name: 's2', narration: 'Second', actions: [] },
      { name: 's3', narration: 'Third', actions: [] },
    ];
    // 2.0 + 1.5 gap + 3.0 + 1.5 gap + 1.5 = 9.5 (no trailing gap)
    // Wait, GAP_MS=1500, so:
    // 2.0 + 1.5 + 3.0 + 1.5 + 1.5 = 9.5
    // No trailing gap? Let me recalculate:
    // s1: 2.0, +gap 1.5 = 3.5 (position of s2 start)
    // s2: 3.0, +gap 1.5 = 5.0 (position of s3 start) 
    // s3: 1.5
    // Total: 2.0 + 1.5 + 3.0 + 1.5 + 1.5 = 9.5
    // Subtract trailing gap? No... wait.
    // In calculateTotalDuration:
    // For each scene: total += duration[i], total += GAP_MS/1000
    // After loop: subtract GAP_MS/1000 from total
    // So: (2.0 + 1.5) + (3.0 + 1.5) + (1.5 + 1.5) - 1.5 = 9.5
    // Hmm that's (2.0+1.5+3.0+1.5+1.5+1.5) - 1.5 = 9.5? Let me compute...
    // (3.5) + (4.5) + (3.0) = 11.0... minus 1.5 = 9.5
    // Hmm no: total after loop = 2+1.5+3+1.5+1.5+1.5 = 11.0
    // minus 1.5 = 9.5. But wait:
    // s1: 2.0 + 1.5 = 3.5
    // s2: 3.0 + 1.5 = 4.5 (cumulative: 3.5+4.5=8.0)
    // s3: 1.5 + 1.5 = 3.0 (cumulative: 8.0+3.0=11.0)
    // minus gap for last scene: 11.0 - 1.5 = 9.5
    // So total is 9.5
    const result = calculateTotalDuration(scenes, [2.0, 3.0, 1.5]);
    assert.equal(result, 9.5);
  });

  it('should include scenes without narration in gap calculation', () => {
    const scenes = [
      { name: 's1', narration: 'First', actions: [] },
      { name: 's2', actions: [{ type: 'screenshot' }] },
    ];
    // s1: 2.0 + 1.5 = 3.5
    // s2: 0 + 1.5 = 1.5 (cumulative: 3.5+1.5=5.0)
    // minus trailing gap: 5.0 - 1.5 = 3.5
    const result = calculateTotalDuration(scenes, [2.0, 0]);
    assert.equal(result, 3.5);
  });
});
