// Backend API: usage endpoint
import { Hono } from "hono"
import { getDemoUsage } from "../services/demo-usage.ts"

export const usageRoute = new Hono()
  .get("/", async (c) => {
    const sessionId = c.req.header("X-Session-Id")
    if (!sessionId) {
      return c.json({ error: "X-Session-Id header is required" }, 400)
    }

    const usage = await getDemoUsage(sessionId)
    return c.json(usage)
  })
