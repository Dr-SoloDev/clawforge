# ClawForge Skills

Pre-packaged skills for AI agents that work with ClawForge.

## What's a "skill"?

A skill is a markdown file (`SKILL.md`) with frontmatter that AI coding agents like [Hermes Agent](https://hermes-agent.nousresearch.com), Claude Skills, or compatible tools can load to learn how to use a tool effectively. Think of it as a focused, task-oriented mini-doc the agent reads on demand.

## Available Skills

### `clawforge/`

The full ClawForge usage skill — installation, YAML structure, action reference, SDK usage, MCP integration, voice options, common workflows, pitfalls, and troubleshooting.

**Load it from:**

- **Hermes Agent**: copy or symlink `skills/clawforge` into `~/.hermes/skills/`
  ```bash
  ln -s "$(pwd)/skills/clawforge" ~/.hermes/skills/clawforge
  ```
  Then `skill_view(name='clawforge')` in any session.

- **Claude Skills**: import the skill directory directly via your Claude config

- **Manual**: just open `skills/clawforge/SKILL.md` and read it — it's a single self-contained markdown file

## Use as a reference

Even if you don't use an AI agent, `skills/clawforge/SKILL.md` is the most concise guide to ClawForge in this repo — it covers everything in the README plus pitfalls, troubleshooting, and SDK examples.
