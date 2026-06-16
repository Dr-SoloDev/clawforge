/**
 * Tests for Webcam Overlay Engine + Schema + Validator
 * Run: node --test test/webcam.test.js
 */

import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWebcamOverlay,
  calcOverlayX,
  calcOverlayY,
} from '../src/webcam/overlay.js';
import { SCRIPT_SCHEMA } from '../src/schema/script-schema.js';
import { validateScript } from '../src/schema/validator.js';

/* ──── Schema ──── */

test('SCRIPT_SCHEMA has webcam in project properties', () => {
  const projectSchema = SCRIPT_SCHEMA.properties.project;
  assert.ok(projectSchema.properties.webcam,
    'schema should have webcam property in project.properties');
});

test('webcam schema has all required fields', () => {
  const webcamSchema = SCRIPT_SCHEMA.properties.project.properties.webcam;
  assert.ok(webcamSchema.properties.file);
  assert.ok(webcamSchema.properties.position);
  assert.ok(webcamSchema.properties.width);
  assert.ok(webcamSchema.properties.height);
  assert.ok(webcamSchema.properties.crop);
  assert.ok(webcamSchema.properties.border);
  assert.ok(webcamSchema.properties.margin);
});

test('webcam schema enums are correct', () => {
  const webcamSchema = SCRIPT_SCHEMA.properties.project.properties.webcam;
  assert.deepEqual(webcamSchema.properties.position.enum,
    ['bottom-left', 'bottom-right', 'top-left', 'top-right']);
  assert.deepEqual(webcamSchema.properties.crop.enum,
    ['rectangle', 'circle']);
});

test('webcam schema default values', () => {
  const webcamSchema = SCRIPT_SCHEMA.properties.project.properties.webcam;
  assert.equal(webcamSchema.properties.position.default, 'bottom-right');
  assert.equal(webcamSchema.properties.width.default, 320);
  assert.equal(webcamSchema.properties.height.default, 240);
  assert.equal(webcamSchema.properties.crop.default, 'rectangle');
  assert.equal(webcamSchema.properties.border.default, false);
  assert.equal(webcamSchema.properties.margin.default, 20);
});

/* ──── Position calculation ──── */

describe('calcOverlayX', () => {
  it('bottom-right: right-aligned', () => {
    assert.equal(calcOverlayX('bottom-right', 1920, 320, 20), 1580);
  });

  it('top-right: right-aligned', () => {
    assert.equal(calcOverlayX('top-right', 1920, 320, 20), 1580);
  });

  it('bottom-left: left edge + margin', () => {
    assert.equal(calcOverlayX('bottom-left', 1920, 320, 20), 20);
  });

  it('top-left: left edge + margin', () => {
    assert.equal(calcOverlayX('top-left', 1920, 320, 20), 20);
  });

  it('defaults to bottom-right position', () => {
    assert.equal(calcOverlayX('invalid', 1280, 320, 10), 950);
  });
});

describe('calcOverlayY', () => {
  it('bottom-right: bottom-aligned', () => {
    assert.equal(calcOverlayY('bottom-right', 1080, 240, 20), 820);
  });

  it('bottom-left: bottom-aligned', () => {
    assert.equal(calcOverlayY('bottom-left', 1080, 240, 20), 820);
  });

  it('top-right: top edge + margin', () => {
    assert.equal(calcOverlayY('top-right', 1080, 240, 20), 20);
  });

  it('top-left: top edge + margin', () => {
    assert.equal(calcOverlayY('top-left', 1080, 240, 20), 20);
  });

  it('defaults to bottom-right position', () => {
    assert.equal(calcOverlayY('invalid', 1080, 240, 10), 830);
  });
});

/* ──── buildWebcamOverlay ──── */

