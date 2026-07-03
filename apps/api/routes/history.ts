// History endpoint: GET /api/analyses — list user's past analyses
// Analysis detail: GET /api/analyses/:id — public access by ID
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

      const items = rows.map((r) => {
        // Handle double-encoded JSON
        const analysisData = typeof r.analysis === "string" ? JSON.parse(r.analysis) : r.analysis
        return {
          id: r.id,
          url: r.url,
          createdAt: r.created_at.toISOString(),
          primaryAngle: (analysisData as { primaryAngle?: { type: string } })?.primaryAngle?.type ||
            null,
        }
      })

      return c.json({ analyses: items })
    } catch (err) {
      console.error("History error:", err)
      return c.json({ error: "Failed to fetch history" }, 500)
    }
  })
  // GET /api/analyses/:id — public, no auth required
  .get("/:id", async (c) => {
    const rawId = c.req.param("id")
    const id = parseInt(rawId, 10)
    if (isNaN(id) || id < 1) {
      return c.json({ error: "Invalid analysis ID" }, 400)
    }

    try {
      const db = getDb()
      const row = await db.getAnalysisById(id)

      if (!row) {
        return c.json({ error: "Analysis not found" }, 404)
      }

      // Handle double-encoded JSON (stored as JSON string in JSONB column)
      const analysisData = typeof row.analysis === "string"
        ? JSON.parse(row.analysis)
        : row.analysis

      return c.json({
        id: row.id,
        url: row.url,
        analysis: analysisData,
        createdAt: row.created_at.toISOString(),
        tokensUsed: {
          promptTokens: row.tokens_prompt,
          completionTokens: row.tokens_completion,
          totalTokens: row.tokens_total,
        },
      })
    } catch (err) {
      console.error("Error fetching analysis:", err)
      return c.json({ error: "Failed to fetch analysis" }, 500)
    }
  })
