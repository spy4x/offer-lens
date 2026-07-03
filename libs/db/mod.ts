// Database layer — Postgres singleton with domain service
// Reference pattern: ~/sync/code/financy/libs/server/db/+index.ts
import postgres from "postgres"
import type { LandingPageAnalysis } from "@offerlens/shared"

export type Transaction = postgres.TransactionSql
type Sql = postgres.Sql

// --- Singleton connection ---

function buildSql(): Sql | null {
  const url = Deno.env.get("DATABASE_URL")
  if (url) {
    return postgres(url, {
      max: 10,
      connection: { application_name: "offerlens" },
    })
  }

  const host = Deno.env.get("DB_HOST")
  if (!host) return null

  return postgres({
    host,
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    database: Deno.env.get("DB_NAME") || "offerlens",
    user: Deno.env.get("DB_USER") || "offerlens",
    password: Deno.env.get("DB_PASS"),
    max: 10,
    connection: { application_name: "offerlens" },
  })
}

export const sql = buildSql()

// --- Base class with transaction support ---

export class DbServiceBase {
  protected db: Sql | Transaction

  constructor() {
    if (!sql) throw new Error("DB not configured (set DB_HOST or DATABASE_URL)")
    this.db = sql
  }

  protected setDb(s: Sql | Transaction): void {
    this.db = s
  }

  async begin<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    return (this.db as Sql).begin((transaction: Transaction) => {
      const service = Object.create(this) as this
      service.setDb(transaction)
      return fn(service)
    }) as Promise<T>
  }

  async connect(): Promise<void> {
    await this.db`SELECT 1`
  }

  async shutdown(): Promise<void> {
    await (this.db as Sql).end({ timeout: 5 })
  }
}

// --- Domain service ---

class DbService extends DbServiceBase {
  // ── User ops ──

  async findOrCreateAnonymousUser(sessionId: string): Promise<{ id: string }> {
    const existing = await this.db<{ id: string }[]>`
      SELECT u.id FROM users u
      JOIN demo_usage d ON d.user_id = u.id
      WHERE d.session_id = ${sessionId} AND u.is_anonymous = true
      LIMIT 1
    `
    if (existing.length > 0) return existing[0]

    const [user] = await this.db<{ id: string }[]>`
      INSERT INTO users (is_anonymous) VALUES (true) RETURNING id
    `
    return user
  }

  async getUserByEmail(email: string) {
    const rows = await this.db<
      {
        id: string
        password_hash: string | null
        is_anonymous: boolean
        usage_count: number
        created_at: Date
      }[]
    >`SELECT id, password_hash, is_anonymous, usage_count, created_at FROM users WHERE email = ${email}`
    return rows[0] || null
  }

  async getUserById(id: string) {
    const rows = await this.db<
      {
        id: string
        email: string | null
        is_anonymous: boolean
        usage_count: number
        created_at: Date
      }[]
    >`SELECT id, email, is_anonymous, usage_count, created_at FROM users WHERE id = ${id}`
    return rows[0] || null
  }

  async emailTakenByOther(email: string, excludeUserId: string): Promise<boolean> {
    const rows = await this.db<
      { id: string }[]
    >`SELECT id FROM users WHERE email = ${email} AND id != ${excludeUserId}`
    return rows.length > 0
  }

  async createUser(
    email: string,
    passwordHash: string,
  ): Promise<{ id: string; created_at: Date }> {
    const [user] = await this.db<{ id: string; created_at: Date }[]>`
      INSERT INTO users (email, password_hash, is_anonymous)
      VALUES (${email}, ${passwordHash}, false)
      RETURNING id, created_at
    `
    return user
  }

  async attachPassword(userId: string, email: string, passwordHash: string): Promise<void> {
    await this.db`
      UPDATE users SET email = ${email}, password_hash = ${passwordHash}, is_anonymous = false
      WHERE id = ${userId}
    `
  }

  async getUserUsage(userId: string): Promise<number> {
    const [row] = await this.db<
      { usage_count: number }[]
    >`SELECT usage_count FROM users WHERE id = ${userId}`
    return row?.usage_count ?? 0
  }

  async incrementUsage(userId: string, count: number): Promise<void> {
    await this.db`UPDATE users SET usage_count = usage_count + ${count} WHERE id = ${userId}`
  }

  // ── Analysis ops ──

