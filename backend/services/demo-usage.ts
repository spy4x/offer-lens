// Demo usage tracking service
import { type DemoUsage, DEMO_LIMIT } from "@offerlens/shared"
import { getDb } from "@offerlens/db"
import { Config } from "./config.ts"

/**
 * Check if user can use the demo key. If they provide their own key, skip tracking.
 */
export async function checkDemoUsage(
  sessionId: string,
  userApiKey?: string,
): Promise<{ canProceed: boolean; usage: DemoUsage }> {
  // If user provides their own API key, skip demo tracking entirely
  if (userApiKey) {
    return {
      canProceed: true,
      usage: { used: 0, limit: DEMO_LIMIT, remaining: DEMO_LIMIT, hasDemoKey: false },
    }
  }

  // Check if demo key is configured
  if (!Config.demoApiKey) {
    return {
      canProceed: false,
      usage: {
        used: 0,
        limit: 0,
        remaining: 0,
        hasDemoKey: false,
      },
    }
  }

  const db = getDb()
  const usage = await db.getUsage(sessionId)

  return {
    canProceed: usage.remaining > 0,
    usage,
  }
}

/**
 * Record demo usage after successful analysis.
 */
export async function recordDemoUsage(
  sessionId: string,
  endpoint: string,
  count: number,
): Promise<DemoUsage> {
  const db = getDb()
  return db.recordUsage(sessionId, endpoint, count)
}

/**
 * Get current demo usage for a session.
 */
export async function getDemoUsage(sessionId: string): Promise<DemoUsage> {
  const db = getDb()
  return db.getUsage(sessionId)
}
