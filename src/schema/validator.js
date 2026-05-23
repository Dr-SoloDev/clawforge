/**
 * Script Validator
 * Validates ClawForge scripts against schema
 */

import { SCRIPT_SCHEMA, ACTION_TYPES } from './script-schema.js';

export function validateScript(script) {
  const errors = [];
  const warnings = [];

  if (!script || typeof script !== 'object') {
    errors.push({
      path: '',
      message: 'Script must be an object',
      code: 'INVALID_TYPE',
    });
    return { valid: false, errors, warnings };
  }

  if (!script.scenes || !Array.isArray(script.scenes)) {
    errors.push({
      path: 'scenes',
      message: 'Script must have a "scenes" array',
      code: 'MISSING_REQUIRED',
    });
  } else if (script.scenes.length === 0) {
    errors.push({
      path: 'scenes',
      message: 'Script must have at least one scene',
      code: 'EMPTY_ARRAY',
    });
  } else {
    script.scenes.forEach((scene, index) => {
      validateScene(scene, index, errors, warnings);
    });
  }

  if (script.project) {
    validateProject(script.project, errors, warnings);
  }

  if (script.voice) {
    validateVoice(script.voice, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateScene(scene, index, errors, warnings) {
  const path = `scenes[${index}]`;

  if (!scene || typeof scene !== 'object') {
    errors.push({
      path,
      message: 'Scene must be an object',
      code: 'INVALID_TYPE',
    });
    return;
  }

  if (!scene.name || typeof scene.name !== 'string') {
    errors.push({
      path: `${path}.name`,
      message: 'Scene must have a "name" string',
      code: 'MISSING_REQUIRED',
    });
  } else if (!/^[a-z0-9-_]+$/.test(scene.name)) {
    errors.push({
      path: `${path}.name`,
      message: 'Scene name must contain only lowercase letters, numbers, hyphens, and underscores',
      code: 'INVALID_FORMAT',
    });
  }

  if (!scene.actions || !Array.isArray(scene.actions)) {
    errors.push({
      path: `${path}.actions`,
      message: 'Scene must have an "actions" array',
      code: 'MISSING_REQUIRED',
    });
  } else if (scene.actions.length === 0) {
    warnings.push({
      path: `${path}.actions`,
      message: 'Scene has no actions',
      code: 'EMPTY_ARRAY',
    });
  } else {
    scene.actions.forEach((action, actionIndex) => {
      validateAction(action, `${path}.actions[${actionIndex}]`, errors, warnings);
    });
  }

  if (scene.narration && typeof scene.narration !== 'string') {
    errors.push({
      path: `${path}.narration`,
      message: 'Narration must be a string',
      code: 'INVALID_TYPE',
    });
  }

  if (scene.pauseAfter !== undefined) {
    if (typeof scene.pauseAfter !== 'number') {
      errors.push({
        path: `${path}.pauseAfter`,
        message: 'pauseAfter must be a number',
        code: 'INVALID_TYPE',
      });
    } else if (scene.pauseAfter < 0 || scene.pauseAfter > 10000) {
      warnings.push({
        path: `${path}.pauseAfter`,
        message: 'pauseAfter should be between 0 and 10000ms',
        code: 'OUT_OF_RANGE',
      });
    }
  }
}

function validateAction(action, path, errors, warnings) {
  if (!action || typeof action !== 'object') {
    errors.push({
      path,
      message: 'Action must be an object',
      code: 'INVALID_TYPE',
    });
    return;
  }

  if (!action.type || typeof action.type !== 'string') {
    errors.push({
      path: `${path}.type`,
      message: 'Action must have a "type" string',
      code: 'MISSING_REQUIRED',
    });
    return;
  }

  if (!ACTION_TYPES.includes(action.type)) {
    errors.push({
      path: `${path}.type`,
      message: `Unknown action type: ${action.type}. Valid types: ${ACTION_TYPES.join(', ')}`,
      code: 'INVALID_VALUE',
    });
    return;
  }

  switch (action.type) {
    case 'goto':
      if (!action.url || typeof action.url !== 'string') {
        errors.push({
          path: `${path}.url`,
          message: 'goto action requires a "url" string',
          code: 'MISSING_REQUIRED',
        });
      }
      break;

    case 'click':
      if (!action.selector || typeof action.selector !== 'string') {
        errors.push({
          path: `${path}.selector`,
          message: 'click action requires a "selector" string',
          code: 'MISSING_REQUIRED',
        });
      }
      break;

    case 'fill':
      if (!action.selector || typeof action.selector !== 'string') {
        errors.push({
          path: `${path}.selector`,
          message: 'fill action requires a "selector" string',
          code: 'MISSING_REQUIRED',
        });
      }
      if (action.text === undefined || typeof action.text !== 'string') {
        errors.push({
          path: `${path}.text`,
          message: 'fill action requires a "text" string',
          code: 'MISSING_REQUIRED',
        });
      }
      break;

    case 'press':
      if (!action.key || typeof action.key !== 'string') {
        errors.push({
          path: `${path}.key`,
          message: 'press action requires a "key" string',
          code: 'MISSING_REQUIRED',
        });
      }
      break;

    case 'scroll':
      if (action.y === undefined && action.dy === undefined) {
        errors.push({
          path,
          message: 'scroll action requires either "y" or "dy"',
          code: 'MISSING_REQUIRED',
        });
      }
      if (action.y !== undefined && typeof action.y !== 'number') {
        errors.push({
          path: `${path}.y`,
          message: 'scroll "y" must be a number',
          code: 'INVALID_TYPE',
        });
      }
      if (action.dy !== undefined && typeof action.dy !== 'number') {
        errors.push({
          path: `${path}.dy`,
          message: 'scroll "dy" must be a number',
          code: 'INVALID_TYPE',
        });
      }
      break;

    case 'wait':
      if (action.ms === undefined || typeof action.ms !== 'number') {
        errors.push({
          path: `${path}.ms`,
          message: 'wait action requires a "ms" number',
          code: 'MISSING_REQUIRED',
        });
      } else if (action.ms < 0) {
        errors.push({
          path: `${path}.ms`,
          message: 'wait "ms" must be non-negative',
          code: 'INVALID_VALUE',
        });
      } else if (action.ms > 60000) {
        warnings.push({
          path: `${path}.ms`,
          message: 'wait duration exceeds 60 seconds',
          code: 'LONG_WAIT',
        });
      }
      break;

    case 'screenshot':
      if (action.name !== undefined && typeof action.name !== 'string') {
        errors.push({
          path: `${path}.name`,
          message: 'screenshot "name" must be a string',
          code: 'INVALID_TYPE',
        });
      }
      break;
  }
}

function validateProject(project, errors, warnings) {
  const path = 'project';

  if (project.viewport) {
    if (typeof project.viewport !== 'object') {
      errors.push({
        path: `${path}.viewport`,
        message: 'viewport must be an object',
        code: 'INVALID_TYPE',
      });
    } else {
      if (typeof project.viewport.width !== 'number') {
        errors.push({
          path: `${path}.viewport.width`,
          message: 'viewport width must be a number',
          code: 'INVALID_TYPE',
        });
      } else if (project.viewport.width < 320 || project.viewport.width > 3840) {
        warnings.push({
          path: `${path}.viewport.width`,
          message: 'viewport width should be between 320 and 3840',
          code: 'OUT_OF_RANGE',
        });
      }

      if (typeof project.viewport.height !== 'number') {
        errors.push({
          path: `${path}.viewport.height`,
          message: 'viewport height must be a number',
          code: 'INVALID_TYPE',
        });
      } else if (project.viewport.height < 240 || project.viewport.height > 2160) {
        warnings.push({
          path: `${path}.viewport.height`,
          message: 'viewport height should be between 240 and 2160',
          code: 'OUT_OF_RANGE',
        });
      }
    }
  }
}

function validateVoice(voice, errors, warnings) {
  const path = 'voice';

  if (voice.engine && voice.engine !== 'edge-tts') {
    errors.push({
      path: `${path}.engine`,
      message: 'Only "edge-tts" engine is currently supported',
      code: 'UNSUPPORTED_VALUE',
    });
  }

  if (voice.rate && typeof voice.rate === 'string') {
    if (!/^[+-]?\d+%$/.test(voice.rate)) {
      errors.push({
        path: `${path}.rate`,
        message: 'rate must be in format "+10%" or "-5%"',
        code: 'INVALID_FORMAT',
      });
    }
  }
}
