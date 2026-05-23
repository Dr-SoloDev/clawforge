# ClawForge SDK Documentation

## For AI Agents

ClawForge provides a programmatic SDK designed specifically for AI agents to generate demo videos automatically.

## Installation

```bash
npm install clawforge
```

## Quick Start

### Basic Usage

```javascript
import { ClawForgeSDK } from 'clawforge';

const forge = new ClawForgeSDK();

const result = await forge.produce({
  project: {
    name: 'My Demo',
    url: 'http://localhost:3000',
    output: './output',
    viewport: { width: 1280, height: 720 }
  },
  voice: {
    engine: 'edge-tts',
    voice: 'en-US-AndrewMultilingualNeural',
    rate: '-5%'
  },
  scenes: [
    {
      name: 'intro',
      narration: 'Welcome to my app demo',
      actions: [
        { type: 'goto', url: 'http://localhost:3000' },
        { type: 'wait', ms: 2000 }
      ]
    }
  ]
});

console.log('Video created:', result.outputPath);
```

### With Progress Tracking

```javascript
const forge = new ClawForgeSDK();

forge.on('stage:start', ({ stage }) => {
  console.log(`Starting: ${stage}`);
});

forge.on('progress', ({ stage, percent }) => {
  console.log(`${stage}: ${percent}%`);
});

forge.on('scene:complete', ({ scene, duration }) => {
  console.log(`Scene "${scene.name}" completed in ${duration}ms`);
});

forge.on('error', ({ error, recoverable }) => {
  if (recoverable) {
    console.log('Recoverable error:', error.message);
  } else {
    console.error('Fatal error:', error.message);
  }
});

const result = await forge.produce(script);
```

### Error Handling

```javascript
import { ClawForgeSDK, ClawForgeError, ErrorCodes } from 'clawforge';

try {
  const result = await forge.produce(script);
} catch (error) {
  if (error instanceof ClawForgeError) {
    console.error('Error code:', error.code);
    console.error('Message:', error.message);
    console.error('Recoverable:', error.recoverable);
    console.error('Retryable:', error.retryable);
    
    if (error.suggestion) {
      console.log('Suggestion:', error.suggestion);
    }
    
    if (error.code === ErrorCodes.MISSING_DEPENDENCY) {
      console.log('Missing dependencies:', error.missing);
    }
  }
}
```

### Validation

```javascript
// Validate script before execution
const validation = await forge.validate(script);

if (!validation.valid) {
  console.error('Validation errors:');
  validation.errors.forEach(err => {
    console.error(`  ${err.path}: ${err.message}`);
  });
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:');
  validation.warnings.forEach(warn => {
    console.warn(`  ${warn.path}: ${warn.message}`);
  });
}
```

### Dry Run

```javascript
// Check dependencies and validate without executing
const dryRun = await forge.dryRun(script);

if (!dryRun.success) {
  if (!dryRun.validation.valid) {
    console.error('Script validation failed');
  }
  
  if (!dryRun.dependencies.allInstalled) {
    console.error('Missing dependencies:', dryRun.dependencies.missing);
  }
}
```

### Checkpoint & Resume

```javascript
// Production with checkpointing
const forge = new ClawForgeSDK({
  checkpointDir: './checkpoints'
});

forge.on('checkpoint', ({ stage, path }) => {
  console.log(`Checkpoint saved: ${stage} -> ${path}`);
});

try {
  const result = await forge.produce(script);
} catch (error) {
  // If production fails, you can resume from last checkpoint
  const lastCheckpoint = './checkpoints/my-demo-recording-complete-*.json';
  const result = await forge.resume(lastCheckpoint);
}
```

### Custom Retry Policy

```javascript
import { ClawForgeSDK, RetryPolicy } from 'clawforge';

const forge = new ClawForgeSDK({
  retryPolicy: new RetryPolicy({
    maxRetries: 5,
    initialDelay: 2000,
    backoffStrategy: 'exponential',
    retryableErrors: ['NETWORK_TIMEOUT', 'PLAYWRIGHT_ERROR']
  })
});

forge.on('retry', ({ stage, attempt, maxRetries, delay }) => {
  console.log(`Retrying ${stage}: attempt ${attempt}/${maxRetries} in ${delay}ms`);
});

const result = await forge.produce(script);
```

## MCP Server Integration

ClawForge provides an MCP (Model Context Protocol) server for seamless integration with Claude Code and other AI agents.

### Setup

