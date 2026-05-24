---
name: clawforge
description: "Generate demo videos as code with ClawForge — YAML script → Playwright recording → AI voiceover → MP4"
version: 1.0.0
license: MIT
platforms: [linux, macos]
prerequisites:
  commands: [node, ffmpeg, ffprobe, edge-tts]
metadata:
  hermes:
    tags: [video, demo, screencast, tts, playwright, automation, mcp, ai-agent]
    homepage: https://github.com/Dr-SoloDev/clawforge
---

# ClawForge — Demo Videos as Code

Generate complete demo videos for web apps with one YAML script.

**Pipeline:** Script (YAML) → Narrate (edge-tts) → Record (Playwright) → Compose (ffmpeg) → MP4

## When to Use This Skill

Reach for ClawForge when you (or your AI agent) need to:

- Produce reproducible demo videos for web apps, dashboards, or SaaS products
- Generate hackathon submission videos in any of 40+ languages
- Build tutorial / walkthrough videos that update with the UI (script lives in git)
- Add a `produce_video` tool to an AI agent via MCP
- Run visual regression videos in CI per pull request

ClawForge is **not** the right tool for live screencasts, talking-head AI avatars, or full video editing. It's a deterministic pipeline: same script in, same MP4 out.

## Prerequisites

Run once on a fresh machine:

```bash
# System deps
brew install ffmpeg              # macOS
sudo apt install ffmpeg python3-pip   # Ubuntu/Debian
pip install edge-tts

# Repo setup
git clone https://github.com/Dr-SoloDev/clawforge.git
cd clawforge
npm install
npx playwright install chromium

# Verify
node bin/clawforge.js check-deps
```

Or if installed globally:

```bash
npm install -g clawforge
pip install edge-tts
npx playwright install chromium
clawforge check-deps
```

## Quick Start (60 seconds)

The repo ships with a self-contained demo that needs no local server:

```bash
cd clawforge
node bin/clawforge.js examples/clawforge-self-demo.yaml
```

Output lands at `./output-hero/output.mp4` after ~90 seconds.

## YAML Script Structure

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
    narration: >
      Welcome to My App. Let me show you how it works.
    pauseAfter: 1500
    actions:
      - { type: "goto", url: "http://localhost:3000" }
      - { type: "wait", ms: 4000 }

  - name: "feature"
    narration: "Click Get Started to begin."
    actions:
      - { type: "click", selector: "text=Get Started" }
      - { type: "wait", ms: 3000 }
```

## Action Reference

| Action | Parameters | Description |
|---|---|---|
| `goto` | `url` | Navigate to URL (waits for networkidle, 30s timeout) |
| `click` | `selector` | Click first matching Playwright locator |
| `fill` | `selector`, `text` | Type text via `pressSequentially` (React-safe, 30ms/key) |
| `press` | `selector?`, `key` | Press a key (e.g. `Enter`, `Control+Enter`) |
| `scroll` | `y` (absolute) or `dy` (relative) | Smooth scroll |
| `wait` | `ms` | Pause |
| `screenshot` | `name?` | Save PNG to `<output>/screenshots/` |

Selectors use [Playwright locators](https://playwright.dev/docs/locators) — CSS, `text=...`, `role=...`, `[data-testid=...]`, etc.

## CLI Commands

```bash
clawforge <script.yaml>              # Produce a video
clawforge validate <script.yaml>     # Validate without running
clawforge check-deps                 # Verify dependencies
clawforge resume <checkpoint.json>   # Resume from last checkpoint

# Flags
-o, --output <dir>      Override output directory
-v, --verbose           Verbose logging
--skip-deps             Skip dependency check
```

## Programmatic API (SDK)

```js
import { ClawForgeSDK } from 'clawforge';

const forge = new ClawForgeSDK({ verbose: true });

forge.on('stage:start',    ({ stage }) => console.log(`▶  ${stage}`));
forge.on('stage:complete', ({ stage }) => console.log(`✓  ${stage}`));
forge.on('scene:complete', ({ scene }) => console.log(`  ✅ ${scene}`));
forge.on('progress',       (data) => console.log('  …', data));

const result = await forge.produce('./demo.yaml');
console.log(result.outputPath);   // ./output/output.mp4
console.log(result.duration);     // ms
console.log(result.stats);        // { scenes, totalNarrationDuration, fileSize }
```

Other SDK methods: `forge.validate(script)`, `forge.dryRun(script)`, `forge.resume(checkpoint)`, `ClawForgeSDK.checkDependencies()`.

## MCP Integration (Claude Code & other MCP clients)

Add to your MCP client config (e.g. `.claude/settings.json`):

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

Tools exposed:

- `clawforge_produce_video` — generate a video from a script
- `clawforge_validate_script` — validate without executing
- `clawforge_check_dependencies` — verify ffmpeg, edge-tts, Playwright
- `clawforge_dry_run` — pre-flight check before production

## Voice Options (edge-tts)

**English:**
- `en-US-AndrewMultilingualNeural` — male, natural
- `en-US-AvaMultilingualNeural` — female, natural
- `en-GB-RyanNeural` — UK male

**Multilingual (handle 40+ languages):**
- `en-US-AndrewMultilingualNeural`
- `en-US-AvaMultilingualNeural`

**Other languages (sample):**
- Thai: `th-TH-PremwadeeNeural` (female), `th-TH-NiwatNeural` (male)
- Japanese: `ja-JP-NanamiNeural`, `ja-JP-KeitaNeural`
- Spanish: `es-ES-ElviraNeural`, `es-MX-DaliaNeural`
- French: `fr-FR-DeniseNeural`, `fr-FR-HenriNeural`
- German: `de-DE-KatjaNeural`, `de-DE-ConradNeural`

List all available voices: `edge-tts --list-voices`

## Common Workflows

### 1. Localhost web app demo

```yaml
project:
  url: "http://localhost:3000"
  output: "./output-myapp"

