/**
 * ClawForge TypeScript Type Definitions
 * For AI agents and TypeScript projects
 */

export interface ClawForgeScript {
  project: ProjectConfig;
  voice: VoiceConfig;
  scenes: Scene[];
}

export interface ProjectConfig {
  name: string;
  url: string;
  output: string;
  viewport: ViewportConfig;
}

export interface ViewportConfig {
  width: number;
  height: number;
}

export interface VoiceConfig {
  engine: 'edge-tts';
  voice: string;
  rate?: string;
}

export interface Scene {
  name: string;
  narration?: string;
  actions: Action[];
  pauseAfter?: number;
}

export type Action =
  | GotoAction
  | ClickAction
  | FillAction
  | PressAction
  | ScrollAction
  | WaitAction
  | ScreenshotAction;

export interface GotoAction {
  type: 'goto';
  url: string;
}

export interface ClickAction {
  type: 'click';
  selector: string;
}

export interface FillAction {
  type: 'fill';
  selector: string;
  text: string;
}

export interface PressAction {
  type: 'press';
  selector?: string;
  key: string;
}

export interface ScrollAction {
  type: 'scroll';
  y?: number;
  dy?: number;
}

export interface WaitAction {
  type: 'wait';
  ms: number;
}

export interface ScreenshotAction {
  type: 'screenshot';
  name?: string;
}

export interface ProductionResult {
  success: boolean;
  outputPath: string;
  duration: number;
  stats: ProductionStats;
}

export interface ProductionStats {
  scenes: number;
  totalNarrationDuration: number;
  fileSize: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

export interface DependencyCheck {
  allInstalled: boolean;
  dependencies: {
    ffmpeg: DependencyStatus;
    ffprobe: DependencyStatus;
    edgeTts: DependencyStatus;
    playwright: DependencyStatus;
  };
  missing: string[];
}

export interface DependencyStatus {
  installed: boolean;
  command: string;
  message?: string;
}

export interface SDKOptions {
  checkpointDir?: string;
  retryPolicy?: RetryPolicyOptions;
  skipDependencyCheck?: boolean;
  verbose?: boolean;
}

export interface RetryPolicyOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  backoffStrategy?: 'exponential' | 'linear' | 'constant';
  retryableErrors?: string[];
}

export interface ProduceOptions {
  output?: string;
}

export interface DryRunResult {
  success: boolean;
  validation: ValidationResult;
  dependencies?: DependencyCheck;
}

export interface ProgressEvent {
  stage: string;
  current?: number;
  total?: number;
  percent?: number;
  timestamp: number;
}

export interface StageStartEvent {
  stage: string;
  timestamp: number;
  total?: number;
}

export interface StageCompleteEvent {
  stage: string;
  timestamp: number;
  [key: string]: any;
}

export interface SceneStartEvent {
  scene: Scene;
  index: number;
  total: number;
  timestamp: number;
}

export interface SceneCompleteEvent {
  scene: Scene;
  index: number;
  duration: number;
  timestamp: number;
}

export interface CheckpointEvent {
  stage: string;
  path: string;
  state: any;
}

export interface ErrorEvent {
  error: ClawForgeErrorData;
  recoverable: boolean;
  retryable: boolean;
}

export interface ClawForgeErrorData {
  name: string;
  code: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  context: Record<string, any>;
  suggestion: string | null;
  stack?: string;
}

export interface RetryEvent {
  stage: string;
  attempt: number;
  maxRetries: number;
  delay: number;
  error: string;
}

export declare class ClawForgeSDK {
  constructor(options?: SDKOptions);

  produce(script: ClawForgeScript | string, options?: ProduceOptions): Promise<ProductionResult>;

  validate(script: ClawForgeScript | string): Promise<ValidationResult>;

  dryRun(script: ClawForgeScript | string, options?: ProduceOptions): Promise<DryRunResult>;

  resume(checkpointPath: string): Promise<ProductionResult>;

  static checkDependencies(): Promise<DependencyCheck>;

  on(event: 'start', listener: (data: { timestamp: number }) => void): this;
  on(event: 'progress', listener: (data: ProgressEvent) => void): this;
  on(event: 'stage:start', listener: (data: StageStartEvent) => void): this;
  on(event: 'stage:complete', listener: (data: StageCompleteEvent) => void): this;
  on(event: 'scene:start', listener: (data: SceneStartEvent) => void): this;
  on(event: 'scene:complete', listener: (data: SceneCompleteEvent) => void): this;
  on(event: 'checkpoint', listener: (data: CheckpointEvent) => void): this;
  on(event: 'error', listener: (data: ErrorEvent) => void): this;
  on(event: 'retry', listener: (data: RetryEvent) => void): this;
  on(event: 'complete', listener: (data: ProductionResult) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;

  once(event: 'start', listener: (data: { timestamp: number }) => void): this;
  once(event: 'progress', listener: (data: ProgressEvent) => void): this;
  once(event: 'stage:start', listener: (data: StageStartEvent) => void): this;
  once(event: 'stage:complete', listener: (data: StageCompleteEvent) => void): this;
  once(event: 'scene:start', listener: (data: SceneStartEvent) => void): this;
  once(event: 'scene:complete', listener: (data: SceneCompleteEvent) => void): this;
  once(event: 'checkpoint', listener: (data: CheckpointEvent) => void): this;
  once(event: 'error', listener: (data: ErrorEvent) => void): this;
  once(event: 'retry', listener: (data: RetryEvent) => void): this;
  once(event: 'complete', listener: (data: ProductionResult) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;

  off(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}

export declare class ClawForgeError extends Error {
  name: 'ClawForgeError';
  code: string;
  recoverable: boolean;
  retryable: boolean;
  context: Record<string, any>;
  suggestion: string | null;
  originalError: Error | null;

  constructor(code: string, message: string, details?: {
    recoverable?: boolean;
    retryable?: boolean;
    context?: Record<string, any>;
    suggestion?: string;
    originalError?: Error;
  });

  toJSON(): ClawForgeErrorData;

  static fromError(error: Error, code?: string, context?: Record<string, any>): ClawForgeError;
}

export declare const ErrorCodes: {
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY';
  DEPENDENCY_CHECK_FAILED: 'DEPENDENCY_CHECK_FAILED';
  INVALID_SCRIPT: 'INVALID_SCRIPT';
  SCRIPT_LOAD_FAILED: 'SCRIPT_LOAD_FAILED';
  VALIDATION_FAILED: 'VALIDATION_FAILED';
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT';
  PLAYWRIGHT_ERROR: 'PLAYWRIGHT_ERROR';
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND';
  NAVIGATION_FAILED: 'NAVIGATION_FAILED';
  FFMPEG_ERROR: 'FFMPEG_ERROR';
  TTS_ERROR: 'TTS_ERROR';
  AUDIO_GENERATION_FAILED: 'AUDIO_GENERATION_FAILED';
  VIDEO_RECORDING_FAILED: 'VIDEO_RECORDING_FAILED';
  COMPOSITION_FAILED: 'COMPOSITION_FAILED';
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR';
  CHECKPOINT_ERROR: 'CHECKPOINT_ERROR';
  UNKNOWN_ERROR: 'UNKNOWN_ERROR';
};
