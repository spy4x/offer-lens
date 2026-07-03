// Scraper: fetches landing page HTML and extracts structured content
import { type PageContent, FETCH_TIMEOUT_MS, BODY_TEXT_MAX_CHARS } from "@offerlens/shared"

/**
 * Scrape a landing page URL and return structured PageContent.
 * Handles timeouts, errors, HTML parsing gracefully.
 */
export async function scrapePage(url: string): Promise<PageContent> {
  const normalizedUrl = normalizeUrl(url)
  let html: string

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    clearTimeout(timer)

    if (!response.ok) {
      return buildPartialContent(normalizedUrl, `HTTP ${response.status}: ${response.statusText}`)
    }

    html = await response.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("abort") || msg.includes("timeout")) {
      return buildPartialContent(normalizedUrl, "Request timed out after 10s")
    }
    return buildPartialContent(normalizedUrl, `Fetch error: ${msg}`)
  }

  return extractContent(normalizedUrl, html)
}

function normalizeUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized
  }
  return normalized
}

function buildPartialContent(url: string, error: string): PageContent {
  return {
    url,
    title: "",
    metaDescription: "",
    headlines: [],
    ctas: [],
    bodyText: `[Scrape error: ${error}]`,
    testimonials: [],
    pricing: null,
    ogTags: {},
    structuredData: null,
  }
}

function extractContent(url: string, html: string): PageContent {
  // Strip script, style, noscript, svg, nav, footer, header tags for cleaner text
  const cleanedHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")

  return {
    url,
    title: extractTitle(cleanedHtml),
    metaDescription: extractMetaDescription(cleanedHtml),
    headlines: extractHeadlines(cleanedHtml),
    ctas: extractCTAs(cleanedHtml),
    bodyText: extractBodyText(cleanedHtml),
    testimonials: extractTestimonials(cleanedHtml),
    pricing: extractPricing(cleanedHtml),
    ogTags: extractOGTags(html), // use original for meta tags
    structuredData: extractStructuredData(html), // use original for JSON-LD
  }
}

// --- Extractors ---

function extractTitle(html: string): string {
  // Try og:title first (handled in ogTags), then <title>
  const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
  if (ogMatch) return ogMatch[1].trim()

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch) return stripTags(titleMatch[1]).trim()

  return ""
}

function extractMetaDescription(html: string): string {
  // Try og:description first
  const ogMatch = html.match(
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
  )
  if (ogMatch) return ogMatch[1].trim()

  // Try meta name="description"
  const metaMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  )
  if (metaMatch) return metaMatch[1].trim()

  return ""
}

function extractHeadlines(html: string): string[] {
  const headlines: string[] = []

  // h1, h2
  const hTags = html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)
  for (const match of hTags) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 3 && !headlines.includes(text)) {
      headlines.push(text)
    }
  }

  // Elements with headline/title classes
  const classMatches = html.matchAll(
    /<(?:div|span|p|strong)[^>]*class=["'][^"']*(?:headline|title|heading)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p|strong)>/gi,
  )
  for (const match of classMatches) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 3 && !headlines.includes(text)) {
      headlines.push(text)
    }
  }

  return headlines.slice(0, 20)
}

function extractCTAs(html: string): string[] {
  const ctas: string[] = []
  const ctaPatterns = /\b(buy|get|start|try|sign|join|claim|order|subscribe|download|register|apply|learn|discover)\b/i

  // Buttons
  const buttons = html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)
  for (const match of buttons) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 2 && text.length <= 60) {
      ctas.push(text)
    }
  }

  // Links with button classes or CTA patterns
  const links = html.matchAll(/<a[^>]*class=["'][^"']*(?:cta|button|btn)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)
  for (const match of links) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 2 && text.length <= 60 && !ctas.includes(text)) {
      ctas.push(text)
    }
  }

  // Any element with class containing "cta"
  const ctaElements = html.matchAll(
    /<(?:div|span|a|button)[^>]*class=["'][^"']*cta[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|a|button)>/gi,
  )
  for (const match of ctaElements) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 2 && text.length <= 60 && !ctas.includes(text)) {
      ctas.push(text)
    }
  }

  // Also try elements with text matching CTA patterns
  const allElements = html.matchAll(/<[^>]+>([^<]{2,60})<\/[^>]+>/gi)
  for (const match of allElements) {
    const text = match[1].trim()
    if (text && ctaPatterns.test(text) && !ctas.includes(text) && !text.includes("<")) {
      ctas.push(text)
    }
  }

  return ctas.slice(0, 15)
}

function extractBodyText(html: string): string {
  // Remove all tags, collapse whitespace
  let text = html.replace(/<[^>]+>/g, " ")
  text = text.replace(/&[a-zA-Z]+;/g, " ")
  text = text.replace(/&#\d+;/g, " ")
  text = text.replace(/\s+/g, " ").trim()

  if (text.length > BODY_TEXT_MAX_CHARS) {
    text = text.slice(0, BODY_TEXT_MAX_CHARS) + "..."
  }

  return text
}

function extractTestimonials(html: string): string[] {
  const testimonials: string[] = []

  // blockquote elements
  const bq = html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi)
  for (const match of bq) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 10) testimonials.push(text)
  }

  // Elements with testimonial/review classes
  const classMatches = html.matchAll(
    /<(?:div|section|article|p|span)[^>]*class=["'][^"']*(?:testimonial|review|quote)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article|p|span)>/gi,
  )
  for (const match of classMatches) {
    const text = stripTags(match[1]).trim()
    if (text && text.length >= 10 && !testimonials.includes(text)) {
      testimonials.push(text)
    }
  }

  return testimonials.slice(0, 20)
}

function extractPricing(html: string): string | null {
  // Look for elements with $ and price-related classes
  const priceMatches = html.matchAll(
    /<(?:div|span|p|strong)[^>]*class=["'][^"']*(?:price|pricing|cost|amount)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p|strong)>/gi,
  )
  const prices: string[] = []
  for (const match of priceMatches) {
    const text = stripTags(match[1]).trim()
    if (text && /\$/.test(text)) prices.push(text)
  }

  if (prices.length > 0) return prices.join(" | ")

  // Fallback: find any text containing $ followed by digits
  const dollarMatch = html.match(/[\$]\s*\d[\d,.]*(?:\s*\/\s*(?:mo|month|yr|year|day|week|one[- ]?time))?/gi)
  if (dollarMatch) return dollarMatch.slice(0, 5).join(" | ")

  return null
}

function extractOGTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {}
  const metaTags = html.matchAll(
    /<meta\s+(?:property|name)=["']((?:og|twitter):[^"']+)["']\s+content=["']([^"']+)["']/gi,
  )
  for (const match of metaTags) {
    tags[match[1]] = match[2]
  }
  return tags
}

function extractStructuredData(html: string): string | null {
  const ldMatch = html.match(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  )
  if (ldMatch && ldMatch[1].trim()) {
    try {
      // Validate it's parseable JSON
      JSON.parse(ldMatch[1].trim())
      return ldMatch[1].trim()
    } catch {
      return ldMatch[1].trim() // return raw even if not valid JSON
    }
  }
  return null
}

// --- Helpers ---

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&[a-zA-Z]+;/g, " ").replace(/&#\d+;/g, " ").trim()
}
