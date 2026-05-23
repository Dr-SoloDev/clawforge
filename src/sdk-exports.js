/**
 * ClawForge SDK - Main Export
 * Public API for AI agents and applications
 */

export { ClawForgeSDK } from './sdk/clawforge-sdk.js';
export { ProductionSession } from './session/production-session.js';

export {
  ClawForgeError,
  DependencyError,
  ValidationError,
  NetworkError,
  PlaywrightError,
  SelectorError,
  FFmpegError,
  TTSError,
  ErrorCodes,
} from './errors/clawforge-errors.js';

export { RetryPolicy, DEFAULT_RETRY_POLICY } from './errors/retry-policy.js';

export { validateScript } from './schema/validator.js';
export { SCRIPT_SCHEMA, ACTION_TYPES, VOICE_ENGINES, COMMON_VOICES } from './schema/script-schema.js';

export { checkAllDependencies, checkCommand, checkPlaywright, getDependencyInstallInstructions } from './utils/deps.js';

export { loadScript } from './script-loader.js';
export { narrate } from './narrator.js';
export { record } from './recorder.js';
export { compose } from './composer.js';
