// Custom sections API routes: manage user's custom analysis sections
import { Hono } from "hono"
import { authenticateRequest } from "../services/auth.ts"
import { sql } from "@offerlens/db"
import type { CustomSection, SaveSectionRequest, UpdateSectionRequest } from "@offerlens/shared"

export const sectionsRoute = new Hono()
  // POST /api/sections — create
  .post("/", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    let body: SaveSectionRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return c.json({ error: "title is required" }, 400)
    }
    if (!body.prompt || typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
      return c.json({ error: "prompt is required" }, 400)
    }

    const [section] = await sql<
      Array<{
        id: number
        title: string
        prompt: string
        position_order: number
        is_active: boolean
        created_at: Date
      }>
    >`
      INSERT INTO custom_sections (user_id, title, prompt)
      VALUES (${auth.user!.sub}, ${body.title.trim()}, ${body.prompt.trim()})
      RETURNING id, title, prompt, position_order, is_active, created_at
    `
    return c.json(
      {
        id: section.id,
        title: section.title,
        prompt: section.prompt,
        positionOrder: section.position_order,
        isActive: section.is_active,
        createdAt: section.created_at.toISOString(),
      } satisfies CustomSection,
      201,
    )
  })
  // GET /api/sections — list user's sections
  .get("/", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const rows = await sql<
      Array<{
        id: number
        title: string
        prompt: string
        position_order: number
        is_active: boolean
        created_at: Date
      }>
    >`
      SELECT id, title, prompt, position_order, is_active, created_at
      FROM custom_sections
      WHERE user_id = ${auth.user!.sub}
      ORDER BY position_order ASC, id ASC
    `

    const sections: CustomSection[] = rows.map((
      r: {
        id: number
        title: string
        prompt: string
        position_order: number
        is_active: boolean
        created_at: Date
      },
    ) => ({
      id: r.id,
      title: r.title,
      prompt: r.prompt,
      positionOrder: r.position_order,
      isActive: r.is_active,
      createdAt: r.created_at.toISOString(),
    }))

    return c.json({ sections })
  })
  // PUT /api/sections/:id — update all fields
  .put("/:id", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const id = parseInt(c.req.param("id"))
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400)

    let body: UpdateSectionRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const [section] = await sql<
      Array<{
        id: number
        title: string
        prompt: string
        position_order: number
        is_active: boolean
        created_at: Date
      }>
    >`
      UPDATE custom_sections SET
        title = COALESCE(${body.title ?? null}, title),
        prompt = COALESCE(${body.prompt ?? null}, prompt),
        position_order = COALESCE(${body.positionOrder ?? null}, position_order),
        is_active = COALESCE(${body.isActive ?? null}, is_active)
      WHERE id = ${id} AND user_id = ${auth.user!.sub}
      RETURNING id, title, prompt, position_order, is_active, created_at
    `

    if (!section) {
      return c.json({ error: "Section not found" }, 404)
    }

    return c.json(
      {
        id: section.id,
        title: section.title,
        prompt: section.prompt,
        positionOrder: section.position_order,
        isActive: section.is_active,
        createdAt: section.created_at.toISOString(),
      } satisfies CustomSection,
    )
  })
  // DELETE /api/sections/:id — delete
  .delete("/:id", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const id = parseInt(c.req.param("id"))
    if (isNaN(id)) return c.json({ error: "Invalid id" }, 400)

    await sql`DELETE FROM custom_sections WHERE id = ${id} AND user_id = ${auth.user!.sub}`

    return c.json({ success: true })
  })
