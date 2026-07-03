// Auth routes: register, login, attach, me
import { Hono } from "hono"
import {
  attachPassword,
  authenticateRequest,
  getUser,
  loginUser,
  registerUser,
} from "../services/auth.ts"
import type { AuthLoginRequest, AuthRegisterRequest } from "@offerlens/shared"

export const authRoute = new Hono()
  // POST /api/auth/register
  .post("/register", async (c) => {
    let body: AuthRegisterRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!body.email || typeof body.email !== "string") {
      return c.json({ error: "email is required" }, 400)
    }
    if (!body.password || typeof body.password !== "string" || body.password.length < 6) {
      return c.json({ error: "password must be at least 6 characters" }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return c.json({ error: "Invalid email format" }, 400)
    }

    // Pass session ID to link anonymous analyses to new user
    const sessionId = c.req.header("X-Session-Id") || undefined
    const result = await registerUser(body.email, body.password, sessionId)
    if ("error" in result) {
      return c.json({ error: result.error }, 409)
    }
    return c.json(result, 201)
  })
  // POST /api/auth/login
  .post("/login", async (c) => {
    let body: AuthLoginRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!body.email || !body.password) {
      return c.json({ error: "email and password required" }, 400)
    }

    const result = await loginUser(body.email, body.password)
    if ("error" in result) {
      return c.json({ error: result.error }, 401)
    }
    return c.json(result)
  })
  // POST /api/auth/attach — attach password to anonymous account
  .post("/attach", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    let body: { email: string; password: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!body.email || !body.password || body.password.length < 6) {
      return c.json({ error: "email and password (min 6 chars) required" }, 400)
    }

    const result = await attachPassword(auth.user!.sub, body.email, body.password)
    if ("error" in result) {
      return c.json({ error: result.error }, 409)
    }
    return c.json({ success: true })
  })
  // GET /api/auth/me — current user info
  .get("/me", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const user = await getUser(auth.user!.sub)
    if (!user) {
      return c.json({ error: "User not found" }, 404)
    }
    return c.json({ user })
  })
