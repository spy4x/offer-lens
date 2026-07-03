// History endpoint: GET /api/analyses — list user's past analyses
import { Hono } from "hono"
import { authenticateRequest } from "../services/auth.ts"

export const historyRoute = new Hono()
  .get("/", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const userId = auth.user!.sub

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

      type AnalysisRow = {
        id: number
        url: string
        created_at: Date
        analysis: Record<string, unknown>
      }
      const rows = await sql<AnalysisRow[]>`
        SELECT id, url, created_at, analysis
        FROM analyses
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 100
      `

      await sql.end()

      const items = rows.map((r: AnalysisRow) => ({
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
