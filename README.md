# ⚡ ClawForge

> **Demo videos as code.** Write a YAML script, get a polished MP4 with browser recording and AI voiceover. Built for hackathons, product demos, and AI agents.

[![npm version](https://img.shields.io/npm/v/clawforge.svg)](https://www.npmjs.com/package/clawforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)

```
Script (YAML) → Playwright (record) → edge-tts (narrate) → ffmpeg (render) → MP4
```

---

## Why ClawForge?

You ship a feature. Your demo video is outdated. You re-record it. The UI changes again. You re-record again. **Stop.**

ClawForge treats demo videos like code — version-controlled, reproducible, rebuildable in one command. UI changes? Rerun the script. Done.

- 🎬 **Scripted, not recorded** — YAML defines scenes, narration, and browser actions
- 🎙️ **AI voiceover, 40+ languages** — Microsoft edge-tts neural voices, free
- 🤖 **Agent-native** — SDK, MCP server, structured errors, event hooks
- 🔁 **Reproducible** — same script, same video, every time
- 💾 **Resumable** — checkpoint on failure, resume mid-pipeline
- 🆓 **MIT, no API keys** — runs entirely on your machine

---

## 60-second quickstart

```bash
# 1. Install
npm install -g clawforge
pip install edge-tts
npx playwright install chromium

# 2. Verify
clawforge check-deps

# 3. Run the self-demo (no local server required)
git clone https://github.com/Dr-SoloDev/clawforge.git && cd clawforge
npm install
node bin/clawforge.js examples/clawforge-self-demo.yaml

# 4. Watch your video
xdg-open output-hero/output.mp4   # Linux
open output-hero/output.mp4       # macOS
```

---

## What a script looks like

```yaml
project:
  name: "My SaaS Demo"
  url: "http://localhost:3000"
  output: "./output"
  viewport: { width: 1280, height: 720 }

voice:
  engine: "edge-tts"
  voice: "en-US-AndrewMultilingualNeural"
  rate: "-5%"

scenes:
  - name: "intro"
    narration: "Welcome to Acme — the fastest way to ship."
    actions:
      - { type: "goto", url: "http://localhost:3000" }
      - { type: "wait", ms: 3000 }

  - name: "signup"
    narration: "Sign up takes ten seconds."
    actions:
      - { type: "click", selector: "text=Get Started" }
      - { type: "fill", selector: "input[type=email]", text: "demo@acme.dev" }
      - { type: "press", selector: "input[type=email]", key: "Enter" }
      - { type: "wait", ms: 4000 }

  - name: "outro"
    narration: "That's it. Try Acme today."
    actions:
      - { type: "scroll", y: 0 }
      - { type: "wait", ms: 2000 }
```

That's the whole demo. Run `clawforge my-demo.yaml` and you get an MP4.

---

## Use cases

| You are... | ClawForge gives you... |
|---|---|
| 🚀 Hackathon submitter | A polished demo video before the deadline, rebuildable until last minute |
| 💼 SaaS founder | Landing page demos that update with your UI, no re-recording |
| 📚 DevRel / docs author | Tutorial videos checked into the repo alongside code |
| 🤖 AI agent developer | A `produce_video` tool your agent can call via MCP |
| 🧪 QA engineer | Visual regression videos generated in CI per PR |

---

## Actions reference

| Action | Parameters | Description |
|---|---|---|
| `goto` | `url` | Navigate (waits for networkidle, 30s timeout) |
| `click` | `selector` | Click first matching element |
| `fill` | `selector`, `text` | Type with `pressSequentially` (React-safe, 30ms/key) |
| `press` | `selector?`, `key` | Press a key (e.g. `Control+Enter`) |
| `scroll` | `y` (absolute) or `dy` (relative) | Smooth scroll |
| `wait` | `ms` | Pause |
| `screenshot` | `name?` | Save PNG to `<output>/screenshots/` |

Selectors are [Playwright locators](https://playwright.dev/docs/locators) — CSS, text, role, testid, etc.

---

## CLI commands

```bash
clawforge <script.yaml>              # Produce a video
clawforge validate <script.yaml>     # Validate without running
clawforge check-deps                 # Check all dependencies
clawforge resume <checkpoint.json>   # Resume from last checkpoint

# Flags
-o, --output <dir>     Override output directory
-v, --verbose          Verbose logging
--skip-deps            Skip dependency check
```

---

## Use it as a library

```js
import { ClawForgeSDK } from 'clawforge';

const forge = new ClawForgeSDK({ verbose: true });

forge.on('stage:start', ({ stage }) => console.log(`▶  ${stage}`));
forge.on('stage:complete', ({ stage }) => console.log(`✓  ${stage}`));
forge.on('scene:complete', ({ scene }) => console.log(`  ✅ ${scene}`));

const result = await forge.produce('./demo.yaml');
console.log(result.outputPath); // ./output/output.mp4
```

Full SDK docs: [docs/SDK.md](docs/SDK.md)

---

## Use it from Claude Code (MCP)

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "clawforge": { "command": "npx", "args": ["clawforge-mcp"] }
  }
}
```

Now Claude can call:
- `clawforge_produce_video` — generate a video from a script
- `clawforge_validate_script` — validate without executing
- `clawforge_check_dependencies` — verify ffmpeg, edge-tts, Playwright
- `clawforge_dry_run` — pre-flight check before production

---

## Use it with AI coding agents (Skills)

For agents that support the Skills convention (Hermes Agent, Claude Skills), this repo ships a pre-packaged skill at [`skills/clawforge/`](skills/clawforge/SKILL.md).

```bash
# For Hermes Agent users
ln -s "$(pwd)/skills/clawforge" ~/.hermes/skills/clawforge
```

Then your agent can `skill_view(name='clawforge')` to load full ClawForge usage on demand.

---

## How it compares

|   | ClawForge | Loom | Synthesia | OBS | Playwright codegen |
|---|---|---|---|---|---|
| Script-as-code | ✅ | ❌ | ⚠️ template | ❌ | ⚠️ partial |
| Reproducible from source | ✅ | ❌ | ⚠️ | ❌ | ⚠️ |
| AI voiceover included | ✅ | ❌ | ✅ | ❌ | ❌ |
| Real browser interaction | ✅ | ✅ (manual) | ❌ | ✅ | ✅ |
| Agent / MCP support | ✅ | ❌ | ❌ | ❌ | ❌ |
| 40+ languages free | ✅ | — | 💰 | — | — |
| Cost | Free, MIT | Freemium | 💰💰💰 | Free | Free |

---

## Requirements

- Node.js ≥ 20
- Python 3 (for `edge-tts`)
- `ffmpeg` & `ffprobe` in PATH
- Chromium (installed via `npx playwright install chromium`)

Run `clawforge check-deps` to verify your environment.

---

## Reliability features

- **Retry policy** — exponential / linear / constant backoff for network and selector errors
- **Checkpointing** — JSON checkpoints written to `./.clawforge-checkpoints/` after each stage
- **Resume** — pick up from the last checkpoint with `clawforge resume <checkpoint.json>`
- **Structured errors** — `ClawForgeError` with codes: `NETWORK_TIMEOUT`, `PLAYWRIGHT_ERROR`, `SELECTOR_NOT_FOUND`, `TTS_ERROR`, `NAVIGATION_FAILED`, `FFMPEG_ERROR`

---

## Roadmap

- [ ] Burn-in subtitles (SRT generation)
- [ ] Background music & ducking
- [ ] Webcam overlay (picture-in-picture)
- [ ] Headed mode option
- [ ] Multi-browser support (Firefox/WebKit)
- [ ] Voice cloning integration
- [ ] Cloud rendering for CI
- [ ] Template gallery

[See open issues →](https://github.com/Dr-SoloDev/clawforge/issues) · [Contribute](CONTRIBUTING.md)

---

## Origin

Born during a Solana hackathon. The KadiRail demo video was produced end-to-end by an AI agent — Playwright recorded the browser, edge-tts narrated, ffmpeg merged. Zero human in the loop.

> If an AI agent can make a demo video, anyone should be able to.

Built by [Dr.solodev](https://github.com/Dr-SoloDev) ⚡

---

## License

[MIT](LICENSE)
