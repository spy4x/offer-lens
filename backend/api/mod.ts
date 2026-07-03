// OfferLens Backend API — Hono server
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { analyzeRoute } from "./routes/analyze.ts"
import { batchRoute } from "./routes/batch.ts"
import { usageRoute } from "./routes/usage.ts"
import { Config } from "../services/config.ts"

const app = new Hono()

// Middleware
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-Session-Id", "Authorization"],
  maxAge: 86400,
}))

app.use("*", logger())

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

// API routes
app.route("/api/analyze", analyzeRoute)
app.route("/api/batch", batchRoute)
app.route("/api/usage", usageRoute)

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404))

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err)
  return c.json({ error: err.message || "Internal server error" }, 500)
})

// Start server
const port = Config.port
console.log(`OfferLens API starting on port ${port}...`)

Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch)
