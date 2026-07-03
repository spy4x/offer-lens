// OfferLens shared types and constants
// All interfaces kept in sync with PRD spec

export interface LandingPageAnalysis {
  primaryAngle: {
    type: AngleType
    confidence: number // 0-100
    explanation: string // max 200 chars
  }
  hookIdeas: string[] // exactly 5, max 100 chars each
  targetAudience: {
    demographics: string // max 150 chars
    interests: string // max 150 chars
    likelyPlatform: Platform
    confidenceNotes: string // max 100 chars
  }
  adCopy: {
    facebook: AdVariant[] // exactly 3
    google: AdVariant[] // exactly 3
    native: NativeAdVariant[] // exactly 3
  }
  emailAngle: {
    subjectLines: string[] // exactly 3
    bodyAngle: string // max 300 chars
    smsAngle: string // 140-char SMS pitch
  }
  trustSignals: TrustSignal[]
  conversionBlockers: Blocker[]
  abTestIdeas: string[] // exactly 3, max 200 chars each
  competitiveIntel: {
    likelyTrafficSources: string[]
    estimatedDailySpend: SpendTier
    whatCompetitorsAreLikelyTesting: string // max 200 chars
  }
  competitorAngles: string[] // max 5, max 150 chars each
}

export type AngleType =
  | "scarcity"
  | "authority"
  | "social_proof"
  | "pain_relief"
  | "curiosity"
  | "urgency"
  | "transformation"
  | "fear_of_missing_out"

export type Platform = "facebook" | "google" | "native" | "tiktok" | "youtube" | "all"

export type SpendTier = "low" | "medium" | "high"

export interface AdVariant {
  headline: string // max 100 chars
  primaryText: string // max 500 chars
  cta: string // max 30 chars
}

export interface NativeAdVariant {
  headline: string // max 100 chars
  body: string // max 300 chars
  cta: string // max 30 chars
}

export interface TrustSignal {
  type: TrustSignalType
  strength: "weak" | "medium" | "strong"
  present: boolean
  detail: string // max 150 chars
}

export type TrustSignalType =
  | "testimonial"
  | "guarantee"
  | "certification"
  | "badge"
  | "social_proof_count"
  | "media_mention"
  | "expert_endorsement"
  | "before_after"

export interface Blocker {
  issue: string // max 200 chars
  severity: "high" | "medium" | "low"
  suggestion: string // max 200 chars
}

export interface PageContent {
  url: string
  title: string
  metaDescription: string
  headlines: string[]
  ctas: string[]
  bodyText: string
  testimonials: string[]
  pricing: string | null
  ogTags: Record<string, string>
  structuredData: string | null
}

export interface BatchResult {
  url: string
  analysis?: LandingPageAnalysis
  error?: string
}

export interface DemoUsage {
  used: number
  limit: number
  remaining: number
  hasDemoKey: boolean
}

// API request/response types

export interface AnalyzeRequest {
  url: string
  apiKey?: string
}

export interface AnalyzeResponse {
  analysis: LandingPageAnalysis
  demoUsage?: DemoUsage
}

export interface BatchRequest {
  urls: string[] // max 50
  apiKey?: string
}

export interface BatchResponse {
  results: BatchResult[]
  errors: Array<{ url: string; error: string }>
  demoUsage?: DemoUsage
}

export interface ErrorResponse {
  error: string
  used?: number
  limit?: number
}

// Constants

export const DEMO_LIMIT = 50
export const MAX_BATCH_URLS = 50
export const DEFAULT_BATCH_CONCURRENCY = 5
export const FETCH_TIMEOUT_MS = 10_000
export const BODY_TEXT_MAX_CHARS = 8_000

export const ANGLE_TYPES: AngleType[] = [
  "scarcity",
  "authority",
  "social_proof",
  "pain_relief",
  "curiosity",
  "urgency",
  "transformation",
  "fear_of_missing_out",
]

export const TRUST_SIGNAL_TYPES: TrustSignalType[] = [
  "testimonial",
  "guarantee",
  "certification",
  "badge",
  "social_proof_count",
  "media_mention",
  "expert_endorsement",
  "before_after",
]

export const PLATFORMS: Platform[] = ["facebook", "google", "native", "tiktok", "youtube", "all"]

export const SPEND_TIERS: SpendTier[] = ["low", "medium", "high"]
