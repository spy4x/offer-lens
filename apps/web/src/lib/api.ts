// OfferLens API client
// Backend runs on same origin in production, proxied in dev

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
  const headers: Record<string, string> = {
    "X-Session-Id": getSessionId(),
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
