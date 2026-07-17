# ClawForge Under the Hood: Building an AI-Native Video Pipeline

*By Dr.SoloDev | Published: Coming soon*

---

ClawForge is more than just a CLI tool — it's an **AI-native video production pipeline** designed for agents, automation, and reproducibility.

This post walks through the architecture, the key design decisions, and how each component fits together.

---

## The Pipeline

```
YAML Script → Script Loader → Narrator (edge-tts) → Recorder (Playwright) → Composer (ffmpeg) → MP4
```

### Stage 1: Script Loading
The entry point is a YAML file that defines the entire video. The [script-loader](src/script-loader.js) parses the YAML, merges defaults, and produces a structured script object.

**Key design decision:** We support both `.yaml` and `.json` formats. The schema is validated before execution to catch errors early.

### Stage 2: Narration Generation
Each scene can have narration text. The [narrator](src/narrator.js) calls `edge-tts` (Microsoft's free neural TTS) to generate MP3 files per scene.

**Why edge-tts?**
- Free, no API key required
- 40+ languages, 100+ voices
- Neural quality that rivals paid services
- Runs locally via Python

We measure the duration of each generated audio file (via ffprobe) so the recording stage can time browser actions to the narration.

### Stage 3: Browser Recording
The [recorder](src/recorder.js) launches a headless Chromium browser via Playwright and executes scene actions in sequence.

Each scene has:
- **Narration timing** — browser actions are timed to fit within the audio duration
- **Actions** — `goto`, `click`, `fill`, `press`, `scroll`, `wait`, `screenshot`
- **Debug on failure** — if an action fails, we auto-capture a screenshot + DOM dump

**Why Playwright over Puppeteer?**
- Cross-browser support (Chromium, Firefox, WebKit)
- Better selector engine (text, role, testid)
- Auto-waiting and locator APIs
- Built-in video recording

### Stage 4: Composition
The [composer](src/composer.js) uses ffmpeg to:
1. Concatenate all audio segments
2. (Optional) Mix background music with ducking during narration
3. (Optional) Burn in SRT subtitles
4. (Optional) Overlay webcam picture-in-picture
5. Encode final MP4 with H.264 video + AAC audio

---

## Agent-Native Architecture

What makes ClawForge different from traditional video tools is its **agent-native design**.

### SDK (EventEmitter-based)
```js
import { ClawForgeSDK } from 'clawforge';

const forge = new ClawForgeSDK({ verbose: true });

forge.on('stage:start', ({ stage }) => console.log(`▶ ${stage}`));
forge.on('stage:complete', ({ stage }) => console.log(`✓ ${stage}`));
forge.on('error', ({ error }) => console.error(`✗ ${error.code}`));

const result = await forge.produce('./demo.yaml');
```

### MCP Server
ClawForge implements the [Model Context Protocol](https://modelcontextprotocol.io), making it directly callable by AI agents:

```json
{
  "mcpServers": {
    "clawforge": { "command": "npx", "args": ["clawforge-mcp"] }
  }
}
```

**Four MCP tools:**
| Tool | Description |
|------|-------------|
| `clawforge_produce_video` | Generate a video from script |
| `clawforge_validate_script` | Validate without executing |
| `clawforge_check_dependencies` | Verify system deps |
| `clawforge_dry_run` | Pre-flight check |

### Structured Error System
Every error carries machine-readable context:
```js
ClawForgeError {
  code: 'SELECTOR_NOT_FOUND',
  message: '...',
  recoverable: false,
  retryable: true,
  suggestion: 'Verify the selector exists...',
  context: { selector, scene }
}
```

This lets AI agents make intelligent decisions about how to handle failures.

---

## Reliability Features

### Retry Policy
Configurable backoff strategies for transient errors:
- **Exponential** (default): `1000ms * 2^attempt` (max 30s)
- **Linear**: `1000ms + attempt * 1000ms`
- **Constant**: fixed delay

### Checkpointing
Every stage writes a JSON checkpoint to `.clawforge-checkpoints/`. If the pipeline fails, you can resume from the last checkpoint:

```bash
clawforge resume .clawforge-checkpoints/my-demo-recording-complete-12345.json
```

### Dependency Validation
Before any production run, ClawForge validates all system dependencies:
- `ffmpeg` + `ffprobe` (video encoding)
- `edge-tts` (voiceover)
- Playwright browsers (recording)

---

## File Structure

```
src/
├── index.js                    # Pipeline orchestrator
├── sdk/
│   └── clawforge-sdk.js        # Public SDK (EventEmitter)
├── session/
│   └── production-session.js   # Lifecycle + checkpointing
├── script-loader.js            # YAML/JSON → script object
├── narrator.js                 # edge-tts → MP3
├── recorder.js                 # Playwright → browser video
├── composer.js                 # ffmpeg → final MP4
├── errors/
│   ├── clawforge-errors.js     # Structured error classes
│   └── retry-policy.js         # Backoff strategies
├── schema/
│   ├── script-schema.js        # JSON Schema
│   └── validator.js            # Pre-execution validation
├── subtitles/generator.js      # SRT generation
├── music/ducker.js             # Audio ducking filters
├── webcam/overlay.js           # PiP overlay engine
├── init-wizard.js              # Interactive CLI wizard
└── types/index.d.ts            # Full TypeScript definitions
```

---

## Performance

On a typical machine (2023 MacBook Pro):
- **3-scene demo**: ~45 seconds from script to MP4
- **Pipeline overhead**: ~5 seconds (browser launch + ffmpeg init)
- **Output size**: ~4-8 MB for 720p, 60-second video

---

## Conclusion

ClawForge is designed as a **developer-first video pipeline** that happens to work great with AI agents. The architecture prioritizes:

1. **Reproducibility** — same script, same video, every time
2. **Debuggability** — structured errors, auto-screenshots, checkpoints
3. **Extensibility** — SDK, MCP, hooks, plugin system
4. **Zero friction** — MIT license, no API keys, Docker support

---

*ClawForge — Your demo, scripted.*  
*https://github.com/Dr-SoloDev/clawforge*
