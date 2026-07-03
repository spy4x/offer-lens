// Demo usage tracking service — supports both session-based (legacy) and user-based auth
import { DEMO_LIMIT, type DemoUsage } from "@offerlens/shared"
import { getDb } from "@offerlens/db"
import { Config } from "./config.ts"
import { checkUserLimit, incrementUserUsage } from "./auth.ts"

/**
 * Check if user can use the demo key.
 * - If user provides their own API key, skip tracking entirely.
 * - If authenticated (userId), apply per-user limit.
 * - If anonymous (sessionId), apply session-based limit (legacy).
 */
export async function checkDemoUsage(
  sessionId: string,
  userApiKey?: string,
  userId?: string,
): Promise<{ canProceed: boolean; usage: DemoUsage }> {
  // If user provides their own API key, skip demo tracking
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
      usage: { used: 0, limit: 0, remaining: 0, hasDemoKey: false },
    }
  }

  // If user is authenticated, use per-user limit
  if (userId) {
    const { canProceed, used, limit } = await checkUserLimit(userId)
    return {
      canProceed,
      usage: {
        used,
        limit,
        remaining: limit - used,
        hasDemoKey: true,
      },
    }
  }

  // Legacy: session-based tracking
  const db = getDb()
  const used = await db.getSessionUsage(sessionId)
  const remaining = Math.max(0, DEMO_LIMIT - used)
  const usage: DemoUsage = { used, limit: DEMO_LIMIT, remaining, hasDemoKey: true }

  return {
    canProceed: remaining > 0,
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
  userId?: string,
): Promise<DemoUsage> {
  if (userId) {
    await incrementUserUsage(userId, count)
    const { used, limit } = await checkUserLimit(userId)
    return { used, limit, remaining: limit - used, hasDemoKey: true }
  }

  // Legacy: session-based
  const db = getDb()
  await db.recordSessionUsage(sessionId, endpoint, count)
  const used = await db.getSessionUsage(sessionId)
  return { used, limit: DEMO_LIMIT, remaining: Math.max(0, DEMO_LIMIT - used), hasDemoKey: true }
}

/**
 * Get current demo usage.
 */
export async function getDemoUsage(sessionId: string, userId?: string): Promise<DemoUsage> {
  if (userId) {
    const { used, limit } = await checkUserLimit(userId)
    return { used, limit, remaining: limit - used, hasDemoKey: true }
  }

  const db = getDb()
  const used = await db.getSessionUsage(sessionId)
  return { used, limit: DEMO_LIMIT, remaining: Math.max(0, DEMO_LIMIT - used), hasDemoKey: true }
}
