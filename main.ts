// OfferLens Combined Server
// Serves: Hono API (/api/*) + SPA static files (/*)
// SPA built with Vite + Preact in apps/web/

import { type Context, Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { analyzeRoute } from "./apps/api/routes/analyze.ts"
import { batchRoute } from "./apps/api/routes/batch.ts"
import { usageRoute } from "./apps/api/routes/usage.ts"
import { authRoute } from "./apps/api/routes/auth.ts"
import { historyRoute } from "./apps/api/routes/history.ts"
import { keysRoute } from "./apps/api/routes/keys.ts"
import { sectionsRoute } from "./apps/api/routes/sections.ts"
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
app.route("/api/auth", authRoute)
app.route("/api/analyses", historyRoute)
app.route("/api/keys", keysRoute)
app.route("/api/sections", sectionsRoute)
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

// --- SPA static files ---
const SPA_DIR = "./apps/web/dist"

async function serveStatic(_c: Context, filePath: string): Promise<Response | null> {
  try {
    const content = await Deno.readFile(filePath)
    const ext = filePath.split(".").pop() || ""
    const mime: Record<string, string> = {
      "html": "text/html; charset=utf-8",
      "css": "text/css; charset=utf-8",
      "js": "application/javascript; charset=utf-8",
      "json": "application/json",
      "png": "image/png",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "gif": "image/gif",
      "svg": "image/svg+xml",
      "ico": "image/x-icon",
      "woff2": "font/woff2",
      "woff": "font/woff",
      "ttf": "font/ttf",
    }
    return new Response(content, {
      headers: { "Content-Type": mime[ext] || "application/octet-stream" },
    })
  } catch {
    return null
  }
}

app.get("/assets/*", async (c) => {
  const filePath = `${SPA_DIR}${c.req.path}`
  const result = await serveStatic(c, filePath)
  if (result) return result
  return c.notFound()
})

// --- SPA routes (explicit paths) ---
// serve index.html for all SPA pages
async function spaHandler(c: Context) {
  const result = await serveStatic(c, `${SPA_DIR}/index.html`)
  if (result) return result
  return c.notFound()
}

app.get("/", spaHandler)
app.get("/analyze", spaHandler)
app.get("/batch", spaHandler)
app.get("/login", spaHandler)
app.get("/register", spaHandler)
app.get("/history", spaHandler)
app.get("/settings", spaHandler)
app.get("/sections", spaHandler)
app.get("/analyses/:id", spaHandler)

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
console.log(`  SPA: http://0.0.0.0:${port}/`)
Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch)
