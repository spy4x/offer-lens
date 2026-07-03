// OfferLens Combined Server
// Serves: Hono API (/api/*) + Web App (/*)
// One process, one container, one port

import { type Context, Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { analyzeRoute } from "./apps/api/routes/analyze.ts"
import { batchRoute } from "./apps/api/routes/batch.ts"
import { usageRoute } from "./apps/api/routes/usage.ts"
import { Config } from "./apps/api/services/config.ts"

const app = new Hono()

// --- Middleware ---
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Session-Id", "Authorization"],
    maxAge: 86400,
  }),
)
app.use("*", logger())

// --- API Routes ---
app.route("/api/analyze", analyzeRoute)
app.route("/api/batch", batchRoute)
app.route("/api/usage", usageRoute)
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

// --- Static files for web app ---
app.get("/styles.css", async (_c) => {
  const css = await Deno.readTextFile("./apps/web/static/styles.css")
  return new Response(css, { headers: { "Content-Type": "text/css; charset=utf-8" } })
})
app.get("/app.js", async (_c) => {
  const js = await Deno.readTextFile("./apps/web/static/app.js")
  return new Response(js, { headers: { "Content-Type": "application/javascript; charset=utf-8" } })
})

// --- Web App Routes ---
app.get("/", serveWebPage("home"))
app.get("/analyze", serveWebPage("analyze"))
app.get("/batch", serveWebPage("batch"))

function serveWebPage(page: string) {
  return (c: Context) => {
    const url = new URL(c.req.url)
    const urlParam = url.searchParams.get("url") || ""

    const preloadUrl = page === "analyze" && urlParam
      ? `const PRELOADED_URL = "${escAttr(urlParam)}"`
      : ""

    let body = ""
    let title = "Home"

    if (page === "home" || page === "analyze") {
      const urlDisplay = page === "analyze"
        ? `<div class="bg-input border border-border rounded-lg px-3.5 py-2.5 max-w-[650px] mx-auto text-left"><span class="text-xs text-fg-3 block">Analyzed page:</span><span class="text-sm text-fg-2 break-all">${
          escHtml(urlParam)
        }</span></div>`
        : `<form id="analyzeForm" class="max-w-[650px] mx-auto">
            <div class="flex gap-2 max-w-[650px] mx-auto">
              <input type="url" id="urlInput" class="w-full px-4.5 py-3.5 bg-input border border-border rounded-lg text-fg text-base focus:outline-none focus:border-accent" placeholder="Paste a landing page URL..." required />
              <button type="submit" class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer">&#128270; Analyze</button>
            </div>
          </form>`

      title = page === "analyze" ? "Analysis" : "Home"
      body = `<section class="text-center mb-6">
        <h1 class="text-3xl mb-2">${
        page === "analyze" ? "Analysis Results" : "Analyze Any Landing Page in Seconds"
      }</h1>
        ${
        page === "home"
          ? '<p class="text-base text-fg-2 mb-5">Get angles, hooks, ad copy, email/SMS angles, and competitive intel — instantly.</p>'
          : ""
      }
        ${urlDisplay}
      </section>`
    } else if (page === "batch") {
      title = "Batch Analysis"
      body = `<section class="text-center mb-6">
        <h1 class="text-3xl mb-2">Batch Analysis</h1>
        <p class="text-base text-fg-2 mb-5">Paste up to 50 URLs (one per line) for comparison.</p>
        <div class="max-w-[650px] mx-auto flex flex-col gap-3">
          <textarea id="batchUrls" class="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg text-fg text-base focus:outline-none focus:border-accent resize-vertical min-h-[200px]" rows="10" placeholder="https://example.com/offer1&#10;https://example.com/offer2&#10;..."></textarea>
          <button id="batchAnalyzeBtn" class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer">&#128270; Analyze All</button>
        </div>
      </section>`
    }

    return c.html(renderShell(title, body, preloadUrl))
  }
}

function renderShell(title: string, body: string, extraScripts: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | OfferLens</title>
  <link rel="stylesheet" href="/styles.css" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#128269;</text></svg>" />
</head>
<body class="dark bg-surface text-fg min-h-screen">
  <div id="app" class="max-w-[900px] mx-auto px-5 py-4 pb-10">
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
    <div id="loadingState" class="text-center py-10 hidden">
      <div class="spinner"></div>
      <p>Analyzing page... (2-5s)</p>
    </div>
    <div id="errorState" class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center hidden">
      <p id="errorMessage"></p>
    </div>
    <div id="results" class="mt-6 hidden"></div>
    <footer class="mt-10 pt-5 border-t border-border text-center text-xs text-fg-3">
      <span>OfferLens v1.0 &middot; It's Today Media</span>
    </footer>
  </div>
  <script>
    const BACKEND_URL = ""
    const SESSION_ID = localStorage.getItem("ol_session") || (() => { const id = crypto.randomUUID(); localStorage.setItem("ol_session", id); return id })()
    ${extraScripts}
  </script>
  <script src="/app.js"></script>
</body>
</html>`
}

// --- Helpers ---
function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
    /"/g,
    "&quot;",
  )
}
function escAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/`/g, "&#96;")
}

// --- Error handlers ---
app.notFound((c) => c.json({ error: "Not found" }, 404))
app.onError((err, c) => {
  console.error("Unhandled error:", err)
  return c.json({ error: err.message || "Internal server error" }, 500)
})

// --- Start ---
const port = Config.port
console.log(`OfferLens server starting on http://0.0.0.0:${port}...`)
console.log(`  API: http://0.0.0.0:${port}/api/health`)
console.log(`  Web: http://0.0.0.0:${port}/`)
Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch)
