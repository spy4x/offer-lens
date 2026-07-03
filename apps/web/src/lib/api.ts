// OfferLens API client
// Backend runs on same origin in production, proxied in dev

import { authToken } from "./state.ts"

interface DemoUsage {
  used: number
  limit: number
  remaining: number
  hasDemoKey: boolean
}

interface AnalyzeResponse {
  analysis: LandingPageAnalysis
  demoUsage?: DemoUsage
}

interface BatchResponse {
  results: BatchResult[]
  errors: { url: string; error: string }[]
  demoUsage?: DemoUsage
}

interface BatchResult {
  url: string
  analysis?: LandingPageAnalysis
  error?: string
}

// Replicated from shared types for SPA self-containment
export interface LandingPageAnalysis {
  primaryAngle: { type: string; explanation: string; confidence: number }
  hookIdeas: string[]
  targetAudience: {
    demographics: string
    interests: string
    likelyPlatform: string
    confidenceNotes: string
  }
  adCopy: {
    facebook: AdVariant[]
    google: AdVariant[]
    native: NativeAdVariant[]
  }
  emailAngle: {
    subjectLines: string[]
    bodyAngle: string
    smsAngle: string
  }
  trustSignals: TrustSignal[]
  conversionBlockers: Blocker[]
  abTestIdeas: string[]
  competitiveIntel: {
    likelyTrafficSources: string[]
    estimatedDailySpend: string
    whatCompetitorsAreLikelyTesting: string
  }
  competitorAngles: string[]
}

export interface AdVariant {
  headline: string
  primaryText: string
  cta: string
}

export interface NativeAdVariant {
  headline: string
  body: string
  cta: string
}

export interface TrustSignal {
  type: string
  present: boolean
  strength: "strong" | "medium" | "weak"
  detail: string
}

export interface Blocker {
  issue: string
  severity: "high" | "medium" | "low"
  suggestion: string
}

function getSessionId(): string {
  let id = localStorage.getItem("ol_session")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("ol_session", id)
  }
  return id
}

function getApiKey(): string {
  try {
    return localStorage.getItem("ol_apiKey") || ""
  } catch {
    return ""
  }
}

async function apiFetch<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}

  // Auth: prefer Bearer token, fall back to session
  const token = authToken.value
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  } else {
    headers["X-Session-Id"] = getSessionId()
  }

  const opts: RequestInit = { headers }
  if (body) {
    headers["Content-Type"] = "application/json"
    opts.method = "POST"
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// --- Public API ---

export function fetchUsage(): Promise<DemoUsage> {
  return apiFetch<DemoUsage>("/api/usage")
}

export function analyzeSingle(url: string): Promise<AnalyzeResponse> {
  const body: Record<string, string> = { url }
  const apiKey = getApiKey()
  if (apiKey) body.apiKey = apiKey
  return apiFetch<AnalyzeResponse>("/api/analyze", body)
}

export function analyzeBatch(urls: string[]): Promise<BatchResponse> {
  const body: Record<string, string[] | string> = { urls }
  const apiKey = getApiKey()
  if (apiKey) body.apiKey = apiKey
  return apiFetch<BatchResponse>("/api/batch", body)
}

// --- Auth API ---

export interface AuthUser {
  id: string
  email?: string
  isAnonymous: boolean
  usageCount: number
  createdAt: string
}

export async function register(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  return apiFetch("/api/auth/register", { email, password })
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  return apiFetch("/api/auth/login", { email, password })
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  return apiFetch("/api/auth/me")
}

export async function attachPassword(
  email: string,
  password: string,
): Promise<{ success: boolean }> {
  return apiFetch("/api/auth/attach", { email, password })
}

export interface AnalysisSummary {
  id: number
  url: string
  createdAt: string
  primaryAngle: string | null
}

export async function fetchHistory(): Promise<{ analyses: AnalysisSummary[] }> {
  return apiFetch("/api/analyses")
}

// --- BYOK API ---

export interface SavedKey {
  id: number
  provider: string
  baseUrl: string
  model: string
  keyHint: string
  isActive: boolean
  createdAt: string
}

export interface SaveKeyRequest {
  provider: string
  apiKey: string
  baseUrl?: string
  model?: string
}

export interface TestKeyResult {
  success: boolean
  model?: string
  error?: string
}

export async function fetchKeys(): Promise<{ keys: SavedKey[] }> {
  return apiFetch("/api/keys")
}

export async function saveKey(
  req: SaveKeyRequest,
): Promise<{ success: boolean; provider: string; keyHint: string }> {
  return apiFetch("/api/keys", req)
}

export async function deleteKey(provider: string): Promise<{ success: boolean }> {
  const headers: Record<string, string> = {}
  const token = authToken.value
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`/api/keys/${encodeURIComponent(provider)}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function testKey(provider: string): Promise<TestKeyResult> {
  return apiFetch(`/api/keys/test?provider=${encodeURIComponent(provider)}`)
}
