# ClawForge Brand Guidelines v1.0

> **Status:** Draft — Ready for Review  
> **Design Lead:** ครีเอท  
> **Product:** ClawForge — Demo Videos as Code

---

## 1. Brand Foundation

| Element | Definition |
|---------|------------|
| **Product Name** | ClawForge (PascalCase) |
| **Tagline** | "Your demo, scripted." |
| **Secondary** | "Demo videos as code." |
| **Archetype** | The Creator × The Hero |
| **Personality** | Powerful, precise, industrial, approachable |
| **Vibe** | "Blacksmith of the digital age" — forge YAML into video |

### Mission Statement
> "Make every demo video version-controllable, reproducible, and buildable in one command."

### Brand Promise
> "Write it once. Rebuild it forever. Never re-record again."

---

## 2. Logo System

### 2.1 Primary Logo — Horizontal Lockup
```
[Claw Icon + Spark] [ClawForge]
                     Your demo, scripted.
```
- **Format:** SVG, PNG 1024×384
- **Usage:** Header, README, website hero, docs
- **Clear space:** 1× height of "C" on all sides

### 2.2 Icon Only
```
[Claw Icon + Spark]
```
- **Format:** SVG, PNG 512×512
- **Usage:** Favicon, app icon, social avatar, GitHub avatar
- **Variants:** Light mode (dark icon), Dark mode (light icon)

### 2.3 Wordmark Only
```
ClawForge
```
- **Font:** JetBrains Mono Bold
- **C and F** — slightly larger cap height (110%)
- **Usage:** Navigation, terminal output headers, loading states

### 2.4 Symbol / Emoji
```
🔥
```
- **Usage:** CLI output decoration, informal social media, Discord bot
- **Context:** Always paired with actual text — never standalone

### 2.5 Logo Construction
The Claw icon represents:
- A **crab/claw** gripping downward — grabbing footage
- A **forge hammer** — shaping raw footage into finished video
- A **spark** — the moment of creation

### 2.6 Incorrect Usage
- ❌ Do not stretch or distort
- ❌ Do not change colors outside palette
- ❌ Do not place on low-contrast backgrounds
- ❌ Do not add drop shadows or effects
- ❌ Do not rearrange elements

---

## 3. Color Palette — "Forge Flame"

### 3.1 Primary Colors

| Token | Hex | Preview | Usage |
|-------|-----|---------|-------|
| `--cf-orange` | `#F97316` | 🟠 | Primary brand color, CTAs, active states |
| `--cf-ember` | `#EA580C` | 🔶 | Hover states, focus rings |
| `--cf-dark` | `#0C0A09` | ⚫ | Background (dark theme), terminal |
| `--cf-steel` | `#292524` | ⬛ | Surface color, cards, elevated panels |

### 3.2 Accent Colors

| Token | Hex | Preview | Usage |
|-------|-----|---------|-------|
| `--cf-glow` | `#FDE047` | 💛 | Highlights, sparks, premium accents |
| `--cf-silver` | `#A8A29E` | 🔘 | Secondary text, metadata |
| `--cf-smoke` | `#44403C` | 🌫️ | Borders, dividers, disabled states |

### 3.3 Functional Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--cf-success` | `#22C55E` | ✅ Pipeline success, valid script |
| `--cf-danger` | `#EF4444` | ❌ Errors, failures |
| `--cf-warning` | `#F59E0B` | ⚠️ Warnings, deprecations |
| `--cf-info` | `#3B82F6` | ℹ️ Info, tips, suggestions |

### 3.4 Color Usage Rules

```
Background:        --cf-dark (#0C0A09)
Surface:           --cf-steel (#292524)
Primary text:      white (#FFFFFF)
Secondary text:    --cf-silver (#A8A29E)
Accent/CTA:        --cf-orange (#F97316)
Success:           --cf-success (#22C55E)
Error:             --cf-danger (#EF4444)
```

### 3.5 Gradients

| Gradient | Definition | Usage |
|----------|------------|-------|
| **Hero** | `linear-gradient(135deg, #0C0A09 0%, #F97316 100%)` | Landing page hero |
| **Button** | `linear-gradient(90deg, #F97316, #EA580C)` | Primary buttons |
| **Glow** | `radial-gradient(circle, #FDE047 0%, transparent 70%)` | Spark effects |

---

## 4. Typography

### 4.1 Font Stack

| Usage | Font | Fallback | Weight |
|-------|------|----------|--------|
| **Headings** | JetBrains Mono | `monospace` | 700 (Bold) |
| **Body** | Inter | `system-ui, sans-serif` | 400 (Regular) |
| **Code/CLI** | JetBrains Mono | `monospace` | 500 (Medium) |
| **Tagline** | Inter | `system-ui, sans-serif` | 600 (Semi-Bold) Italic |

