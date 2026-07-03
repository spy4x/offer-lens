<p align="center">
  <img src="https://img.shields.io/badge/Build%20Challenge-2026-6366f1?style=for-the-badge" alt="Build Challenge 2026"/>
  <img src="https://img.shields.io/badge/It's%20Today%20Media-8b5cf6?style=for-the-badge" alt="It's Today Media"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deno-2.x-black?style=flat-square&logo=deno" alt="Deno 2.x"/>
  <img src="https://img.shields.io/badge/Hono-4.x-e36002?style=flat-square&logo=hono" alt="Hono 4.x"/>
  <img src="https://img.shields.io/badge/Preact-10.x-673ab8?style=flat-square&logo=preact" alt="Preact 10.x"/>
  <img src="https://img.shields.io/badge/DeepSeek-V3-4fc3f7?style=flat-square" alt="DeepSeek V3"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL 16"/>
  <img src="https://img.shields.io/badge/MCP-v1.29-22c55e?style=flat-square" alt="MCP v1.29"/>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License MIT"/>
</p>

<h1 align="center">
  🔍 OfferLens
</h1>

<p align="center">
  <strong>Media Buyer's AI Co-Pilot</strong><br/>
  Analyze any landing page in <strong>3 seconds</strong>.<br/>
  Get angles, hooks, ad copy, email/SMS angles, and competitive intel — instantly.
</p>

<p align="center">
  <a href="#-demo">Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-chrome-extension">Extension</a> •
  <a href="#-mcp-server">MCP Server</a>
</p>

---

## 🏆 The Story

> *"Your media buyers evaluate dozens of offers daily to decide what's worth running against email/SMS lists. OfferLens cuts that 20-minute decision to 10 seconds — angle extraction, ad copy, email/SMS angles, and competitive intel from any landing page."*

Built for the **It's Today Media Build Challenge 2026** — a competition with a real $5,000 prize for building tools that solve real problems for affiliate marketers.

**The problem:** Media buyers at It's Today Media evaluate dozens of offers daily. Each one takes 20 minutes to manually analyze — what's the angle, what ad copy works, what are competitors testing?

**The solution:** One codebase. Three interfaces. All sharing the same AI-powered analysis engine.

---

## 🎯 Demo

| Chrome Extension | Web App | MCP Server |
|---|---|---|
| Click → analyze → copy in 3 seconds | Paste URL → full report | Ask in natural language via Claude/Cursor |
| <img src="apps/extension/icon128.png" width="64"/> | <kbd>offer-lens.antonshubin.com</kbd> | <kbd>MCP stdio + HTTP</kbd> |

**50 free analyses included.** After that, bring your own OpenAI/DeepSeek API key.

---

## ✨ Features

### 🎯 Angle Detection
Identifies the primary persuasion angle with confidence score: scarcity, authority, social proof, pain relief, curiosity, urgency, transformation, FOMO.

### 📋 Ready-to-Use Ad Hooks
5 copy-paste ready hooks optimized for high CTR. Each under 15 words.

### 👤 Target Audience Analysis
Demographics, interests, likely traffic platform (Facebook / Google / Native / TikTok / YouTube), with confidence notes.

### 📝 Full Ad Copy Suite
**3 variants each** for Facebook, Google Ads, and Native ads — headline, primary text/body, and CTA. Ready to deploy.

### 📧 Email & SMS Angles
3 subject lines, email body angle summary, and a punchy 140-char SMS pitch — directly tied to the affiliate marketing core business.

### 🛡️ Trust Signal Audit
8 signal types checked (testimonials, guarantees, certifications, badges, social proof counts, media mentions, expert endorsements, before/after) — each rated present/absent with strength.

### ⚠️ Conversion Blockers
High/medium/low severity issues with actionable suggestions for improvement.

### 💡 A/B Test Ideas
3 testable hypotheses ranked by potential impact.

### 🕵️ Competitive Intelligence
Likely traffic sources, estimated daily spend tier, what competitors are testing, and 5 competitor counter-angles.

---

## 🚀 Quick Start

### 1️⃣ Backend API
```bash
git clone https://github.com/spy4x/offer-lens.git
cd offer-lens
cp .env.example .env

# Add your DeepSeek or OpenAI API key to .env
# DEMO_OPENAI_API_KEY=sk-...

# Start with in-memory storage (no DB needed)
deno run -A --env-file=.env main.ts
# → http://localhost:8000
```

### 2️⃣ Chrome Extension
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `apps/extension/`
4. Visit any landing page, click the OfferLens icon in toolbar

### 3️⃣ Web App
```bash
# Already served by the combined server at http://localhost:8000
# Or standalone:
deno run -A apps/web/main.ts
# → http://localhost:3000
```

### 4️⃣ MCP Server

**For Claude Desktop / Cursor (stdio):**
```json
{
  "mcpServers": {
    "offerlens": {
      "command": "deno",
      "args": ["run", "-A", "--env-file=.env", "apps/mcp-server/main.ts"],
      "env": {
        "OFFERLENS_BACKEND_URL": "http://localhost:8000"
      }
    }
  }
}
```

**For OpenWebUI (HTTP — auto-configured in deployed setup):**
```bash
deno run -A apps/mcp-server/main.ts --http
# → POST http://localhost:3000/mcp (JSON-RPC)
# → GET  http://localhost:3000/mcp (SSE)
# → GET  http://localhost:3000/health
```

---

## 🏗️ Architecture

