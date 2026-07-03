// Backend API: analyze endpoint
import { Hono } from "hono"
import type { AnalyzeRequest, AnalyzeResponse } from "@offerlens/shared"
import { analyzeLandingPage } from "@offerlens/analyzer"
import { Config } from "@offerlens/backend-services"
import { checkDemoUsage, recordDemoUsage, getDemoUsage } from "../../services/demo-usage.ts"

export const analyzeRoute = new Hono()
  .post("/", async (c) => {
    const sessionId = c.req.header("X-Session-Id")
    if (!sessionId) {
      return c.json({ error: "X-Session-Id header is required" }, 400)
    }

    let body: AnalyzeRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!body.url || typeof body.url !== "string") {
      return c.json({ error: "url is required" }, 400)
    }

    // Validate URL format
    try {
      new URL(body.url.startsWith("http") ? body.url : `https://${body.url}`)
    } catch {
      return c.json({ error: "Invalid URL format" }, 400)
    }

    // Check demo usage
    const { canProceed, usage } = await checkDemoUsage(sessionId, body.apiKey)
    if (!canProceed) {
      if (usage.limit === 0) {
        return c.json(
          { error: "Demo key not configured on server. Provide your own API key." },
          503,
        )
      }
      return c.json(
        { error: "Demo limit reached", used: usage.used, limit: usage.limit },
        429,
      )
    }

    // Use user's key or demo key
    const effectiveApiKey = body.apiKey || Config.demoApiKey

    try {
      const analysis = await analyzeLandingPage(body.url, {
        apiKey: effectiveApiKey,
        apiBase: Config.apiBase,
        model: Config.model,
      })

      // Record usage (only for demo key, not user's own key)
      if (!body.apiKey) {
        await recordDemoUsage(sessionId, "analyze", 1)
      }

      const demoUsage = body.apiKey ? undefined : await getDemoUsage(sessionId)

      const response: AnalyzeResponse = { analysis, demoUsage }
      return c.json(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Analyze error for ${body.url}:`, message)
      return c.json({ error: message }, 500)
    }
  })
