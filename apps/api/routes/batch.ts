// Backend API: batch analyze endpoint
import { Hono } from "hono"
import type { BatchRequest, BatchResponse, BatchResult } from "@offerlens/shared"
import { MAX_BATCH_URLS } from "@offerlens/shared"
import { analyzeLandingPage } from "@offerlens/analyzer"
import { Config } from "@offerlens/backend-services"
import { checkDemoUsage, getDemoUsage, recordDemoUsage } from "../services/demo-usage.ts"

export const batchRoute = new Hono()
  .post("/", async (c) => {
    const sessionId = c.req.header("X-Session-Id")
    if (!sessionId) {
      return c.json({ error: "X-Session-Id header is required" }, 400)
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

    // Check demo usage — count all URLs against limit
    const { canProceed, usage } = await checkDemoUsage(sessionId, body.apiKey)
    if (!canProceed && !body.apiKey) {
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

    // Calculate how many we can process with demo key
    const urlsToProcess = body.apiKey ? body.urls : body.urls.slice(0, usage.remaining)

    const effectiveApiKey = body.apiKey || Config.demoApiKey
    const concurrency = Config.batchConcurrency

    // Process in batches of concurrency
    const results: BatchResult[] = []
    const errors: Array<{ url: string; error: string }> = []

    for (let i = 0; i < urlsToProcess.length; i += concurrency) {
      const batch = urlsToProcess.slice(i, i + concurrency)
      const batchPromises = batch.map(async (url): Promise<BatchResult> => {
        const analysis = await analyzeLandingPage(url, {
          apiKey: effectiveApiKey,
          apiBase: Config.apiBase,
          model: Config.model,
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

    // Add skipped URLs (if demo limit exceeded)
    for (const url of body.urls.slice(urlsToProcess.length)) {
      errors.push({ url, error: "Skipped: demo limit reached" })
    }

    // Record usage (only for demo key)
    if (!body.apiKey) {
      await recordDemoUsage(sessionId, "batch", urlsToProcess.length)
    }

    const demoUsage = body.apiKey ? undefined : await getDemoUsage(sessionId)

    const response: BatchResponse = { results, errors, demoUsage }
    return c.json(response)
  })
