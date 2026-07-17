# Product Hunt Launch — ClawForge

**Date:** TBD (target: after Phase 1 complete)  
**Pre-launch page:** https://www.producthunt.com/upcoming  
**Tagline:** Your demo, scripted. Write YAML, get MP4.

---

## Listing Details

### Product Name
ClawForge

### Tagline (60 chars max)
Demo videos as code — Write YAML, get a polished MP4

### Description (250 chars max)
ClawForge treats demo videos like code. Write a YAML script, get an MP4 with browser recording and AI voiceover. Built for hackathons, SaaS demos, and AI agents. MCP-native, Docker-ready, MIT license, no API keys needed.

### Topics
- Video Production
- Developer Tools
- Open Source
- AI Agents
- Hackathons

### Website
https://github.com/Dr-SoloDev/clawforge

---

## Visual Assets

### Logo
- Primary logo (horizontal lockup)
- Icon (512x512)

### Gallery Images (6)
1. **Hero banner** — ClawForge pipeline: Script → Record → Narrate → MP4
2. **`clawforge init` wizard** — Terminal screenshot of the interactive generator
3. **Demo script example** — YAML code screenshot syntax-highlighted
4. **Output comparison** — Before (no demo) → After (ClawForge demo)
5. **MCP integration** — Claude Code using clawforge_produce_video
6. **Architecture diagram** — Simple pipeline flow

### Demo Video (max 30s)
- Screen recording: terminal → `clawforge init` → `clawforge script.yaml` → result MP4
- Overlay text showing pipeline steps

---

## First Comment Draft

> Hey Product Hunt! 👋
>
> I'm Dr.SoloDev, a solo developer from Thailand 🇹🇭
>
> Last year I joined a hackathon with a solid project — but I couldn't finish the demo video in time. I lost. Not because the product was bad, but because video editing isn't my strength.
>
> So I built ClawForge — an AI-powered toolkit that turns YAML scripts into polished demo videos. No video editing. No re-recording when your UI changes. Just code.
>
> **How it works:**
> 1. Write a YAML script (or use `clawforge init` to generate one)
> 2. Run `clawforge script.yaml`
> 3. Get an MP4 with browser recording + AI voiceover
>
> **Why it's different:**
> - 🎬 Scripted, not recorded — version control your demos
> - 🤖 AI agent native — MCP server, SDK, structured errors
> - 🆓 MIT License, no API keys, runs entirely on your machine
> - 🐳 Docker-ready — zero-install container
> - 🎙️ 40+ AI voices, free (Microsoft edge-tts)
>
> I open-sourced it because no developer should lose a hackathon — or a customer — because they couldn't make a demo video.
>
> Would love your feedback! 🔥

---

## Maker Reply Template

For common questions:

**Q: How is this different from OBS / Loom?**
A: ClawForge is scripted, not recorded. Your demo is defined in YAML — version-controlled, reproducible, rebuildable in one command. UI changes? Rerun the script. No re-recording.

**Q: Do I need API keys?**
A: No. ClawForge is 100% local and free. AI voiceover uses Microsoft edge-tts (free). No cloud dependency.

**Q: Can my AI agent use this?**
A: Yes! ClawForge has a native MCP server. Claude Code, BuildingAI, and other MCP-compatible agents can call `clawforge_produce_video` directly.

**Q: Can I use it in CI?**
A: Yes. Docker support + non-interactive `--template` flag make it CI-ready.

**Q: What about Windows support?**
A: Core works on all platforms. edge-tts (Python) may need extra setup on Windows — Docker is recommended for Windows users.

---

## Social Media Posts

### X/Twitter Thread (Launch Day)

**Tweet 1:**
I built an open-source toolkit that turns YAML scripts into demo videos. 🎬

No video editing. No re-recording. Just code.

Meet ClawForge: Your demo, scripted. 🔥

**Tweet 2:**
The problem: every time your UI changes, your demo video is outdated.
The solution: define your demo in YAML, version control it, rebuild in one command.

```
git pull && clawforge demo.yaml → new MP4
```

**Tweet 3:**
Built for: Hackathons 🏆 | SaaS demos 🚀 | AI agents 🤖 | DevRel 📹

Features:
• Playwright browser recording
• 40+ AI voices (free)
• MCP server (AI agent native)
• Docker-ready
• MIT license

**Tweet 4:**
```
clawforge init          # Create a script
clawforge demo.yaml     # Get an MP4
```

That's it. No API keys. No subscription. 100% local.

**Tweet 5:**
Built by a solo dev in Thailand 🇹🇭, with my AI agent Hermes Turbo as a coding partner.

Open source, MIT, free forever.

GitHub → https://github.com/Dr-SoloDev/clawforge

---

### LinkedIn Post

**Title:** I lost a hackathon because I couldn't make a demo video. So I built the solution.

**Body:**
Last year, I spent weeks building a project for a hackathon. The code was solid. The idea was strong. But when it came time to make the presentation video... I froze.

I don't know how to edit video. I tried. I failed. I missed the deadline.

That frustration stayed with me. So I built ClawForge — an open-source toolkit that turns YAML scripts into professional demo videos. No video editing required. No re-recording when your UI changes. Just write the script, run it, get an MP4.

It's 100% free, MIT licensed, runs entirely on your machine, and works with AI agents via the MCP protocol.

👉 https://github.com/Dr-SoloDev/clawforge

If you've ever lost a demo opportunity because video production was a bottleneck — this is for you.

---

### Hacker News "Show HN" Draft

**Title:** Show HN: ClawForge – Demo Videos as Code (YAML → Playwright → MP4)

**Body:**
Hey HN,

ClawForge is a toolkit that turns YAML scripts into demo videos. I built it after losing a hackathon because I couldn't make a presentation video in time.

**Pipeline:** Script (YAML) → Playwright (record browser) → edge-tts (AI voiceover) → ffmpeg (render) → MP4

**Key features:**
- Scripted demos (version-controlled, reproducible)
- AI voiceover with 40+ languages (free, Microsoft edge-tts)
- MCP server for AI agent integration (Claude Code, BuildingAI)
- Interactive wizard (`clawforge init`)
- Docker support
- MIT license, no API keys, 100% local

**Quickstart:**
```bash
npm install -g clawforge
clawforge init --template landing-page
clawforge my-demo.yaml
```

GitHub: https://github.com/Dr-SoloDev/clawforge

Would love your thoughts and feedback!
