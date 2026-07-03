// History endpoint: GET /api/analyses — list user's past analyses
import { Hono } from "hono"
import { getDb } from "@offerlens/db"
import { authenticateRequest } from "../services/auth.ts"

export const historyRoute = new Hono()
  .get("/", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const userId = auth.user!.sub

    try {
      const db = getDb()
      const rows = await db.getHistory(userId)

      const items = rows.map((r) => ({
        id: r.id,
        url: r.url,
        createdAt: r.created_at.toISOString(),
        primaryAngle: (r.analysis as { primaryAngle?: { type: string } })?.primaryAngle?.type ||
          null,
      }))

      return c.json({ analyses: items })
    } catch (err) {
      console.error("History error:", err)
      return c.json({ error: "Failed to fetch history" }, 500)
    }
  })
