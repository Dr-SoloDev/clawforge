# ClawForge ⚡

**AI Agent Video Production Toolkit** — Turn scripts into polished demo videos, fully automated.

```
Script (YAML) → Playwright (Record) → edge-tts (Narrate) → ffmpeg (Render) → MP4
```

## Why ClawForge?

Creating demo videos for hackathons, product launches, and pitches is painful. You either screen-record manually (inconsistent, time-consuming) or hire someone (expensive, slow).

**ClawForge automates the entire pipeline:**
1. Write a simple YAML script describing your scenes and narration
2. ClawForge records your app with Playwright, generates voiceover with TTS, and merges everything with ffmpeg
3. Get a polished MP4 — zero manual work

Born from a real hackathon submission where the entire demo video was produced by an AI agent in one shot.

## 🤖 Built for AI Agents

ClawForge v0.2+ provides a **programmatic SDK** designed specifically for AI agents like Claude Code, OpenClaw, Hermes, and custom agents. Agents can:

- ✅ Generate videos programmatically via SDK
- ✅ Track progress in real-time with events
- ✅ Handle errors with structured error codes
- ✅ Resume from checkpoints on failure
- ✅ Validate scripts before execution
- ✅ Integrate via MCP (Model Context Protocol)

## Quick Start

### CLI Usage

```bash
# Install
npm install -g clawforge

# Install dependencies
pip install edge-tts
npx playwright install chromium

# Run with a script
clawforge examples/demo-script.yaml

# Validate script
clawforge validate my-script.yaml

# Check dependencies
clawforge check-deps
```

### SDK Usage (for AI Agents)

```javascript
import { ClawForgeSDK } from 'clawforge';

const forge = new ClawForgeSDK();

// Track progress
forge.on('stage:start', ({ stage }) => {
  console.log(`Starting: ${stage}`);
});

forge.on('progress', ({ stage, percent }) => {
  console.log(`${stage}: ${percent}%`);
});

// Produce video
const result = await forge.produce({
  project: {
    name: 'My Demo',
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

### MCP Integration (for Claude Code)

Add to your `.claude/settings.json`:

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

Now Claude Code can use ClawForge tools:
- `clawforge_produce_video` - Generate videos
- `clawforge_validate_script` - Validate scripts
- `clawforge_check_dependencies` - Check dependencies
- `clawforge_dry_run` - Pre-flight checks

## Requirements

- **Node.js** >= 20
- **ffmpeg** in PATH ([static build](https://johnvansickle.com/ffmpeg/))
- **edge-tts** (Python): `pip install edge-tts`
- **Playwright** (auto-installed with npm)

## Script Format

ClawForge uses YAML scripts to define your video:

```yaml
project:
  name: "My App Demo"
  url: "http://localhost:3000"
  output: "./output"
  viewport: { width: 1280, height: 720 }

voice:
  engine: "edge-tts"
  voice: "en-US-AndrewMultilingualNeural"
  rate: "-5%"

scenes:
  - name: "opening"
    narration: "Welcome to My App — the fastest way to do X."
    actions:
      - { type: "goto", url: "http://localhost:3000" }
      - { type: "wait", ms: 3000 }
      - { type: "scroll", y: 400 }

  - name: "demo"
    narration: "Let me show you how it works."
    actions:
      - { type: "click", selector: "text=Get Started" }
      - { type: "fill", selector: "textarea", text: "Hello World" }
      - { type: "click", selector: "text=Submit" }
      - { type: "wait", ms: 5000 }

  - name: "closing"
    narration: "Thanks for watching. Try it today!"
    actions:
      - { type: "scroll", y: 0 }
      - { type: "wait", ms: 3000 }
```

## Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `goto` | `url` | Navigate to URL |
| `click` | `selector` | Click an element |
| `fill` | `selector`, `text` | Type text into input |
| `press` | `selector`, `key` | Press a key (e.g., `Control+Enter`) |
| `scroll` | `y` (absolute) or `dy` (relative) | Scroll the page |
| `wait` | `ms` | Wait for milliseconds |
| `screenshot` | `name` | Take a screenshot |

## Documentation

- **[SDK Documentation](docs/SDK.md)** - Complete SDK guide for AI agents
- **[Examples](examples/)** - Code examples and usage patterns
- **[API Reference](src/types/index.d.ts)** - TypeScript type definitions

## Architecture

```
┌─────────────────────────────────────────────┐
│         ClawForge SDK (v0.2+)                │
│    Programmatic API for AI Agents            │
├─────────────────────────────────────────────┤
│              ClawForge CLI                   │
│         (bin/clawforge.js)                   │
├─────────────────────────────────────────────┤
│           Script Loader                      │
│     (YAML/JSON → Scene Objects)              │
├──────────┬──────────┬───────────────────────┤
│ Recorder │ Narrator │     Composer          │
│Playwright│ edge-tts │      ffmpeg           │
│ → WebM   │  → MP3   │  WebM+MP3 → MP4      │
└──────────┴──────────┴───────────────────────┘
```

## Features

### v0.2.0 (AI Agent SDK)

- ✅ **Programmatic SDK** - Use ClawForge from code
- ✅ **Event System** - Real-time progress tracking
- ✅ **Error Handling** - Structured errors with recovery info
- ✅ **Retry Policy** - Configurable retry logic
- ✅ **Checkpointing** - Resume from failures
- ✅ **Validation** - Pre-flight script validation
- ✅ **MCP Server** - Claude Code integration
- ✅ **TypeScript Types** - Full type safety

### v0.1.0 (CLI)

- ✅ YAML script format
- ✅ Playwright recording engine
- ✅ edge-tts narrator
- ✅ ffmpeg composer

### Roadmap

- [ ] Voicebox integration (voice cloning)
- [ ] Scene preview mode
- [ ] Subtitle generation (SRT)
- [ ] Multi-language support
- [ ] Template library
- [ ] Cloud rendering

## Origin Story

Built by [Dr.solodev](https://github.com/Dr-SoloDev) and Turbo ⚡ during a Solana hackathon. The entire KadiRail AI demo video was produced autonomously by an AI agent — Playwright recorded the browser, edge-tts generated English voiceover, and ffmpeg merged everything into a polished MP4. Zero human intervention.

We thought: **if an AI agent can make a demo video, everyone should be able to.**

## License

MIT
