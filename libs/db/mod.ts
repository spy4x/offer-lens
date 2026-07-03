// Database layer: Postgres with in-memory fallback for development
import { type DemoUsage, DEMO_LIMIT } from "@offerlens/shared"

export interface DbService {
  getUsage(sessionId: string): Promise<DemoUsage>
  recordUsage(sessionId: string, endpoint: string, count: number): Promise<DemoUsage>
}

// In-memory store for dev without Postgres
class MemoryDbService implements DbService {
  private store = new Map<string, number>()

  async getUsage(sessionId: string): Promise<DemoUsage> {
    const used = this.store.get(sessionId) || 0
    return {
      used,
      limit: DEMO_LIMIT,
      remaining: DEMO_LIMIT - used,
      hasDemoKey: true,
    }
  }

  async recordUsage(sessionId: string, _endpoint: string, count: number): Promise<DemoUsage> {
    const current = this.store.get(sessionId) || 0
    this.store.set(sessionId, current + count)
    const used = current + count
    return {
      used,
      limit: DEMO_LIMIT,
      remaining: DEMO_LIMIT - used,
      hasDemoKey: true,
    }
  }
}

// Postgres-backed service
class PostgresDbService implements DbService {
  private sql: ReturnType<typeof import("postgres").default> | null = null

  private async getClient() {
    if (this.sql) return this.sql

    const postgresMod = await import("postgres")
    const postgres = postgresMod.default

    this.sql = postgres({
      host: Deno.env.get("DB_HOST") || "localhost",
      port: parseInt(Deno.env.get("DB_PORT") || "5432"),
      database: Deno.env.get("DB_NAME") || "offerlens",
      user: Deno.env.get("DB_USER") || "offerlens",
      password: Deno.env.get("DB_PASS") || "offerlens",
      max: 5,
    })
    return this.sql
  }

  async getUsage(sessionId: string): Promise<DemoUsage> {
    try {
      const sql = await this.getClient()
      const rows = await sql<
        { total: number }[]
      >`SELECT COALESCE(SUM(urls_processed), 0) as total FROM demo_usage WHERE session_id = ${sessionId}`
      const used = Number(rows[0]?.total || 0)
      return {
        used,
        limit: DEMO_LIMIT,
        remaining: DEMO_LIMIT - used,
        hasDemoKey: true,
      }
    } catch {
      // Fallback to memory if DB is not available
      return { used: 0, limit: DEMO_LIMIT, remaining: DEMO_LIMIT, hasDemoKey: true }
    }
  }

  async recordUsage(sessionId: string, endpoint: string, count: number): Promise<DemoUsage> {
    try {
      const sql = await this.getClient()
      await sql`
        INSERT INTO demo_usage (session_id, endpoint, urls_processed)
        VALUES (${sessionId}, ${endpoint}, ${count})
      `
      return this.getUsage(sessionId)
    } catch {
      // Fallback
      return { used: 0, limit: DEMO_LIMIT, remaining: DEMO_LIMIT, hasDemoKey: true }
    }
  }
}

// Factory: returns the appropriate DB service
export function createDbService(): DbService {
  const dbUrl = Deno.env.get("DATABASE_URL")
  const dbHost = Deno.env.get("DB_HOST")

  if (dbUrl || dbHost) {
    return new PostgresDbService()
  }

  return new MemoryDbService()
}

// Singleton
let _db: DbService | null = null
export function getDb(): DbService {
  if (!_db) _db = createDbService()
  return _db
}
