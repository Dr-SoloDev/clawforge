# Changelog

All notable changes to ClawForge will be documented in this file.

## [0.3.0] - 2026-05-24

### Added
- **Self-demo example** (`examples/clawforge-self-demo.yaml`) — runs without a local server, navigates the public GitHub repo
- **Smoke test suite** (`test/smoke.test.js`) — 7 tests covering SDK instantiation, script loading, validation, dry-run, dependency check
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — Node 20.x + 22.x matrix, smoke tests, MCP server smoke test
- **Public-facing README** — full rewrite focused on use cases (hackathons, SaaS demos, DevRel, AI agents, QA)

### Fixed
- **`production-session.js`** — replaced CommonJS `require('fs')` with ESM `import { statSync }` (would throw at runtime in `run()`)
- **MCP server** — `setRequestHandler` now uses `ListToolsRequestSchema` / `CallToolRequestSchema` schema objects instead of string method names (server now starts and responds to `tools/list` correctly)
- **`screenshot` action** — saves to `<project.output>/screenshots/` instead of cwd
- **React form fills** — `fill` action uses `pressSequentially` with 30ms delay to trigger React `onChange` handlers
- **edge-tts `--rate` arg** — uses `--rate=VALUE` syntax (previous form silently dropped on some systems)

### Changed
- **Package description** — refocused on "demo videos as code" positioning for public discovery
- **Version bump** — 0.2.0 → 0.3.0

## [0.2.0] - 2026-05-23

### Added - AI Agent SDK

**Major release focused on AI agent integration**

#### SDK & Programmatic API
- **ClawForgeSDK class** - Programmatic API for AI agents
- **Event system** - Real-time progress tracking with EventEmitter
- **Structured errors** - ClawForgeError with error codes, recovery info, and suggestions
- **Retry policy** - Configurable retry logic with exponential/linear/constant backoff
- **Checkpoint system** - Save/resume production state on failure
- **Validation API** - Pre-flight script validation without execution
- **Dry run mode** - Check dependencies and validate before production
- **Dependency checker** - Programmatic dependency verification

#### MCP Server Integration
- **MCP server** - Model Context Protocol server for Claude Code integration
- **clawforge-mcp binary** - Standalone MCP server executable
- **4 MCP tools**:
  - `clawforge_produce_video` - Generate videos
  - `clawforge_validate_script` - Validate scripts
  - `clawforge_check_dependencies` - Check dependencies
  - `clawforge_dry_run` - Pre-flight checks

#### TypeScript Support
- **Full TypeScript definitions** - Complete type safety for SDK
- **Type exports** - ClawForgeScript, ProductionResult, ValidationResult, etc.
- **Event types** - Typed event handlers for all events

#### CLI Improvements
- **Refactored CLI** - Now uses SDK internally
- **New commands**:
  - `clawforge validate <script>` - Validate script
  - `clawforge check-deps` - Check dependencies
  - `clawforge resume <checkpoint>` - Resume from checkpoint
- **Better error messages** - Structured errors with suggestions
- **Verbose mode** - `--verbose` flag for detailed logging
- **Skip dependency check** - `--skip-deps` flag

#### Documentation
- **SDK Documentation** - Complete guide for AI agents (docs/SDK.md)
- **Code examples**:
  - `examples/agent-usage.js` - SDK usage example
  - `examples/typescript-example.ts` - TypeScript example
  - `examples/mcp-config.json` - MCP configuration
- **Updated README** - Added SDK usage and MCP integration sections

### Changed
- **Package structure** - Added SDK exports and MCP server
- **Error handling** - Unified error system across all modules
- **Version bump** - 0.1.0 → 0.2.0

### Technical Details

**New modules:**
- `src/sdk/` - SDK core
- `src/errors/` - Error system and retry policy
- `src/schema/` - Validation system
- `src/session/` - Production session with checkpointing
- `src/mcp/` - MCP server
- `src/types/` - TypeScript definitions
- `src/utils/` - Utility functions

**Dependencies added:**
- `@modelcontextprotocol/sdk` - MCP server support

## [0.1.0] - 2024-XX-XX

### Added
- Initial release
- YAML script format
- Playwright browser recording
- edge-tts narration generation
- ffmpeg video composition
- CLI tool (`clawforge`)
- Basic action types: goto, click, fill, press, scroll, wait, screenshot
- Example demo script

### Features
- Automated browser recording with Playwright
- Text-to-speech narration with edge-tts
- Video composition with ffmpeg
- Configurable viewport and voice settings
- Scene-based script structure