```
offer-lens/
├── apps/
│   ├── extension/          # Chrome Extension (Manifest V3)
│   │   ├── manifest.json
│   │   ├── background.js   # Service worker — icon click → side panel
│   │   ├── content.js      # URL extraction from active tab
│   │   ├── sidepanel.html  # Dark theme UI
│   │   ├── sidepanel.js    # API calls, rendering, copy buttons
│   │   └── sidepanel.css   # Dark theme styles
│   ├── web/                # Web App
│   │   ├── main.ts         # Hono + Preact SSR server
│   │   └── static/         # CSS + client JS
│   └── mcp-server/         # MCP Server
│       └── main.ts         # Dual transport: stdio + HTTP
├── libs/
│   ├── shared/             # Types + constants (LandingPageAnalysis, etc.)
│   ├── scraper/            # HTML fetch + DOM parsing → PageContent
│   ├── prompts/            # LLM system prompt + JSON schema
│   ├── analyzer/           # Core: scrape → prompt → LLM → validate → return
│   └── db/                 # Postgres schema + in-memory fallback
├── backend/
│   ├── api/                # Hono routes: analyze, batch, usage
│   └── services/           # Config + demo usage tracking
├── main.ts                 # Combined server (API + Web)
├── compose.yml             # Docker Compose for homelab deployment
├── Dockerfile              # Combined server container
└── Dockerfile.mcp          # MCP server container
```

### Data Flow

```
User (Extension / Web / MCP)
  │
  ▼
POST /api/analyze ──→ scraper.scrapePage(url) ──→ HTML fetch + parse
                            │
                            ▼
                    prompts.buildUserPrompt()
                            │
                            ▼
                    analyzer.analyzeLandingPage()
                            │
                            ▼
                    LLM (DeepSeek V3) ──→ Structured JSON
                            │
                            ▼
                    LandingPageAnalysis ←── Validate + normalize
                            │
                            ▼
                    Response to user
```

---

## 🔌 API Reference

All endpoints require `X-Session-Id` header.

### `POST /api/analyze`
Analyze a single landing page.
```json
{
  "url": "https://example.com/offer",
  "apiKey": "sk-..."  // optional — brings your own key
}
```

### `POST /api/batch`
Analyze up to 50 URLs in parallel.
```json
{
  "urls": [
    "https://example.com/offer1",
    "https://example.com/offer2"
  ],
  "apiKey": "sk-..."  // optional
}
```

### `GET /api/usage`
Check remaining demo requests.
```
Response: { "used": 3, "limit": 50, "remaining": 47, "hasDemoKey": true }
```

---

## 🧩 Chrome Extension

<details>
<summary><strong>Click to expand details</strong></summary>

### Manifest V3
- **Side Panel** — opens on toolbar icon click
- **Content Script** — extracts current URL from active tab
- **Service Worker** — manages session ID and panel lifecycle
- **Dark theme** — marketing tools standard

### Features
- Copy any hook, headline, subject line, or SMS with one click
- Tab switching between Facebook / Google / Native ad copy
- Demo counter always visible
- Batch mode for multiple URLs
- Settings panel (API key, demo toggle, backend URL)
</details>

---

## 🧠 MCP Server

<details>
<summary><strong>Click to expand details</strong></summary>

### Tools

| Tool | Description | Parameters |
|---|---|---|
| `analyze_offer` | Analyze a landing page | `url` (required) |
| `batch_analyze_offers` | Batch analyze (max 50) | `urls` (required) |
| `check_usage` | Check demo requests | none |

### Dual Transport

| Mode | Usage | Transport |
|---|---|---|
| **Stdio** | Claude Desktop, Cursor | `MCP SDK StdioServerTransport` |
| **HTTP** | OpenWebUI, custom apps | `POST/GET /mcp`, `GET /health` |

### Env Variables

| Variable | Default | Description |
|---|---|---|
| `OFFERLENS_BACKEND_URL` | `http://localhost:8000` | Backend API URL |
| `OFFERLENS_API_KEY` | — | Override demo key |
| `OFFERLENS_SESSION_ID` | auto-generated | Usage tracking session |
| `MCP_HTTP_PORT` | `0` (disabled) | Enable HTTP mode on port |

### OpenWebUI Integration
OfferLens MCP automatically appears in OpenWebUI as **"OfferLens MCP"** tool — no manual config needed in the deployed setup.
</details>

---

## 🐳 Docker Deployment

```bash
# Development
docker compose up -d --build

# Production (homelab)
# The compose.yml includes Traefik labels for reverse proxy
# Domain: offer-lens.antonshubin.com
```

Contains 3 services:
- `offerlens` — Combined API + Web server (port 8000)
- `offerlens-mcp` — MCP server with HTTP transport (port 3000)
- `offerlens-db` — PostgreSQL 16 for usage persistence

---

## 🔐 Security

- **Demo API key is server-side only** — never exposed to clients
- **Bring Your Own Key** — user provides API key in request body, not stored server-side
- **No user accounts** — session-based usage tracking via `X-Session-Id`
- **No payment integration** — 50 free analyses, then BYOK
- **No external API dependencies** — only the LLM API (DeepSeek / OpenAI-compatible)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Deno 2.x](https://deno.com) |
| Backend | [Hono 4.x](https://hono.dev) |
| Frontend | [Preact 10.x](https://preactjs.com) + SSR |
| LLM | [DeepSeek V3](https://deepseek.com) (OpenAI-compatible) |
| Database | PostgreSQL 16 (optional — in-memory fallback) |
| Extension | Chrome Manifest V3 |
| MCP SDK | [@modelcontextprotocol/sdk v1.29](https://github.com/modelcontextprotocol/typescript-sdk) |
| Container | Docker / Docker Compose |

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built for <strong>It's Today Media Build Challenge 2026</strong><br/>
  <sub>July 3, 2026 • Submission by Anton Shubin</sub>
</p>
