// Backend API: analyze endpoint
import { Hono } from "hono"
import type { AnalyzeRequest, AnalyzeResponse } from "@offerlens/shared"
import { analyzeLandingPage } from "@offerlens/analyzer"
import { Config } from "@offerlens/backend-services"
import { getDb } from "@offerlens/db"
import { checkDemoUsage, getDemoUsage, recordDemoUsage } from "../services/demo-usage.ts"
import { authenticateRequest } from "../services/auth.ts"

function getSessionId(c: { req: { header: (name: string) => string | undefined } }): string | null {
  return c.req.header("X-Session-Id") || null
}

export const analyzeRoute = new Hono()
  .post("/", async (c) => {
    // Try auth first, fall back to session
    const auth = await authenticateRequest(c)
    const userId = auth.user?.sub
    const sessionId = getSessionId(c)

    if (!userId && !sessionId) {
      return c.json({ error: "Authorization header or X-Session-Id header required" }, 400)
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
    const { canProceed, usage } = await checkDemoUsage(sessionId || "", body.apiKey, userId)
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
        await recordDemoUsage(sessionId || "", "analyze", 1, userId)
      }

      // Store analysis in DB if user is authenticated
      if (userId) {
        try {
          const db = getDb()
          await db.storeAnalysis(sessionId || "", userId, body.url, analysis)
        } catch (err) {
          console.error("Failed to store analysis:", err)
          // Storage failure is non-fatal
        }
      }

      const demoUsage = body.apiKey ? undefined : await getDemoUsage(sessionId || "", userId)

      const response: AnalyzeResponse = { analysis, demoUsage }
      return c.json(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Analyze error for ${body.url}:`, message)
      return c.json({ error: message }, 500)
    }
  })
