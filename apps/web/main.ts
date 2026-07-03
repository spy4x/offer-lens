// OfferLens Web App — Fresh + Preact SSR
import { App, staticFiles } from "jsr:@fresh/core"
import { renderToString } from "npm:preact-render-to-string"

const BACKEND_URL = Deno.env.get("OFFERLENS_BACKEND_URL") || "http://localhost:8000"

const app = new App()

// Static files
app.use(staticFiles(import.meta.resolve("./static").replace("file://", "")))

// --- HTML shell helper ---
function shell(title: string, head: string, body: string, scripts: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | OfferLens</title>
  <link rel="stylesheet" href="/styles.css" />
  ${head}
</head>
<body class="dark">
  <div id="app">
    <header class="header">
      <div class="header-left">
        <a href="/" class="logo">&#128269; OfferLens</a>
      </div>
      <div class="header-right">
        <span id="demoCounter" class="demo-counter">&#128202; --/50</span>
        <a href="/batch" class="btn btn-small">&#128230; Batch</a>
      </div>
    </header>
    <main>${body}</main>
    <footer class="footer">
      <span>OfferLens v1.0 &middot; <a href="https://itstodaymedia.com">It's Today Media</a></span>
    </footer>
  </div>
  ${scripts}
</body>
</html>`
}

// --- Routes ---

// Home page
app.get("/", (_req) => {
  const body = `
    <section class="hero">
      <h1>Analyze Any Landing Page in Seconds</h1>
      <p class="hero-sub">Get angles, hooks, ad copy, email/SMS angles, and competitive intel — instantly.</p>
      <form id="analyzeForm" class="analyze-form">
        <div class="input-group">
          <input type="url" id="urlInput" class="input input-lg" placeholder="Paste a landing page URL..." required />
          <button type="submit" class="btn btn-primary btn-lg">&#128270; Analyze</button>
        </div>
      </form>
    </section>
    <div id="loadingState" class="loading hidden">
      <div class="spinner"></div>
      <p>Analyzing page... (2-5s)</p>
    </div>
    <div id="errorState" class="error hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="results hidden"></div>
  `
  const scripts = `
    <script>
      const BACKEND_URL = "${BACKEND_URL}"
      const SESSION_ID = localStorage.getItem("ol_session") || (() => { const id = crypto.randomUUID(); localStorage.setItem("ol_session", id); return id })()
    </script>
    <script src="/app.js"></script>
  `
  return new Response(shell("Home", "", body, scripts), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
})

// Analyze page (shows results for a URL via query param)
app.get("/analyze", (req) => {
  const url = new URL(req.url).searchParams.get("url") || ""
  const body = `
    <section class="hero">
      <h1>Analysis Results</h1>
      <div class="url-display">
        <span class="url-label">Analyzed page:</span>
        <span class="url-text">${escapeHtml(url)}</span>
      </div>
    </section>
    <div id="loadingState" class="loading">
      <div class="spinner"></div>
      <p>Analyzing page... (2-5s)</p>
    </div>
    <div id="errorState" class="error hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="results hidden"></div>
  `
  const scripts = `
    <script>
      const BACKEND_URL = "${BACKEND_URL}"
      const SESSION_ID = localStorage.getItem("ol_session") || (() => { const id = crypto.randomUUID(); localStorage.setItem("ol_session", id); return id })()
      const PRELOADED_URL = "${escapeAttr(url)}"
    </script>
    <script src="/app.js"></script>
  `
  return new Response(shell("Analysis", "", body, scripts), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
})

// Batch page
app.get("/batch", (_req) => {
  const body = `
    <section class="hero">
      <h1>Batch Analysis</h1>
      <p class="hero-sub">Paste up to 50 URLs (one per line) for comparison.</p>
      <div class="batch-form">
        <textarea id="batchUrls" class="textarea textarea-lg" rows="10" placeholder="https://example.com/offer1&#10;https://example.com/offer2&#10;..."></textarea>
        <button id="batchAnalyzeBtn" class="btn btn-primary btn-lg">&#128270; Analyze All</button>
      </div>
    </section>
    <div id="loadingState" class="loading hidden">
      <div class="spinner"></div>
      <p id="loadingText">Analyzing pages...</p>
    </div>
    <div id="errorState" class="error hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="results hidden"></div>
  `
  const scripts = `
    <script>
      const BACKEND_URL = "${BACKEND_URL}"
      const SESSION_ID = localStorage.getItem("ol_session") || (() => { const id = crypto.randomUUID(); localStorage.setItem("ol_session", id); return id })()
    </script>
    <script src="/app.js"></script>
  `
  return new Response(shell("Batch Analysis", "", body, scripts), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
})

// Start server
const port = parseInt(Deno.env.get("WEB_PORT") || "3000")
console.log(`OfferLens Web starting on port ${port}...`)
Deno.serve({ port, hostname: "0.0.0.0" }, app.handler())

// --- Helpers ---
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/`/g, "&#96;")
}