describe('buildWebcamOverlay', () => {
  const defaultViewport = { width: 1920, height: 1080 };

  it('should return object with filterComplex and videoOut', () => {
    const result = buildWebcamOverlay({ file: 'cam.mp4' }, defaultViewport);
    assert.ok(result.filterComplex);
    assert.equal(result.videoOut, '[pip_out]');
  });

  it('should include scale filter on cam input', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', width: 320, height: 240 },
      defaultViewport,
    );
    assert.match(result.filterComplex, /\[1:v\]scale=320:240/);
  });

  it('should produce bottom-right overlay position', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', position: 'bottom-right', width: 320, height: 240, margin: 20 },
      defaultViewport,
    );
    assert.match(result.filterComplex, /overlay=1580:820/);
  });

  it('should produce top-left overlay position', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', position: 'top-left', width: 320, height: 240, margin: 20 },
      defaultViewport,
    );
    assert.match(result.filterComplex, /overlay=20:20/);
  });

  it('should include geq alpha filter for circle crop', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', crop: 'circle', width: 320, height: 240 },
      defaultViewport,
    );
    assert.match(result.filterComplex, /format=rgba/);
    assert.match(result.filterComplex, /geq=a='/);
  });

  it('should NOT include geq for rectangle crop', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', crop: 'rectangle', width: 320, height: 240 },
      defaultViewport,
    );
    assert.doesNotMatch(result.filterComplex, /geq=a=/);
  });

  it('should include drawbox for border', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', border: true, width: 320, height: 240 },
      defaultViewport,
    );
    assert.match(result.filterComplex, /drawbox=/);
    assert.match(result.filterComplex, /color=white@0\.9/);
  });

  it('should NOT include drawbox when border is false', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', border: false },
      defaultViewport,
    );
    assert.doesNotMatch(result.filterComplex, /drawbox=/);
  });

  it('should accept custom stream labels', () => {
    const result = buildWebcamOverlay(
      { file: 'cam.mp4', width: 640, height: 480 },
      defaultViewport,
      { mainLabel: '[main]', camLabel: '[webcam]' },
    );
    assert.match(result.filterComplex, /\[main\]/);
    assert.match(result.filterComplex, /\[webcam\]scale=640:480/);
  });
});

/* ──── Validator ──── */

describe('validator: webcam config', () => {
  const baseValidScript = () => ({
    project: {
      name: 'test',
      url: 'http://example.com',
      output: './out',
    },
    scenes: [{ name: 'scene-1', actions: [{ type: 'wait', ms: 1000 }] }],
  });

  it('accepts valid webcam config with all fields', () => {
    const script = baseValidScript();
    script.project.webcam = {
      file: './cam.mp4',
      position: 'bottom-right',
      width: 320,
      height: 240,
      crop: 'rectangle',
      border: false,
      margin: 20,
    };
    const result = validateScript(script);
    assert.equal(result.valid, true);
  });

  it('accepts minimal webcam config (file only)', () => {
    const script = baseValidScript();
    script.project.webcam = { file: './cam.mp4' };
    const result = validateScript(script);
    assert.equal(result.valid, true);
  });

  it('rejects webcam config without file', () => {
    const script = baseValidScript();
    script.project.webcam = { position: 'bottom-right' };
    const result = validateScript(script);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.path.includes('file')));
  });

  it('rejects webcam.file with non-string type', () => {
    const script = baseValidScript();
    script.project.webcam = { file: 123 };
    const result = validateScript(script);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.path.includes('file')));
  });

  it('warns on unrecognized webcam file format', () => {
    const script = baseValidScript();
    script.project.webcam = { file: './cam.xyz' };
    const result = validateScript(script);
    assert.equal(result.valid, true);
    assert.ok(result.warnings.some((e) => e.code === 'UNRECOGNIZED_FORMAT'));
  });

  it('rejects invalid webcam position', () => {
    const script = baseValidScript();
    script.project.webcam = { file: './cam.mp4', position: 'middle' };
    const result = validateScript(script);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.path.includes('position')));
  });

  it('rejects webcam.width out of range', () => {
    const script = baseValidScript();
    script.project.webcam = { file: './cam.mp4', width: 2000 };
    const result = validateScript(script);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.path.includes('width')));
  });

  it('rejects webcam.margin out of range', () => {
    const script = baseValidScript();
    script.project.webcam = { file: './cam.mp4', margin: 999 };
    const result = validateScript(script);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.path.includes('margin')));
  });
});
