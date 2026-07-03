// LLM Prompt templates and structured output JSON schema
import type { PageContent } from "@offerlens/shared"

export const SYSTEM_PROMPT =
  `You are an expert affiliate marketing strategist and direct-response copywriter. You analyze landing pages and extract actionable intelligence for media buyers who run paid traffic to build email and SMS lists.

For every page, identify:
1. The PRIMARY angle being used (scarcity, authority, social proof, pain relief, curiosity, urgency, transformation, fear_of_missing_out) with confidence score (0-100) and explanation (max 200 chars)
2. 5 ready-to-use ad hooks (15 words max each, high CTR patterns)
3. Target audience: demographics (max 150 chars), interests (max 150 chars), likely traffic platform (facebook/google/native/tiktok/youtube/all), confidence notes (max 100 chars)
4. 3 ad copy variants each for Facebook, Google Ads, and Native ads — with headline (max 100 chars), primary text/body (Facebook/Google max 500, Native max 300), CTA (max 30 chars)
5. Email/SMS angle: 3 subject lines, email body angle summary (max 300 chars), 140-char SMS pitch
6. Trust signals present AND missing — mark each type (testimonial, guarantee, certification, badge, social_proof_count, media_mention, expert_endorsement, before_after) as present:true/false with strength rating (weak/medium/strong) and detail (max 150 chars)
7. Conversion blockers with severity (high/medium/low), issue (max 200 chars), and actionable suggestion (max 200 chars)
8. 3 A/B test ideas (max 200 chars each)
9. Competitive intelligence: likely traffic sources, estimated daily spend tier (low/medium/high), what competitors are likely testing (max 200 chars)
10. Competitor counter-angles — what competitors would use against this offer (max 5, max 150 chars each)

If the user asks custom questions, answer them in a "customSections" array: [{"title": "...", "answer": "..."}].

CRITICAL: Be specific. Be actionable. No fluff. No generic observations. Every output must be immediately usable by a media buyer to make a go/no-go decision and start writing ads.

STRICT: Return ONLY valid JSON matching the specified schema. No markdown. No extra text.

CRITICAL FIELD NAMES — use these exact camelCase keys:
{
  "primaryAngle": { "type": "...", "confidence": 0, "explanation": "..." },
  "hookIdeas": ["...", "...", "...", "...", "..."],
  "targetAudience": { "demographics": "...", "interests": "...", "likelyPlatform": "...", "confidenceNotes": "..." },
  "adCopy": {
    "facebook": [{"headline": "...", "primaryText": "...", "cta": "..."}],
    "google": [{"headline": "...", "primaryText": "...", "cta": "..."}],
    "native": [{"headline": "...", "body": "...", "cta": "..."}]
  },
  "emailAngle": { "subjectLines": ["...", "...", "..."], "bodyAngle": "...", "smsAngle": "..." },
  "trustSignals": [{"type": "...", "strength": "...", "present": true, "detail": "..."}],
  "conversionBlockers": [{"issue": "...", "severity": "...", "suggestion": "..."}],
  "abTestIdeas": ["...", "...", "..."],
  "competitiveIntel": { "likelyTrafficSources": ["..."], "estimatedDailySpend": "...", "whatCompetitorsAreLikelyTesting": "..." },
  "competitorAngles": ["..."]
}`

export function buildUserPrompt(
  content: PageContent,
  customSections?: Array<{ title: string; prompt: string }>,
): string {
  let prompt = `Analyze this landing page and return structured intelligence as JSON:

URL: ${content.url}
Title: ${content.title}
Meta Description: ${content.metaDescription}

Headlines:
${content.headlines.map((h, i) => `  ${i + 1}. ${h}`).join("\n")}

CTAs:
${content.ctas.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

Body Text (truncated):
${content.bodyText.slice(0, 8000)}

Testimonials Found:
${
    content.testimonials.length > 0
      ? content.testimonials.map((t, i) => `  ${i + 1}. ${t}`).join("\n")
      : "  None detected"
  }

Pricing: ${content.pricing ?? "Not found"}

OG Tags: ${JSON.stringify(content.ogTags)}

Structured Data: ${
    content.structuredData ? "Present (truncated): " + content.structuredData.slice(0, 500) : "None"
  }`

  // Append custom section prompts
  if (customSections && customSections.length > 0) {
    prompt +=
      `\n\nAlso answer these custom questions based on the page analysis. Include answers in the "customSections" array in your JSON response:\n`
    for (const cs of customSections) {
      prompt += `\n---\n${cs.title}:\n${cs.prompt}`
    }
    prompt +=
      `\n\nEach custom section answer should be an object with "title" (the section title) and "answer" (your response, max 500 chars).`
  }

  prompt += `\n\nReturn the analysis as a JSON object matching the described structure.`
  return prompt
}