Add to your Claude Code config (`~/.claude/config.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "clawforge": {
      "command": "npx",
      "args": ["clawforge-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "clawforge": {
      "command": "clawforge-mcp"
    }
  }
}
```

### Available MCP Tools

#### 1. `clawforge_produce_video`

Generate a demo video from a script.

```javascript
// Claude Code can call this tool
{
  "script": {
    "project": { "name": "Demo", "url": "http://localhost:3000" },
    "voice": { "engine": "edge-tts", "voice": "en-US-AndrewMultilingualNeural" },
    "scenes": [...]
  },
  "options": {
    "output": "./videos",
    "verbose": true
  }
}
```

#### 2. `clawforge_validate_script`

Validate a script without executing.

```javascript
{
  "script": "./my-script.yaml"
}
```

#### 3. `clawforge_check_dependencies`

Check if all dependencies are installed.

```javascript
{}
```

#### 4. `clawforge_dry_run`

Validate and check dependencies without executing.

```javascript
{
  "script": "./my-script.yaml"
}
```

## Script Format

### Complete Example

```yaml
project:
  name: "My App Demo"
  url: "http://localhost:3000"
  output: "./output"
  viewport:
    width: 1280
    height: 720

voice:
  engine: "edge-tts"
  voice: "en-US-AndrewMultilingualNeural"
  rate: "-5%"

scenes:
  - name: "intro"
    narration: "Welcome to my app. Let me show you how it works."
    actions:
      - { type: "goto", url: "http://localhost:3000" }
      - { type: "wait", ms: 2000 }
      - { type: "scroll", dy: 300 }

  - name: "demo"
    narration: "First, click the button and fill in the form."
    actions:
      - { type: "click", selector: "button.start" }
      - { type: "fill", selector: "input[name='email']", text: "user@example.com" }
      - { type: "press", selector: "input[name='email']", key: "Enter" }
      - { type: "wait", ms: 3000 }

  - name: "results"
    narration: "Here are the results. Pretty cool, right?"
    actions:
      - { type: "scroll", y: 0 }
      - { type: "wait", ms: 2000 }
      - { type: "screenshot", name: "final-result" }
```

### Action Types

| Action | Parameters | Description |
|--------|-----------|-------------|
| `goto` | `url` | Navigate to URL |
| `click` | `selector` | Click element |
| `fill` | `selector`, `text` | Fill input field |
| `press` | `selector?`, `key` | Press keyboard key |
| `scroll` | `y?`, `dy?` | Scroll page (absolute or relative) |
| `wait` | `ms` | Wait for milliseconds |
| `screenshot` | `name?` | Take screenshot |

### Voice Options

Common voices for `edge-tts`:

- `en-US-AndrewMultilingualNeural` (Male, US English)
- `en-US-AvaMultilingualNeural` (Female, US English)
- `en-US-BrianMultilingualNeural` (Male, US English)
- `en-US-EmmaMultilingualNeural` (Female, US English)
- `en-GB-RyanNeural` (Male, British English)
- `en-GB-SoniaNeural` (Female, British English)

Rate: `"+10%"` (faster) or `"-5%"` (slower)

## Events

### Available Events

- `start` - Production started
- `stage:start` - Stage started (dependency-check, load-script, validate-script, narration, recording, composition)
- `stage:complete` - Stage completed
- `scene:start` - Scene started
- `scene:complete` - Scene completed
- `progress` - Progress update
- `checkpoint` - Checkpoint saved
- `retry` - Retry attempt
- `error` - Error occurred
- `complete` - Production completed

### Event Data

```typescript
forge.on('stage:start', (data: {
  stage: string;
  timestamp: number;
  total?: number;
}) => {});

forge.on('progress', (data: {
  stage: string;
  current?: number;
  total?: number;
  percent?: number;
  timestamp: number;
}) => {});

forge.on('error', (data: {
  error: ClawForgeError;
  recoverable: boolean;
  retryable: boolean;
}) => {});
```

## Error Codes

```javascript
import { ErrorCodes } from 'clawforge';

ErrorCodes.MISSING_DEPENDENCY      // Missing external dependency
ErrorCodes.INVALID_SCRIPT          // Script syntax error
ErrorCodes.VALIDATION_FAILED       // Script validation failed
ErrorCodes.NETWORK_TIMEOUT         // Network request timeout
ErrorCodes.PLAYWRIGHT_ERROR        // Playwright/browser error
ErrorCodes.SELECTOR_NOT_FOUND      // Element selector not found
ErrorCodes.FFMPEG_ERROR            // FFmpeg processing error
ErrorCodes.TTS_ERROR               // Text-to-speech error
ErrorCodes.CHECKPOINT_ERROR        // Checkpoint load/save error
```

## Dependencies

ClawForge requires these external dependencies:

1. **Node.js** >= 20
2. **ffmpeg** - Video processing
3. **ffprobe** - Video analysis (comes with ffmpeg)
4. **edge-tts** - Text-to-speech (Python package)
5. **Playwright** - Browser automation

### Check Dependencies

```javascript
import { ClawForgeSDK } from 'clawforge';

const deps = await ClawForgeSDK.checkDependencies();

if (!deps.allInstalled) {
  console.log('Missing:', deps.missing);
  // ['ffmpeg', 'edge-tts']
}
```

### Installation

```bash
# ffmpeg (Linux)
sudo apt install ffmpeg

# ffmpeg (macOS)
brew install ffmpeg

# edge-tts (Python)
pip install edge-tts

# Playwright browsers
npx playwright install chromium
```

## TypeScript Support

ClawForge includes full TypeScript type definitions:

```typescript
import { ClawForgeSDK, ClawForgeScript, ProductionResult } from 'clawforge';

const script: ClawForgeScript = {
  project: {
    name: 'Demo',
    url: 'http://localhost:3000',
    output: './output',
    viewport: { width: 1280, height: 720 }
  },
  voice: {
    engine: 'edge-tts',
    voice: 'en-US-AndrewMultilingualNeural'
  },
  scenes: [
    {
      name: 'intro',
      narration: 'Welcome',
      actions: [
        { type: 'goto', url: 'http://localhost:3000' }
      ]
    }
  ]
};

const forge = new ClawForgeSDK();
const result: ProductionResult = await forge.produce(script);
```

## Examples

See the `examples/` directory for complete examples:

- `examples/demo-script.yaml` - Basic demo
- `examples/agent-usage.js` - SDK usage from Node.js
- `examples/mcp-config.json` - MCP server configuration
- `examples/typescript-example.ts` - TypeScript usage

## License

MIT