### 4.2 Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-hero` | 64px / 4rem | 1.1 | Landing page H1 |
| `--text-h1` | 36px / 2.25rem | 1.2 | Page heading |
| `--text-h2` | 28px / 1.75rem | 1.25 | Section heading |
| `--text-h3` | 20px / 1.25rem | 1.3 | Subsection heading |
| `--text-body` | 16px / 1rem | 1.5 | Body text |
| `--text-sm` | 14px / 0.875rem | 1.5 | Captions, metadata |
| `--text-xs` | 12px / 0.75rem | 1.5 | Labels, badges |
| `--text-code` | 14px / 0.875rem | 1.7 | Code blocks, CLI |

### 4.3 CLI Output Typography
```
Font: JetBrains Mono
Size: 14px
Color: #FFFFFF on --cf-dark (#0C0A09)
Prefix: "⚡ " for informative messages
        "✅ " for success
        "❌ " for errors
        "  " (2 spaces) for indented details
```

---

## 5. Brand Voice & Tone

### 5.1 Voice Principles

| Principle | Description |
|-----------|-------------|
| **Direct** | Say what you mean. No fluff. |
| **Confident** | ClawForge works. Own it. |
| **Helpful** | When errors happen, guide — don't blame. |
| **Human** | Not robotic. Not overly casual. Just right. |

### 5.2 Tone by Channel

| Channel | Tone | Example |
|---------|------|---------|
| **CLI output** | Direct, minimal | `⚡ ClawForge — Your demo, scripted.` |
| **Error messages** | Helpful + solution-oriented | `❌ Selector not found. 📸 Screenshot saved. 💡 Tip: Use a more specific selector.` |
| **Marketing** | Bold, aspirational | "Stop re-recording. Start scripting." |
| **Docs** | Precise, technical | "ClawForge treats demo videos like code — version-controlled, reproducible, rebuildable." |
| **Social** | Playful, energetic | "I just made a demo video in 2 minutes with YAML. No recording. No editing. Just code. 🔥" |
| **Community** | Welcoming, supportive | "Welcome! Show us what you built with ClawForge." |

### 5.3 Words to Use / Avoid

| ✅ Use | ❌ Avoid |
|--------|----------|
| Script, produce, forge | Record, edit, render (as main verb) |
| Demo video | Screen recording |
| Reproducible, version-controlled | One-time, manual |
| Agent-native, MCP | API wrapper, integration |
| Forged, built, crafted | Generated, created (AI-generated vibes) |

---

## 6. Terminal / CLI Branding

### 6.1 Welcome Banner
```
  ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
  ⚡     ClawForge — v0.4.0        ⚡
  ⚡  Your demo, scripted.         ⚡
  ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
```

### 6.2 Progress Indicators
```
▶  Narration      🎙️  Generating...
✅ Narction      🎙️  Done (12.4s)
▶  Recording      🎬  3 scenes at 1280x720
✅ Recording      🎬  Complete
▶  Composition    🎞️  Encoding MP4...
✅ Composition    🎞️  output.mp4 (4.2 MB)
```

---

## 7. Brand Assets Checklist

| Asset | Format | Status | Priority |
|-------|--------|--------|----------|
| Logo — Horizontal lockup | SVG, PNG 1024×384 | ❌ | P0 |
| Logo — Icon | SVG, PNG 512×512 | ❌ | P0 |
| Logo — Wordmark | SVG, PNG | ❌ | P0 |
| Favicon | SVG, PNG 32×32 | ❌ | P0 |
| OG Image (Social Card) | PNG 1200×630 | ❌ | P1 |
| GitHub Social Preview | PNG 1280×640 | ❌ | P1 |
| Hero Banner (Landing) | PNG 1440×480 | ❌ | P1 |
| Terminal Screenshot | PNG 1200×600 | ❌ | P1 |
| Demo Output Showcase | PNG 1280×720 | ❌ | P1 |
| CLI Welcome Banner art | ASCII text | ❌ | P2 |

---

## 8. Application Branding (Landing Page)

### 8.1 Hero Section
```
┌──────────────────────────────────────────────────┐
│  [Logo]  ClawForge                               │
│                                                  │
│         Your demo, scripted.                      │
│   Write YAML. Get MP4. Version control it.        │
│                                                  │
│  [npm install -g clawforge]  [Docker] [GitHub]   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │           ▶  Auto-play demo video        │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### 8.2 Color Mode
- **Default:** Dark theme (--cf-dark background)
- **Code blocks:** Always dark, regardless of site theme
- **Diagrams:** Use orange accent for lines, white text

---

*Brand Guidelines v1.0 — ClawForge by Dr.SoloDev*
