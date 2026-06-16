/**
 * Unit tests: Script Validator + Schema
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateScript } from '../src/schema/validator.js';
import { SCRIPT_SCHEMA, ACTION_TYPES } from '../src/schema/script-schema.js';

/* ───── Schema structure ───── */

test('SCRIPT_SCHEMA has expected top-level keys', () => {
  assert.ok(SCRIPT_SCHEMA.properties);
  assert.ok(SCRIPT_SCHEMA.properties.project);
  assert.ok(SCRIPT_SCHEMA.properties.scenes);
  assert.ok(SCRIPT_SCHEMA.properties.voice);
});

test('SCRIPT_SCHEMA.subtitles exists in project properties', () => {
  const projectSchema = SCRIPT_SCHEMA.properties.project;
  assert.ok(projectSchema);
  assert.ok(projectSchema.properties);
  assert.ok(projectSchema.properties.subtitles, 'schema should have subtitles property in project.properties');
});

test('ACTION_TYPES is an array of valid action types', () => {
  assert.ok(Array.isArray(ACTION_TYPES));
  assert.ok(ACTION_TYPES.includes('goto'));
  assert.ok(ACTION_TYPES.includes('click'));
  assert.ok(ACTION_TYPES.includes('fill'));
  assert.ok(ACTION_TYPES.includes('press'));
  assert.ok(ACTION_TYPES.includes('scroll'));
  assert.ok(ACTION_TYPES.includes('wait'));
  assert.ok(ACTION_TYPES.includes('screenshot'));
});

/* ───── Validation logic ───── */

test('validateScript rejects null', () => {
  const result = validateScript(null);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('validateScript rejects non-object', () => {
  const result = validateScript('string');
  assert.equal(result.valid, false);
});

test('validateScript accepts valid minimal script', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
    },
    scenes: [
      {
        name: 'scene-1',
        actions: [{ type: 'goto', url: 'http://example.com' }],
      },
    ],
  };
  const result = validateScript(script);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateScript rejects empty scenes', () => {
  const script = {
    scenes: [],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.equal(result.valid, false);
});

test('validateScript requires name on scenes', () => {
  const script = {
    scenes: [{ actions: [{ type: 'goto', url: 'https://x' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.path.includes('name')));
});

test('validateScript enforces scene name format', () => {
  const script = {
    scenes: [{ name: 'Bad Name!', actions: [{ type: 'goto', url: 'https://x' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.code === 'INVALID_FORMAT'));
});

test('validateScene: invalid action types', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'fly' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.code === 'INVALID_VALUE'));
});

test('validateAction: goto requires url', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'goto' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('url')));
});

test('validateAction: fill requires selector and text', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'fill', selector: 'input' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('text')));
});

test('validateAction: click requires selector', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'click' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('selector')));
});

test('validateAction: scroll requires y or dy', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'scroll' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  // The error path will be 'scenes[0].actions[0]' — the combined path for the action
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors[0].message.includes('scroll') || result.errors[0].code === 'MISSING_REQUIRED');
});

test('validateAction: wait requires ms', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'wait' }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('ms')));
});

test('validateVoice rejects unsupported engine', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'wait', ms: 1000 }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
    voice: { engine: 'google-tts' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.code === 'UNSUPPORTED_VALUE'));
});

test('validateVoice accepts valid rate format', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'wait', ms: 1000 }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
    voice: { engine: 'edge-tts', rate: '+10%' },
  };
  const result = validateScript(script);
  assert.equal(result.valid, true);
});

test('validateVoice rejects invalid rate format', () => {
  const script = {
    scenes: [{ name: 'test', actions: [{ type: 'wait', ms: 1000 }] }],
    project: { name: 'x', url: 'http://x', output: './out' },
    voice: { engine: 'edge-tts', rate: 'fast' },
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.code === 'INVALID_FORMAT'));
});

/* ───── Subtitles validation ───── */

test('validateScript accepts subtitles: true', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      subtitles: true,
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.equal(result.valid, true);
});

test('validateScript accepts subtitles config object', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      subtitles: { enabled: true, fontSize: 22, lang: 'eng' },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.equal(result.valid, true);
});

test('validateScript rejects invalid subtitles.fontSize', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      subtitles: { enabled: true, fontSize: 999 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('fontSize')));
});

test('validateScript rejects invalid subtitles.marginV', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      subtitles: { marginV: -5 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('marginV')));
});

/* ───── Music validation ───── */

test('validateScript accepts valid music config', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: {
        file: './bgm.mp3',
        volume: 0.3,
        duckLevel: 0.1,
      },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.equal(result.valid, true);
});

test('validateScript rejects music without file', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: { volume: 0.5 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('music') && e.path.includes('file')));
});

test('validateScript warns on unrecognized music format', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: { file: 'bgm.xyz' },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.warnings.some((e) => e.code === 'UNRECOGNIZED_FORMAT'));
});

test('validateScript rejects music.volume out of range', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: { file: 'bgm.mp3', volume: 5 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('volume')));
});

test('validateScript rejects music.duckLevel out of range', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: { file: 'bgm.mp3', duckLevel: 1.5 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('duckLevel')));
});

test('validateScript accepts music.fadeIn and fadeOut', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: { file: 'bgm.wav', fadeIn: 3, fadeOut: 5 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.equal(result.valid, true);
});

test('validateScript rejects music without file string type', () => {
  const script = {
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
      music: { file: 123 },
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  };
  const result = validateScript(script);
  assert.ok(result.errors.some((e) => e.path.includes('file')));
});

test('SCRIPT_SCHEMA has music property in project schema', () => {
  const projectSchema = SCRIPT_SCHEMA.properties.project;
  assert.ok(projectSchema.properties.music, 'schema should have music property in project.properties');
});
