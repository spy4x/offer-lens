// Backend API: batch analyze endpoint
// BYOK: auto-uses user's saved key when available
import { Hono } from "hono"
import type { BatchRequest, BatchResponse, BatchResult } from "@offerlens/shared"
import { MAX_BATCH_URLS } from "@offerlens/shared"
import { analyzeLandingPage } from "@offerlens/analyzer"
import { Config } from "@offerlens/backend-services"
import { getDb } from "@offerlens/db"
import { decrypt } from "@offerlens/encrypt"
import { checkDemoUsage, getDemoUsage, recordDemoUsage } from "../services/demo-usage.ts"
import { authenticateRequest } from "../services/auth.ts"

function getSessionId(c: { req: { header: (name: string) => string | undefined } }): string | null {
  return c.req.header("X-Session-Id") || null
}

export const batchRoute = new Hono()
  .post("/", async (c) => {
    const auth = await authenticateRequest(c)
    const userId = auth.user?.sub
    const sessionId = getSessionId(c)

    if (!userId && !sessionId) {
      return c.json({ error: "Authorization header or X-Session-Id header required" }, 400)
    }

    let body: BatchRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!Array.isArray(body.urls) || body.urls.length === 0) {
      return c.json({ error: "urls array is required" }, 400)
    }

    if (body.urls.length > MAX_BATCH_URLS) {
      return c.json(
        { error: `Maximum ${MAX_BATCH_URLS} URLs allowed per batch` },
        400,
      )
    }

    // Validate all URLs
    const invalidUrls = body.urls.filter((url) => {
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`)
        return false
      } catch {
        return true
      }
    })
    if (invalidUrls.length > 0) {
      return c.json(
        { error: `Invalid URLs: ${invalidUrls.join(", ")}` },
        400,
      )
    }

    // Resolve effective API key: body > saved key > demo key
    let effectiveApiKey = body.apiKey || ""
    let usedSavedKey = false
    let apiBase = Config.apiBase
    let model = Config.model

    if (!effectiveApiKey && userId) {
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
            continue
          }
        }
      }
    }

    if (!effectiveApiKey) {
      effectiveApiKey = Config.demoApiKey
    }

    // Check demo usage (skipped if user provided key or saved key is used)
    const { canProceed, usage } = await checkDemoUsage(
      sessionId || "",
      usedSavedKey || !!body.apiKey ? "byok" : undefined,
      userId,
    )
    if (!canProceed && !usedSavedKey && !body.apiKey) {
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

    // Calculate how many we can process
    const urlsToProcess = (usedSavedKey || !!body.apiKey)
      ? body.urls
      : body.urls.slice(0, usage.remaining)

    const concurrency = Config.batchConcurrency

    // Process in batches
    const results: BatchResult[] = []
    const errors: Array<{ url: string; error: string }> = []

    for (let i = 0; i < urlsToProcess.length; i += concurrency) {
      const batch = urlsToProcess.slice(i, i + concurrency)
      const batchPromises = batch.map(async (url): Promise<BatchResult> => {
        const analysis = await analyzeLandingPage(url, {
          apiKey: effectiveApiKey,
          apiBase,
          model,
        })
        return { url, analysis }
      })
      const batchResults = await Promise.allSettled(batchPromises)

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]
        if (result.status === "fulfilled") {
          results.push(result.value)
        } else {
          const message = result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
          errors.push({ url: batch[j], error: message })
        }
      }
    }

    // Add skipped URLs
    for (const url of body.urls.slice(urlsToProcess.length)) {
      errors.push({ url, error: "Skipped: demo limit reached" })
    }

    // Record usage (only for demo key)
    if (!usedSavedKey && !body.apiKey) {
      await recordDemoUsage(sessionId || "", "batch", urlsToProcess.length, userId)
    }

    // Store analyses in DB if user is authenticated
    if (userId) {
      try {
        const db = getDb()
        for (const r of results) {
          if (r.analysis) {
            await db.storeAnalysis(sessionId || "", userId, r.url, r.analysis)
          }
        }
      } catch (err) {
        console.error("Failed to store batch analyses:", err)
        // Storage failure is non-fatal
      }
    }

    const demoUsage = (usedSavedKey || !!body.apiKey)
      ? undefined
      : await getDemoUsage(sessionId || "", userId)

    const response: BatchResponse = { results, errors, demoUsage }
    return c.json(response)
  })
