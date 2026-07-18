# ClawForge

Demo videos as code — YAML script → Playwright recording → edge-tts narration → ffmpeg → MP4.

## Commands

```bash
npm test                          # Run all tests (node --test test/*.test.js)
npm start                         # node bin/clawforge.js
npm run example                   # Run examples/demo-script.yaml
clawforge check-deps              # Verify ffmpeg, ffprobe, edge-tts, Playwright
clawforge validate <script.yaml>  # Validate only, no execution
clawforge resume <checkpoint.json># Resume from .clawforge-checkpoints/
clawforge -o <dir>                # Override output directory
clawforge --verbose               # Verbose logging
```

## External deps

- `ffmpeg` + `ffprobe` in PATH
- `edge-tts` Python package (`pip install edge-tts`)
- Chromium (`npx playwright install chromium`)

## Entrypoints

| Purpose | File |
|---|---|
| CLI | `bin/clawforge.js` |
| MCP stdio server | `bin/clawforge-mcp.js` |
| MCP SSE server (port 3100) | `clawforge-mcp-sse/index.js` |
| Library (npm package) | `src/sdk-exports.js` → exports `ClawForgeSDK` |

## Architecture

```
ClawForgeSDK (events + checkpoint)
  → ProductionSession.run()
    → 1. narrate()      edge-tts → per-scene MP3s
    → 2. record()       Playwright → single MP4
    → 3. compose()      ffmpeg → final MP4 (concat audio, mix music, burn subtitles/overlay)
```

## MCP tools

- `clawforge_produce_video` — script path or object, returns `{outputPath, stats}`
- `clawforge_validate_script` — validate without running
- `clawforge_check_dependencies` — status of all deps
- `clawforge_dry_run` — validate + dep check

Two transports: stdio (`npx clawforge-mcp`) and SSE (`GET /mcp`, `POST /mcp?sessionId=...` on port 3100).

## Tests

Uses Node.js built-in test runner. Files: `test/smoke.test.js`, `validator.test.js`, `errors.test.js`, `subtitles.test.js`, `music.test.js`, `webcam.test.js`.

CI (`.github/workflows/ci.yml`) tests on Node 20.x + 22.x, runs all tests + pipe JSON-RPC through MCP stdio server.

## Script schema quirks

- Scene names: `^[a-z0-9-_]+$`
- Actions: `goto`, `click`, `fill`, `press`, `scroll`, `wait`, `screenshot`
- Narration max 5000 chars, engine only `edge-tts`
- Viewport defaults 1280×720
- Optional: subtitles (boolean or object), music (auto-ducking), webcam (PiP overlay)

## Notable modules

| Module | Purpose |
|---|---|
| `src/session/production-session.js` | Lifecycle + checkpoint/resume |
| `src/music/ducker.js` | ffmpeg audio ducking filter builder |
| `src/subtitles/generator.js` | SRT generation from scene narration |
| `src/webcam/overlay.js` | PiP ffmpeg overlay builder |
| `src/errors/` | Structured error classes with recovery hints |

## Docker

`docker compose -f docker-compose.buildingai.yml up` — Postgres + Redis + BuildingAI + ClawForge (port 3100, 2gb shm, non-root).

## Notable

- Pure ESM project (`"type": "module"`)
- No linter/formatter config in repo
- Checkpoints saved to `.clawforge-checkpoints/`
- Audio gap between scenes: 1500ms hardcoded in `composer.js`
- TTS has internal retry: delays of 0, 3s, 6s before giving up
