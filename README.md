# AgentCast ⚡

**AI Agent Video Production Toolkit** — Turn scripts into polished demo videos, fully automated.

```
Script (YAML) → Playwright (Record) → edge-tts (Narrate) → ffmpeg (Render) → MP4
```

## Why AgentCast?

Creating demo videos for hackathons, product launches, and pitches is painful. You either screen-record manually (inconsistent, time-consuming) or hire someone (expensive, slow).

**AgentCast automates the entire pipeline:**
1. Write a simple YAML script describing your scenes and narration
2. AgentCast records your app with Playwright, generates voiceover with TTS, and merges everything with ffmpeg
3. Get a polished MP4 — zero manual work

Born from a real hackathon submission where the entire demo video was produced by an AI agent in one shot.

## Quick Start

```bash
# Install
npm install -g agentcast

# Install Playwright browsers (first time only)
npx playwright install chromium

# Run with a script
agentcast examples/demo-script.yaml
```

## Requirements

- **Node.js** >= 20
- **ffmpeg** in PATH ([static build](https://johnvansickle.com/ffmpeg/))
- **edge-tts** (Python): `pip install edge-tts`
- **Playwright** (auto-installed with npm)

## Script Format

AgentCast uses YAML scripts to define your video:

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

## Architecture

```
┌─────────────────────────────────────────────┐
│              AgentCast CLI                   │
│         (bin/agentcast.js)                   │
├─────────────────────────────────────────────┤
│           Script Loader                      │
│     (YAML/JSON → Scene Objects)              │
├──────────┬──────────┬───────────────────────┤
│ Recorder │ Narrator │     Composer          │
│Playwright│ edge-tts │      ffmpeg           │
│ → WebM   │  → MP3   │  WebM+MP3 → MP4      │
└──────────┴──────────┴───────────────────────┘
```

## Roadmap

- [x] YAML script format
- [x] Playwright recording engine
- [x] edge-tts narrator
- [x] ffmpeg composer
- [ ] Voicebox integration (voice cloning)
- [ ] Scene preview mode
- [ ] Subtitle generation (SRT)
- [ ] Multi-language support
- [ ] Template library

## Origin Story

Built by [Dr.solodev](https://github.com/Dr-SoloDev) and Turbo ⚡ during a Solana hackathon. The entire KadiRail AI demo video was produced autonomously by an AI agent — Playwright recorded the browser, edge-tts generated English voiceover, and ffmpeg merged everything into a polished MP4. Zero human intervention.

We thought: **if an AI agent can make a demo video, everyone should be able to.**

## License

MIT
