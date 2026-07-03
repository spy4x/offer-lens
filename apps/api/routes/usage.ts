// Backend API: usage endpoint
import { Hono } from "hono"
import { getDemoUsage } from "../services/demo-usage.ts"
import { authenticateRequest } from "../services/auth.ts"
import { getDb } from "@offerlens/db"

export const usageRoute = new Hono()
  .get("/", async (c) => {
    // Try auth first, fall back to session
    const auth = await authenticateRequest(c)
    const userId = auth.user?.sub
    const sessionId = c.req.header("X-Session-Id")

    if (!userId && !sessionId) {
      return c.json({ error: "Authorization header or X-Session-Id header required" }, 400)
    }

    const usage = await getDemoUsage(sessionId || "", userId)

    // If user has their own API key, mark demo counter as inactive
    if (userId) {
      try {
        const db = getDb()
        const activeProviders = await db.getActiveApiProviders(userId)
        if (activeProviders.length > 0) {
          usage.hasDemoKey = false
        }
      } catch {
        // Non-fatal
      }
    }

    return c.json(usage)
  })
