// Auth: JWT + password hashing — zero third-party deps
// Uses Deno Web Crypto API (SubtleCrypto)

const JWT_ALG = "HS256"
const JWT_SECRET_ENV = "JWT_SECRET"
const ITERATIONS = 100_000
const KEY_LEN = 32
const SALT_LEN = 16

function getJwtSecret(): string {
  return Deno.env.get(JWT_SECRET_ENV) ||
    Deno.env.get("DEMO_OPENAI_API_KEY") ||
    "offerlens-dev-secret-change-in-production"
}

// --- Password hashing (PBKDF2) ---

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_LEN * 8,
  )
  // Format: salt_hex:hash_hex
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  )
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":")
  if (parts.length !== 2) return false
  const [saltHex, hashHex] = parts
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_LEN * 8,
  )
  const computedHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return computedHex === hashHex
}

// --- JWT ---

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) str += "="
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
}

async function createSignature(payload: string): Promise<string> {
  const secret = getJwtSecret()
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return base64UrlEncode(new Uint8Array(sig))
}

export interface JwtPayload {
  sub: string // user id
  email?: string
  anon: boolean
  exp: number // expiry timestamp
  iat: number
}

export async function createToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const full: JwtPayload = { ...payload, iat: now, exp: now + 86400 * 30 } // 30 days
  const header = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ alg: JWT_ALG, typ: "JWT" })),
  )
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(full)))
  const signature = await createSignature(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [headerB64, bodyB64, sigB64] = parts
    const expectedSig = await createSignature(`${headerB64}.${bodyB64}`)
    if (sigB64 !== expectedSig) return null
    const payload: JwtPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(bodyB64)))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