scenes:
  - name: "intro"
    narration: "Welcome to MyApp."
    actions:
      - { type: "goto", url: "http://localhost:3000" }
      - { type: "wait", ms: 4000 }

  - name: "login"
    narration: "Logging in is one click."
    actions:
      - { type: "click", selector: "text=Sign in" }
      - { type: "fill", selector: "input[name=email]", text: "demo@example.com" }
      - { type: "fill", selector: "input[name=password]", text: "demo" }
      - { type: "click", selector: "button[type=submit]" }
      - { type: "wait", ms: 3000 }
```

### 2. Public website tour (no server needed)

```yaml
project:
  url: "https://yourdocs.com"
  output: "./output-tour"

scenes:
  - name: "homepage"
    narration: "This is our docs site."
    actions:
      - { type: "goto", url: "https://yourdocs.com" }
      - { type: "wait", ms: 4000 }
      - { type: "scroll", dy: 600 }
      - { type: "wait", ms: 3000 }
```

### 3. AI agent producing video on demand

```js
// In your agent code
import { ClawForgeSDK } from 'clawforge';

async function makeDemoFor(featureName, url) {
  const script = {
    project: { name: featureName, url, output: `./demos/${featureName}` },
    voice: { engine: 'edge-tts', voice: 'en-US-AndrewMultilingualNeural' },
    scenes: [
      {
        name: 'intro',
        narration: `Here's how ${featureName} works.`,
        actions: [
          { type: 'goto', url },
          { type: 'wait', ms: 4000 },
        ],
      },
    ],
  };

  const forge = new ClawForgeSDK();
  return forge.produce(script);
}
```

## Pitfalls & Solutions

### React/Vue/Svelte forms — `fill` triggers `onChange` correctly

ClawForge's `fill` action uses `pressSequentially` internally, which fires native input events that React picks up. If you ported a script from raw Playwright using `page.fill()`, you may have hit the React `onChange` bug — ClawForge already handles this.

### Long videos hit foreground timeout

Pipelines longer than 5 minutes should run in background mode:

```bash
node bin/clawforge.js examples/long-demo.yaml &
```

Or via SDK with checkpointing — if it crashes, resume from the last checkpoint.

### Selector mismatch wastes a full pipeline run

A 10-scene demo costs ~7 minutes. Wrong selectors = wasted run. Before the first run on a new app:

1. Open the app in a real browser at the same viewport (1280×720)
2. Use `npx playwright codegen <url>` to generate selectors interactively
3. Prefer stable selectors: `data-testid`, ARIA `role` + name, unique text — NOT auto-generated class names
4. Run `clawforge validate <script.yaml>` first to catch schema errors

### Dependencies missing

Run `clawforge check-deps` first. Common fixes:

- `ffmpeg`/`ffprobe`: `brew install ffmpeg` or `apt install ffmpeg`
- `edge-tts`: `pip install edge-tts`
- Chromium: `npx playwright install chromium`
- Node.js < 20: upgrade with `nvm install 20`

### `--rate` argument format

Edge TTS rate must use `=` syntax: `"-5%"` works, but the underlying CLI is invoked as `--rate=-5%`. ClawForge handles this correctly — just supply rate as a string in YAML.

## Performance Reference

| Scenes | Total Narration | Pipeline Time | Output Size |
|---|---|---|---|
| 3 | ~25s | ~55s | ~800 KB |
| 4 | ~50s | ~90s | ~2.5 MB |
| 9 | ~110s | ~185s | ~3 MB |

The Playwright recording stage is the bottleneck — it must wait through every `wait` and TTS-matched scene duration.

## Reliability Features

- **Retry policy** — exponential / linear / constant backoff for `NETWORK_TIMEOUT`, `PLAYWRIGHT_ERROR`, `SELECTOR_NOT_FOUND`, `TTS_ERROR`, `NAVIGATION_FAILED`
- **Checkpoints** — JSON saved to `./.clawforge-checkpoints/` after each stage
- **Resume** — `clawforge resume <checkpoint.json>` picks up where it left off
- **Structured errors** — `ClawForgeError` instances with code, recovery hints, and suggestions

## File Output Structure

```
output-<name>/
├── audio/                # per-scene MP3 files
├── video/                # raw WebM from Playwright
├── screenshots/          # PNGs from screenshot actions
├── narration.mp3         # concatenated audio
└── output.mp4            # final MP4 (this is the deliverable)
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find package 'playwright'` | npm install not run | `cd <repo> && npm install` |
| `executable doesn't exist at chromium-XXX` | Playwright browser not downloaded | `npx playwright install chromium` |
| `edge-tts: command not found` | edge-tts not installed | `pip install edge-tts` |
| Black/blank scenes | `goto` failed silently | Check URL reachable, increase wait |
| Video shorter than expected | Actions finished too fast | Add `wait` actions to match TTS |
| Repeated `Action click failed: Timeout` | Wrong selectors | Use `playwright codegen` to verify |
| MP4 has no audio | edge-tts failed during narration | Run `clawforge check-deps` |

## Related

- **GitHub repo:** https://github.com/Dr-SoloDev/clawforge
- **Issues / feature requests:** https://github.com/Dr-SoloDev/clawforge/issues
- **edge-tts voices:** https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- **Playwright locators:** https://playwright.dev/docs/locators
- **Model Context Protocol:** https://modelcontextprotocol.io