  async storeAnalysis(
    sessionId: string,
    userId: string | null,
    url: string,
    analysis: LandingPageAnalysis,
    tokens?: { prompt: number; completion: number; total: number },
  ): Promise<{ id: number }> {
    const [row] = await this.db<{ id: number }[]>`
      INSERT INTO analyses (session_id, user_id, url, analysis, tokens_prompt, tokens_completion, tokens_total)
      VALUES (${sessionId || ""}, ${userId}, ${url}, ${JSON.stringify(analysis)}, ${
      tokens?.prompt ?? 0
    }, ${tokens?.completion ?? 0}, ${tokens?.total ?? 0})
      RETURNING id
    `
    return row
  }

  async getAnalysisById(id: number): Promise<
    {
      id: number
      session_id: string
      user_id: string | null
      url: string
      analysis: LandingPageAnalysis
      tokens_prompt: number
      tokens_completion: number
      tokens_total: number
      created_at: Date
    } | null
  > {
    const rows = await this.db<
      {
        id: number
        session_id: string
        user_id: string | null
        url: string
        analysis: LandingPageAnalysis
        tokens_prompt: number
        tokens_completion: number
        tokens_total: number
        created_at: Date
      }[]
    >`SELECT id, session_id, user_id, url, analysis, tokens_prompt, tokens_completion, tokens_total, created_at FROM analyses WHERE id = ${id}`
    return rows[0] || null
  }

  async linkSessionAnalyses(sessionId: string, userId: string): Promise<void> {
    await this.db`
      UPDATE analyses SET user_id = ${userId}
      WHERE session_id = ${sessionId} AND (user_id IS NULL OR user_id = '')
    `
  }

  async getHistory(
    userId: string,
    limit = 100,
  ): Promise<
    Array<{ id: number; url: string; created_at: Date; analysis: Record<string, unknown> }>
  > {
    return this.db<
      { id: number; url: string; created_at: Date; analysis: Record<string, unknown> }[]
    >`
      SELECT id, url, created_at, analysis
      FROM analyses
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  }

  // ── Demo usage ops ──

  async getSessionUsage(sessionId: string): Promise<number> {
    const [row] = await this.db<{ total: number }[]>`
      SELECT COALESCE(SUM(urls_processed), 0) as total FROM demo_usage WHERE session_id = ${sessionId}
    `
    return Number(row?.total ?? 0)
  }

  async recordSessionUsage(sessionId: string, endpoint: string, count: number): Promise<void> {
    await this.db`
      INSERT INTO demo_usage (session_id, endpoint, urls_processed)
      VALUES (${sessionId}, ${endpoint}, ${count})
    `
  }

  // ── User API keys ops ──

  async saveApiKey(
    userId: string,
    provider: string,
    keyEncrypted: string,
    keyHint: string,
    baseUrl = "",
    model = "",
  ): Promise<void> {
    await this.db`
      INSERT INTO user_api_keys (user_id, provider, key_encrypted, key_hint, base_url, model)
      VALUES (${userId}, ${provider}, ${keyEncrypted}, ${keyHint}, ${baseUrl}, ${model})
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        key_encrypted = EXCLUDED.key_encrypted,
        key_hint = EXCLUDED.key_hint,
        base_url = EXCLUDED.base_url,
        model = EXCLUDED.model,
        is_active = true,
        updated_at = NOW()
    `
  }

  async getApiKeys(userId: string): Promise<
    Array<{
      id: number
      provider: string
      base_url: string
      model: string
      key_hint: string
      is_active: boolean
      created_at: Date
    }>
  > {
    return this.db`
      SELECT id, provider, base_url, model, key_hint, is_active, created_at
      FROM user_api_keys
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
  }

  async getApiKeyEncrypted(
    userId: string,
    provider: string,
  ): Promise<{ key_encrypted: string; base_url: string; model: string } | null> {
    const rows = await this.db<
      { key_encrypted: string; base_url: string; model: string }[]
    >`
      SELECT key_encrypted, base_url, model
      FROM user_api_keys
      WHERE user_id = ${userId} AND provider = ${provider} AND is_active = true
      LIMIT 1
    `
    return rows[0] || null
  }

  async deleteApiKey(userId: string, provider: string): Promise<void> {
    await this.db`
      DELETE FROM user_api_keys
      WHERE user_id = ${userId} AND provider = ${provider}
    `
  }

  async getActiveApiProviders(userId: string): Promise<string[]> {
    const rows = await this.db<{ provider: string }[]>`
      SELECT provider FROM user_api_keys
      WHERE user_id = ${userId} AND is_active = true
    `
    return rows.map((r: { provider: string }) => r.provider)
  }
}

// Singleton
let _db: DbService | null = null

export function getDb(): DbService {
  if (!_db) _db = new DbService()
  return _db
}
