// Auth service — uses DbService for DB ops
import { ANONYMOUS_LIMIT } from "@offerlens/shared"
import { getDb } from "@offerlens/db"
import {
  createToken,
  hashPassword,
  type JwtPayload,
  verifyPassword,
  verifyToken,
} from "@offerlens/auth"

// ── Anonymous user ──

export async function createAnonymousUser(sessionId: string): Promise<JwtPayload> {
  const db = getDb()
  const user = await db.findOrCreateAnonymousUser(sessionId)

  return {
    sub: user.id,
    anon: true,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    iat: Math.floor(Date.now() / 1000),
  }
}

// ── Register ──

export async function registerUser(
  email: string,
  password: string,
): Promise<
  {
    token: string
    user: { id: string; email: string; isAnonymous: boolean; usageCount: number; createdAt: string }
  } | { error: string }
> {
  const db = getDb()

  const existing = await db.getUserByEmail(email)
  if (existing) return { error: "Email already registered" }

  const passwordHash = await hashPassword(password)
  const user = await db.createUser(email, passwordHash)

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
}

// ── Login ──

export async function loginUser(
  email: string,
  password: string,
): Promise<
  {
    token: string
    user: { id: string; email: string; isAnonymous: boolean; usageCount: number; createdAt: string }
  } | { error: string }
> {
  const db = getDb()
  const row = await db.getUserByEmail(email)

  if (!row || !row.password_hash) return { error: "Invalid email or password" }

  const valid = await verifyPassword(password, row.password_hash)
  if (!valid) return { error: "Invalid email or password" }

  const payload: JwtPayload = {
    sub: row.id,
    email,
    anon: row.is_anonymous,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    iat: Math.floor(Date.now() / 1000),
  }
  const token = await createToken(payload)

  return {
    token,
    user: {
      id: row.id,
      email,
      isAnonymous: row.is_anonymous,
      usageCount: row.usage_count,
      createdAt: row.created_at.toISOString(),
    },
  }
}

// ── Attach password to anonymous user ──

export async function attachPassword(
  userId: string,
  email: string,
  password: string,
): Promise<{ error: string } | { success: true }> {
  const db = getDb()

  const taken = await db.emailTakenByOther(email, userId)
  if (taken) return { error: "Email already in use" }

  const passwordHash = await hashPassword(password)
  await db.attachPassword(userId, email, passwordHash)

  return { success: true }
}

// ── Get user ──

export async function getUser(
  userId: string,
): Promise<
  { id: string; email?: string; isAnonymous: boolean; usageCount: number; createdAt: string } | null
> {
  const db = getDb()
  const u = await db.getUserById(userId)
  if (!u) return null

  return {
    id: u.id,
    email: u.email || undefined,
    isAnonymous: u.is_anonymous,
    usageCount: u.usage_count,
    createdAt: u.created_at.toISOString(),
  }
}

// ── Check user usage limit ──

export async function checkUserLimit(
  userId: string,
): Promise<{ canProceed: boolean; used: number; limit: number }> {
  const db = getDb()
  const used = await db.getUserUsage(userId)
  const canProceed = used < ANONYMOUS_LIMIT
  return { canProceed, used, limit: ANONYMOUS_LIMIT }
}

// ── Increment user usage ──

export async function incrementUserUsage(userId: string, count: number): Promise<void> {
  const db = getDb()
  await db.incrementUsage(userId, count)
}

// ── Auth header extraction ──

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