export const ANALYSIS_JSON_SCHEMA = {
  name: "landing_page_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      primaryAngle: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "scarcity",
              "authority",
              "social_proof",
              "pain_relief",
              "curiosity",
              "urgency",
              "transformation",
              "fear_of_missing_out",
            ],
          },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          explanation: { type: "string", maxLength: 200 },
        },
        required: ["type", "confidence", "explanation"],
        additionalProperties: false,
      },
      hookIdeas: {
        type: "array",
        items: { type: "string", maxLength: 100 },
        minItems: 5,
        maxItems: 5,
      },
      targetAudience: {
        type: "object",
        properties: {
          demographics: { type: "string", maxLength: 150 },
          interests: { type: "string", maxLength: 150 },
          likelyPlatform: {
            type: "string",
            enum: ["facebook", "google", "native", "tiktok", "youtube", "all"],
          },
          confidenceNotes: { type: "string", maxLength: 100 },
        },
        required: ["demographics", "interests", "likelyPlatform", "confidenceNotes"],
        additionalProperties: false,
      },
      adCopy: {
        type: "object",
        properties: {
          facebook: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string", maxLength: 100 },
                primaryText: { type: "string", maxLength: 500 },
                cta: { type: "string", maxLength: 30 },
              },
              required: ["headline", "primaryText", "cta"],
              additionalProperties: false,
            },
            minItems: 3,
            maxItems: 3,
          },
          google: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string", maxLength: 100 },
                primaryText: { type: "string", maxLength: 500 },
                cta: { type: "string", maxLength: 30 },
              },
              required: ["headline", "primaryText", "cta"],
              additionalProperties: false,
            },
            minItems: 3,
            maxItems: 3,
          },
          native: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string", maxLength: 100 },
                body: { type: "string", maxLength: 300 },
                cta: { type: "string", maxLength: 30 },
              },
              required: ["headline", "body", "cta"],
              additionalProperties: false,
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["facebook", "google", "native"],
        additionalProperties: false,
      },
      emailAngle: {
        type: "object",
        properties: {
          subjectLines: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 3,
          },
          bodyAngle: { type: "string", maxLength: 300 },
          smsAngle: { type: "string", maxLength: 160 },
        },
        required: ["subjectLines", "bodyAngle", "smsAngle"],
        additionalProperties: false,
      },
      trustSignals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "testimonial",
                "guarantee",
                "certification",
                "badge",
                "social_proof_count",
                "media_mention",
                "expert_endorsement",
                "before_after",
              ],
            },
            strength: { type: "string", enum: ["weak", "medium", "strong"] },
            present: { type: "boolean" },
            detail: { type: "string", maxLength: 150 },
          },
          required: ["type", "strength", "present", "detail"],
          additionalProperties: false,
        },
        minItems: 8,
        maxItems: 8,
      },
      conversionBlockers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            issue: { type: "string", maxLength: 200 },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            suggestion: { type: "string", maxLength: 200 },
          },
          required: ["issue", "severity", "suggestion"],
          additionalProperties: false,
        },
      },
      abTestIdeas: {
        type: "array",
        items: { type: "string", maxLength: 200 },
        minItems: 3,
        maxItems: 3,
      },
      competitiveIntel: {
        type: "object",
        properties: {
          likelyTrafficSources: {
            type: "array",
            items: { type: "string" },
          },
          estimatedDailySpend: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          whatCompetitorsAreLikelyTesting: {
            type: "string",
            maxLength: 200,
          },
        },
        required: [
          "likelyTrafficSources",
          "estimatedDailySpend",
          "whatCompetitorsAreLikelyTesting",
        ],
        additionalProperties: false,
      },
      competitorAngles: {
        type: "array",
        items: { type: "string", maxLength: 150 },
        minItems: 1,
        maxItems: 5,
      },
      customSections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            answer: { type: "string", maxLength: 500 },
          },
          required: ["title", "answer"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "primaryAngle",
      "hookIdeas",
      "targetAudience",
      "adCopy",
      "emailAngle",
      "trustSignals",
      "conversionBlockers",
      "abTestIdeas",
      "competitiveIntel",
      "competitorAngles",
    ],
    additionalProperties: false,
  },
} as const
