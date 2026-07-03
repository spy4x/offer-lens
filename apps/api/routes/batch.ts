// Backend API: batch analyze endpoint
import { Hono } from "hono"
import type { BatchRequest, BatchResponse, BatchResult } from "@offerlens/shared"
import { MAX_BATCH_URLS } from "@offerlens/shared"
import { analyzeLandingPage } from "@offerlens/analyzer"
import { Config } from "@offerlens/backend-services"
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

    // Check demo usage
    const { canProceed, usage } = await checkDemoUsage(sessionId || "", body.apiKey, userId)
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

    // Calculate how many we can process
    const urlsToProcess = body.apiKey ? body.urls : body.urls.slice(0, usage.remaining)

    const effectiveApiKey = body.apiKey || Config.demoApiKey
    const concurrency = Config.batchConcurrency

    // Process in batches
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

    // Add skipped URLs
    for (const url of body.urls.slice(urlsToProcess.length)) {
      errors.push({ url, error: "Skipped: demo limit reached" })
    }

    // Record usage (only for demo key)
    if (!body.apiKey) {
      await recordDemoUsage(sessionId || "", "batch", urlsToProcess.length, userId)
    }

    // Store analyses in DB if user is authenticated
    if (userId) {
      try {
        const { default: postgres } = await import("postgres")
        const sql = postgres({
          host: Deno.env.get("DB_HOST") || "localhost",
          port: parseInt(Deno.env.get("DB_PORT") || "5432"),
          database: Deno.env.get("DB_NAME") || "offerlens",
          user: Deno.env.get("DB_USER") || "offerlens",
          password: Deno.env.get("DB_PASS") || "offerlens",
          max: 2,
        })
        for (const r of results) {
          if (r.analysis) {
            await sql`
              INSERT INTO analyses (session_id, user_id, url, analysis)
              VALUES (${sessionId || ""}, ${userId}, ${r.url}, ${JSON.stringify(r.analysis)})
            `
          }
        }
        await sql.end()
      } catch {
        // Storage failure is non-fatal
      }
    }

    const demoUsage = body.apiKey ? undefined : await getDemoUsage(sessionId || "", userId)

    const response: BatchResponse = { results, errors, demoUsage }
    return c.json(response)
  })
