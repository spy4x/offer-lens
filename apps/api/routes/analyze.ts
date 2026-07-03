// Backend API: analyze endpoint
// BYOK: auto-uses user's saved key when available instead of demo key
import { Hono } from "hono"
import type { AnalyzeRequest } from "@offerlens/shared"
import { analyzeLandingPage } from "@offerlens/analyzer"
import { Config } from "@offerlens/backend-services"
import { getDb } from "@offerlens/db"
import { decrypt } from "@offerlens/encrypt"
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

    // Resolve effective API key: body > saved key > demo key
    let effectiveApiKey = body.apiKey || ""
    let usedSavedKey = false
    let apiBase = Config.apiBase
    let model = Config.model

    if (!effectiveApiKey && userId) {
      // Try to find a saved key for any active provider
      const db = getDb()
      const activeProviders = await db.getActiveApiProviders(userId)
      for (const provider of activeProviders) {
        const keyData = await db.getApiKeyEncrypted(userId, provider)
        if (keyData) {
          try {
            effectiveApiKey = await decrypt(keyData.key_encrypted)
            if (keyData.base_url) apiBase = keyData.base_url
            if (keyData.model) model = keyData.model
            usedSavedKey = true
            break
          } catch {
            // Failed to decrypt this key, try next provider
            continue
          }
        }
      }
    }

    // Fallback to demo key
    if (!effectiveApiKey) {
      effectiveApiKey = Config.demoApiKey
    }

    // Check demo usage (skipped if user provided key or saved key is used)
    const { canProceed, usage } = await checkDemoUsage(
      sessionId || "",
      usedSavedKey || !!body.apiKey ? "byok" : undefined,
      userId,
    )
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

    try {
      const result = await analyzeLandingPage(body.url, {
        apiKey: effectiveApiKey,
        apiBase,
        model,
        customSections: body.customSections,
      })

      const { analysis, usage } = result

      // Record usage only when demo key used
      if (!usedSavedKey && !body.apiKey) {
        await recordDemoUsage(sessionId || "", "analyze", 1, userId)
      }

      // Store analysis in DB for all users (session-based or authenticated)
      let analysisId: number | null = null
      try {
        const db = getDb()
        const stored = await db.storeAnalysis(
          sessionId || "",
          userId || null,
          body.url,
          analysis,
          {
            prompt: usage.promptTokens,
            completion: usage.completionTokens,
            total: usage.totalTokens,
          },
        )
        analysisId = stored.id
      } catch (err) {
        console.error("Failed to store analysis:", err)
        // Storage failure is non-fatal
      }

      const demoUsageData = (usedSavedKey || !!body.apiKey)
        ? undefined
        : await getDemoUsage(sessionId || "", userId)

      const response = {
        id: analysisId,
        analysis,
        demoUsage: demoUsageData,
        tokensUsed: usage,
      }
      return c.json(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Analyze error for ${body.url}:`, message)
      return c.json({ error: message }, 500)
    }
  })
