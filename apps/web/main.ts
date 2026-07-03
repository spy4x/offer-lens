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
    <header class="flex justify-between items-center pb-4 border-b border-border mb-6">
      <div class="flex items-center gap-3">
        <a href="/" class="text-xl font-bold text-accent hover:no-underline">&#128269; OfferLens</a>
      </div>
      <div class="flex items-center gap-3">
        <span id="demoCounter" class="text-xs text-fg-2 bg-input px-3 py-1 rounded">&#128202; --/50</span>
        <a href="/batch" class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover no-underline">&#128230; Batch</a>
      </div>
    </header>
    <main>${body}</main>
    <footer class="mt-10 pt-5 border-t border-border text-center text-xs text-fg-3">
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
    <section class="text-center mb-6">
      <h1 class="text-3xl mb-2">Analyze Any Landing Page in Seconds</h1>
      <p class="text-base text-fg-2 mb-5">Get angles, hooks, ad copy, email/SMS angles, and competitive intel — instantly.</p>
      <form id="analyzeForm" class="max-w-[650px] mx-auto">
        <div class="flex gap-2 max-w-[650px] mx-auto">
          <input type="url" id="urlInput" class="w-full px-4.5 py-3.5 bg-input border border-border rounded-lg text-fg text-base focus:outline-none focus:border-accent" placeholder="Paste a landing page URL..." required />
          <button type="submit" class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer">&#128270; Analyze</button>
        </div>
      </form>
    </section>
    <div id="loadingState" class="text-center py-10 hidden">
      <div class="spinner"></div>
      <p>Analyzing page... (2-5s)</p>
    </div>
    <div id="errorState" class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="mt-6 hidden"></div>
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
    <section class="text-center mb-6">
      <h1 class="text-3xl mb-2">Analysis Results</h1>
      <div class="bg-input border border-border rounded-lg px-3.5 py-2.5 max-w-[650px] mx-auto text-left">
        <span class="text-xs text-fg-3 block">Analyzed page:</span>
        <span class="text-sm text-fg-2 break-all">${escapeHtml(url)}</span>
      </div>
    </section>
    <div id="loadingState" class="text-center py-10">
      <div class="spinner"></div>
      <p>Analyzing page... (2-5s)</p>
    </div>
    <div id="errorState" class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="mt-6 hidden"></div>
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
    <section class="text-center mb-6">
      <h1 class="text-3xl mb-2">Batch Analysis</h1>
      <p class="text-base text-fg-2 mb-5">Paste up to 50 URLs (one per line) for comparison.</p>
      <div class="max-w-[650px] mx-auto flex flex-col gap-3">
        <textarea id="batchUrls" class="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg text-fg text-base focus:outline-none focus:border-accent resize-vertical min-h-[200px]" rows="10" placeholder="https://example.com/offer1&#10;https://example.com/offer2&#10;..."></textarea>
        <button id="batchAnalyzeBtn" class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer">&#128270; Analyze All</button>
      </div>
    </section>
    <div id="loadingState" class="text-center py-10 hidden">
      <div class="spinner"></div>
      <p id="loadingText">Analyzing pages...</p>
    </div>
    <div id="errorState" class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="mt-6 hidden"></div>
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
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
    /"/g,
    "&quot;",
  )
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/`/g, "&#96;")
}
