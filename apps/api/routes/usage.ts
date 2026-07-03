// Backend API: usage endpoint
import { Hono } from "hono"
import { getDemoUsage } from "../services/demo-usage.ts"
import { authenticateRequest } from "../services/auth.ts"

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
    return c.json(usage)
  })
