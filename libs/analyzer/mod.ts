// Analyzer: core analysis logic — scrape → prompt → LLM → structured output
import type { LandingPageAnalysis } from "@offerlens/shared"
import { scrapePage } from "@offerlens/scraper"
import { ANALYSIS_JSON_SCHEMA, buildUserPrompt, SYSTEM_PROMPT } from "@offerlens/prompts"

const DEFAULT_API_BASE = "https://api.deepseek.com"
const DEFAULT_MODEL = "deepseek-chat"

export interface AnalyzeOptions {
  apiKey?: string
  model?: string
  apiBase?: string
  maxRetries?: number
  customSections?: Array<{ title: string; prompt: string }>
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface AnalyzeResult {
  analysis: LandingPageAnalysis
  usage: TokenUsage
}

/**
 * Analyze a landing page: scrape → build prompt → call LLM → return structured analysis + token usage.
 */
export async function analyzeLandingPage(
  url: string,
  options: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const apiKey = options.apiKey || Deno.env.get("DEMO_OPENAI_API_KEY") ||
    Deno.env.get("OPENAI_API_KEY") ||
    Deno.env.get("DEEPSEEK_API_KEY")

  if (!apiKey) {
    throw new Error("No API key available. Provide apiKey option or set DEMO_OPENAI_API_KEY env.")
  }

  const model = options.model || DEFAULT_MODEL
  const apiBase = options.apiBase || Deno.env.get("OPENAI_API_BASE") || DEFAULT_API_BASE
  const maxRetries = options.maxRetries ?? 2

  // Step 1: Scrape the page
  const pageContent = await scrapePage(url)

  // Step 2: Build prompt with optional custom sections
  const userPrompt = buildUserPrompt(pageContent, options.customSections)

  // Step 3: Call LLM with retries
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await callLLM(apiKey, apiBase, model, userPrompt)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000))
      }
    }
  }

  throw lastError || new Error("LLM call failed after retries")
}

async function callLLM(
  apiKey: string,
  apiBase: string,
  model: string,
  userPrompt: string,
): Promise<{ analysis: LandingPageAnalysis; usage: TokenUsage }> {
  const endpoint = `${apiBase}/v1/chat/completions`

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    response_format: {
      type: "json_object",
    },
  }

  // Only add json_schema for providers that support it (OpenAI)
  // DeepSeek supports json_object mode which is sufficient
  if (apiBase.includes("api.openai.com") || apiBase.includes("openai")) {
    body.response_format = {
      type: "json_schema" as const,
      json_schema: ANALYSIS_JSON_SCHEMA,
    }
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMsg = `LLM API error ${response.status}`
    try {
      const errJson = JSON.parse(errorText)
      errorMsg = errJson.error?.message || errJson.message || errorMsg
    } catch {
      errorMsg = `${errorMsg}: ${errorText.slice(0, 200)}`
    }
    throw new Error(errorMsg)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("LLM returned empty response")
  }

  // Parse JSON from response
  let parsed: LandingPageAnalysis
  try {
    parsed = JSON.parse(content)
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1])
    } else {
      throw new Error(`Failed to parse LLM response as JSON. Raw: ${content.slice(0, 500)}`)
    }
  }

  // Normalize: map snake_case fields to camelCase if needed
  const normalized = normalizeAnalysis(parsed as unknown as Record<string, unknown>)

  // Validate required fields exist
  validateAnalysis(normalized)

  // Capture token usage from API response
  const usage: TokenUsage = {
    promptTokens: data.usage?.prompt_tokens ?? data.usage?.promptTokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? data.usage?.completionTokens ?? 0,
    totalTokens: data.usage?.total_tokens ?? data.usage?.totalTokens ?? 0,
  }

  return { analysis: normalized, usage }
}

function validateAnalysis(a: LandingPageAnalysis): void {
  const raw = a as unknown as Record<string, unknown>

  const pa = raw.primaryAngle as Record<string, unknown> | undefined
  if (!pa?.type || typeof pa.confidence !== "number") {
    throw new Error("Missing primaryAngle")
  }
  if (!Array.isArray(raw.hookIdeas) || (raw.hookIdeas as unknown[]).length === 0) {
    throw new Error("Missing hookIdeas")
  }
  const ta = raw.targetAudience as Record<string, unknown> | undefined
  if (!ta?.demographics) {
    throw new Error("Missing targetAudience")
  }
  const ac = raw.adCopy as Record<string, unknown> | undefined
  const fb = ac?.facebook as unknown[] | undefined
  const gg = ac?.google as unknown[] | undefined
  const nt = ac?.native as unknown[] | undefined
  if (!fb?.length || !gg?.length || !nt?.length) {
    throw new Error("Missing adCopy variants")
  }
  const ea = raw.emailAngle as Record<string, unknown> | undefined
  if (!Array.isArray(ea?.subjectLines) || ea.subjectLines.length === 0) {
    throw new Error("Missing emailAngle")
  }
  if (!Array.isArray(raw.trustSignals) || raw.trustSignals.length === 0) {
    throw new Error("Missing trustSignals")
  }
  if (!Array.isArray(raw.competitorAngles)) {
    raw.competitorAngles = []
  }
  // customSections is optional — ignore if missing
}

// Map LLM snake_case fields to camelCase (fallback for models that don't follow field name instructions)
function normalizeAnalysis(raw: Record<string, unknown>): LandingPageAnalysis {
  // If it already has camelCase primary key, return as-is
  if (raw.primaryAngle) return raw as unknown as LandingPageAnalysis

  // Snake_case → camelCase mapping
  const snToCc: Record<string, string> = {
    primary_angle: "primaryAngle",
    hook_ideas: "hookIdeas",
    target_audience: "targetAudience",
    ad_copy: "adCopy",
    email_angle: "emailAngle",
    email_sms: "emailAngle",
    trust_signals: "trustSignals",
    conversion_blockers: "conversionBlockers",
    ab_test_ideas: "abTestIdeas",
    competitive_intel: "competitiveIntel",
    competitive_intelligence: "competitiveIntel",
    competitor_angles: "competitorAngles",
    competitor_counter_angles: "competitorAngles",
    likely_platform: "likelyPlatform",
    confidence_notes: "confidenceNotes",
    subject_lines: "subjectLines",
    body_angle: "bodyAngle",
    sms_angle: "smsAngle",
    primary_text: "primaryText",
    social_proof_count: "social_proof_count",
    media_mention: "media_mention",
    expert_endorsement: "expert_endorsement",
    before_after: "before_after",
    likely_traffic_sources: "likelyTrafficSources",
    estimated_daily_spend: "estimatedDailySpend",
    what_competitors_are_likely_testing: "whatCompetitorsAreLikelyTesting",
  }

  function mapKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(mapKeys)
    if (obj === null || typeof obj !== "object") return obj
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const mappedKey = snToCc[key] || key
      result[mappedKey] = mapKeys(value)
    }
    return result
  }

  const mapped = mapKeys(raw) as unknown as LandingPageAnalysis
  return mapped
}
