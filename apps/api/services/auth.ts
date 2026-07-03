// Auth service — DB operations for users
import postgres from "postgres"
import { ANONYMOUS_LIMIT } from "@offerlens/shared"
import {
  createToken,
  hashPassword,
  type JwtPayload,
  verifyPassword,
  verifyToken,
} from "@offerlens/auth"

function getSql() {
  return postgres({
    host: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    database: Deno.env.get("DB_NAME") || "offerlens",
    user: Deno.env.get("DB_USER") || "offerlens",
    password: Deno.env.get("DB_PASS") || "offerlens",
    max: 5,
  })
}

// --- Anonymous user ---

export async function createAnonymousUser(sessionId: string): Promise<JwtPayload> {
  const sql = getSql()
  try {
    // Try to find existing anonymous user by session_id
    const existing = await sql<{ id: string }[]>`
      SELECT u.id FROM users u
      JOIN demo_usage d ON d.user_id = u.id
      WHERE d.session_id = ${sessionId} AND u.is_anonymous = true
      LIMIT 1
    `
    if (existing.length > 0) {
      const user = existing[0]
      return {
        sub: user.id,
        anon: true,
        exp: Math.floor(Date.now() / 1000) + 86400 * 30,
        iat: Math.floor(Date.now() / 1000),
      }
    }

    // Create new anonymous user
    const result = await sql<{ id: string }[]>`
      INSERT INTO users (is_anonymous)
      VALUES (true)
      RETURNING id
    `
    const userId = result[0].id

    return {
      sub: userId,
      anon: true,
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
      iat: Math.floor(Date.now() / 1000),
    }
  } finally {
    await sql.end()
  }
}

// --- Register ---

export async function registerUser(
  email: string,
  password: string,
): Promise<
  {
    token: string
    user: { id: string; email: string; isAnonymous: boolean; usageCount: number; createdAt: string }
  } | { error: string }
> {
  const sql = getSql()
  try {
    // Check if email already exists
    const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return { error: "Email already registered" }
    }

    const passwordHash = await hashPassword(password)
    const result = await sql<{ id: string; created_at: Date }[]>`
      INSERT INTO users (email, password_hash, is_anonymous)
      VALUES (${email}, ${passwordHash}, false)
      RETURNING id, created_at
    `
    const user = result[0]
    const payload: JwtPayload = {
      sub: user.id,
      email,
      anon: false,
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
      iat: Math.floor(Date.now() / 1000),
    }
    const token = await createToken(payload)
    return {
      token,
      user: {
        id: user.id,
        email,
        isAnonymous: false,
        usageCount: 0,
        createdAt: user.created_at.toISOString(),
      },
    }
  } finally {
    await sql.end()
  }
}

// --- Login ---

export async function loginUser(
  email: string,
  password: string,
): Promise<
  {
    token: string
    user: { id: string; email: string; isAnonymous: boolean; usageCount: number; createdAt: string }
  } | { error: string }
> {
  const sql = getSql()
  try {
    const rows = await sql<
      {
        id: string
        password_hash: string
        is_anonymous: boolean
        usage_count: number
        created_at: Date
      }[]
    >`SELECT id, password_hash, is_anonymous, usage_count, created_at FROM users WHERE email = ${email}`
    if (rows.length === 0) {
      return { error: "Invalid email or password" }
    }
    const user = rows[0]
    if (!user.password_hash) {
      return { error: "Invalid email or password" }
    }
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return { error: "Invalid email or password" }
    }
    const payload: JwtPayload = {
      sub: user.id,
      email,
      anon: user.is_anonymous,
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
      iat: Math.floor(Date.now() / 1000),
    }
    const token = await createToken(payload)
    return {
      token,
      user: {
        id: user.id,
        email,
        isAnonymous: user.is_anonymous,
        usageCount: user.usage_count,
        createdAt: user.created_at.toISOString(),
      },
    }
  } finally {
    await sql.end()
  }
}

// --- Attach password to anonymous user ---

export async function attachPassword(
  userId: string,
  email: string,
  password: string,
): Promise<{ error: string } | { success: true }> {
  const sql = getSql()
  try {
    const existing = await sql<
      { id: string }[]
    >`SELECT id FROM users WHERE email = ${email} AND id != ${userId}`
    if (existing.length > 0) {
      return { error: "Email already in use" }
    }
    const passwordHash = await hashPassword(password)
    await sql`
      UPDATE users SET email = ${email}, password_hash = ${passwordHash}, is_anonymous = false
      WHERE id = ${userId}
    `
    return { success: true }
  } finally {
    await sql.end()
  }
}

// --- Get user ---

export async function getUser(
  userId: string,
): Promise<
  { id: string; email?: string; isAnonymous: boolean; usageCount: number; createdAt: string } | null
> {
  const sql = getSql()
  try {
    const rows = await sql<
      {
        id: string
        email: string | null
        is_anonymous: boolean
        usage_count: number
        created_at: Date
      }[]
    >`SELECT id, email, is_anonymous, usage_count, created_at FROM users WHERE id = ${userId}`
    if (rows.length === 0) return null
    const u = rows[0]
    return {
      id: u.id,
      email: u.email || undefined,
      isAnonymous: u.is_anonymous,
      usageCount: u.usage_count,
      createdAt: u.created_at.toISOString(),
    }
  } finally {
    await sql.end()
  }
}

// --- Check user usage limit ---

export async function checkUserLimit(
  userId: string,
): Promise<{ canProceed: boolean; used: number; limit: number }> {
  const sql = getSql()
  try {
    // Per-user limit
    const userRows = await sql<{ usage_count: number }[]>`
      SELECT usage_count FROM users WHERE id = ${userId}
    `
    if (userRows.length === 0) return { canProceed: false, used: 0, limit: ANONYMOUS_LIMIT }

    const userUsage = userRows[0].usage_count
    const canProceed = userUsage < ANONYMOUS_LIMIT
    return { canProceed, used: userUsage, limit: ANONYMOUS_LIMIT }
  } finally {
    await sql.end()
  }
}

// --- Increment user usage ---

export async function incrementUserUsage(userId: string, count: number): Promise<void> {
  const sql = getSql()
  try {
    await sql`UPDATE users SET usage_count = usage_count + ${count} WHERE id = ${userId}`
  } finally {
    await sql.end()
  }
}

// --- Auth header extraction ---

export function extractToken(
  c: { req: { header: (name: string) => string | undefined } },
): string | null {
  const auth = c.req.header("Authorization")
  if (!auth) return null
  const parts = auth.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null
  return parts[1]
}

export async function authenticateRequest(
  c: { req: { header: (name: string) => string | undefined } },
): Promise<{ user?: JwtPayload; error?: { status: number; body: Record<string, unknown> } }> {
  const token = extractToken(c)
  if (!token) {
    return { error: { status: 401, body: { error: "Authorization header required" } } }
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return { error: { status: 401, body: { error: "Invalid or expired token" } } }
  }
  return { user: payload }
}
