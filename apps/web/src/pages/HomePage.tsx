import { useEffect, useState } from "preact/hooks"
import {
  analyzeSingle,
  type CustomSection,
  fetchSections,
  fetchUsage,
  type LandingPageAnalysis,
} from "../lib/api.ts"
import { authToken, demoUsage, errorMessage, isLoading } from "../lib/state.ts"
import { AnalysisResults } from "../components/AnalysisResults.tsx"
import { LoadingSkeleton } from "../components/LoadingSkeleton.tsx"

interface Props {
  preloadedUrl?: string
}

function validateUrl(s: string): string | null {
  s = s.trim()
  if (!s) return "Enter a URL"
  if (!/^https?:\/\//i.test(s)) s = "https://" + s
  try {
    const u = new URL(s)
    if (!["http:", "https:"].includes(u.protocol)) return "URL must start with http:// or https://"
    if (!u.hostname.includes(".")) return "Invalid domain"
    return null
  } catch {
    return "Invalid URL format"
  }
}

const FEATURES = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-accent"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Angle Detection",
    desc:
      "Identifies the core persuasion angle — scarcity, social proof, transformation, urgency, and more.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-accent"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: "Ad Copy Generator",
    desc:
      "Facebook, Google & native ad variants ready to launch. Headlines, body text, and CTAs included.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-accent"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22 6 12 13 2 6" />
      </svg>
    ),
    title: "Email & SMS Angles",
    desc:
      "Subject lines, body angles, and SMS pitches tailored to the specific landing page offer.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-accent"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "Conversion Blockers",
    desc: "Spots weak CTAs, missing trust signals, poor copy — exactly what's hurting conversions.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-accent"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Competitive Intel",
    desc:
      "Traffic source estimates, daily spend, and what competitors are likely A/B testing right now.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-accent"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "A/B Test Ideas",
    desc: "Data-driven experiment suggestions to optimize the landing page further.",
  },
]

const STEPS = [
  {
    num: "01",
    title: "Paste any URL",
    desc: "Enter a landing page URL — your own or a competitor's.",
  },
  {
    num: "02",
    title: "AI analyzes it",
    desc: "Our LLM reverse-engineers the page: angles, hooks, copy, blockers.",
  },
  {
    num: "03",
    title: "Get actionable insights",
    desc: "Export-ready ad copy, email/SMS scripts, and competitive intel.",
  },
]

export function HomePage({ preloadedUrl }: Props) {
  const [url, setUrl] = useState(preloadedUrl || "")
  const [analysis, setAnalysis] = useState<LandingPageAnalysis | null>(null)
  const [validationError, setValidationError] = useState("")
  const [showValidation, setShowValidation] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>([])
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set())
  const [totalAnalyses, setTotalAnalyses] = useState(0)

  useEffect(() => {
    fetchUsage().then((u) => {
      demoUsage.value = u
      // Use total demo usage as rough social proof count
      setTotalAnalyses(u.used)
    }).catch(() => {})
    if (authToken.value) {
      fetchSections().then((data) => {
        setCustomSections(data.sections)
        setSelectedSections(new Set(data.sections.map((s) => s.id)))
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (preloadedUrl) handleAnalyze(preloadedUrl)
  }, [preloadedUrl])

  function toggleSection(id: number) {
    const next = new Set(selectedSections)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedSections(next)
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    const input = url.trim()
    if (!input) return
    const err = validateUrl(input)
    if (err) {
      setValidationError(err)
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setValidationError("")
    await handleAnalyze(input)
  }

  const handleUrlInput = (value: string) => {
    setUrl(value)
    if (showValidation && value.trim()) setValidationError(validateUrl(value) || "")
  }

  const handleAnalyze = async (targetUrl: string) => {
    isLoading.value = true
    errorMessage.value = ""
    setAnalysis(null)

    const activeSections = customSections
      .filter((s) => selectedSections.has(s.id))
      .map((s) => ({ title: s.title, prompt: s.prompt }))

    try {
      const data = await analyzeSingle(
        targetUrl,
        activeSections.length > 0 ? activeSections : undefined,
      )
      if (data.demoUsage) demoUsage.value = data.demoUsage
      if (data.id) {
        history.pushState(null, "", `/analyses/${data.id}`)
        dispatchEvent(new PopStateEvent("popstate"))
        return
      }
      setAnalysis(data.analysis)
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : "Analysis failed"
    } finally {
      isLoading.value = false
    }
  }

  const hasAnalysis = analysis || isLoading.value

  return (
    <>
      {/* ── HERO ── */}
      <section class="text-center pt-8 sm:pt-16 lg:pt-24 pb-12 sm:pb-16">
        {/* Badge */}
        <a
          href="#features"
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs sm:text-sm text-accent mb-6 hover:bg-accent/15 transition-colors no-underline"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          AI-Powered Landing Page Analyzer
        </a>

        {/* Headline */}
        <h1 class="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-5">
          <span class="gradient-text">Reverse-Engineer</span>
          <br />
          <span class="text-fg">Any Landing Page</span>
        </h1>

        <p class="max-w-[580px] mx-auto text-base sm:text-lg text-fg-2 mb-8 leading-relaxed">
          Paste a URL. Get the exact angles, hooks, ad copy, and competitive intel{" "}
          <span class="text-fg font-medium">your competitors are using</span>.
        </p>

        {/* Social proof */}
        <div class="flex items-center justify-center gap-6 sm:gap-8 mb-10 text-xs sm:text-sm text-fg-2">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-green" />
            <span class="font-semibold text-fg">{Math.max(totalAnalyses, 12)}+</span> analyses run
          </div>
          <div class="flex items-center gap-1.5">
            <svg
              class="w-3.5 h-3.5 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span class="font-semibold text-fg">Export-ready</span> ad copy
          </div>
          <div class="flex items-center gap-1.5">
            <svg
              class="w-3.5 h-3.5 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span class="font-semibold text-fg">~2–5s</span> per page
          </div>
        </div>

        {/* CTA Input */}
        {!hasAnalysis && !preloadedUrl && (
          <form onSubmit={handleSubmit} class="max-w-[580px] mx-auto mb-12">
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="flex-1 relative">
                <input
                  id="urlInput"
                  type="text"
                  value={url}
                  onInput={(e) =>
                    handleUrlInput((e.target as HTMLInputElement).value)}
                  class={`w-full px-5 py-4 pl-12 bg-input/50 border rounded-xl text-fg text-base
                    focus:outline-none focus:border-accent transition-all duration-200
                    ${showValidation && validationError ? "border-red" : "border-border"}`}
                  placeholder="https://competitor.com/offer"
                />
                <svg
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {showValidation && validationError && (
                  <p class="text-xs text-red text-left mt-1.5 ml-1">{validationError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading.value}
                class="btn-glow px-8 py-4 text-white rounded-xl font-semibold text-base
                  inline-flex items-center justify-center gap-2 disabled:opacity-50
                  disabled:cursor-not-allowed border-none cursor-pointer shrink-0"
              >
                {isLoading.value
                  ? (
                    <span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )
                  : "Analyze →"}
              </button>
            </div>

            {customSections.length > 0 && (
              <details class="mt-3 text-left">
                <summary class="cursor-pointer text-xs text-fg-2 hover:text-fg select-none py-1">
                  Custom sections ({selectedSections.size}/{customSections.length} active)
                </summary>
                <div class="mt-2 flex flex-wrap gap-2">
                  {customSections.map((s) => (
                    <label
                      key={s.id}
                      class="flex items-center gap-1.5 px-2.5 py-1.5 bg-input/50 border border-border rounded-lg cursor-pointer hover:border-accent/30 text-xs select-none transition-colors duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSections.has(s.id)}
                        onChange={() => toggleSection(s.id)}
                        class="accent-accent"
                      />
                      <span>{s.title}</span>
                    </label>
                  ))}
                </div>
              </details>
            )}
          </form>
        )}

        {preloadedUrl && (
          <div class="max-w-[580px] mx-auto mt-4 glass rounded-xl px-4 py-3 text-left text-sm mb-10">
            <span class="text-xs text-fg-3 block">Analyzing:</span>
            <span class="text-fg-2 break-all">{preloadedUrl}</span>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      {!hasAnalysis && (
        <section id="how-it-works" class="py-12 sm:py-16 border-t border-border/40">
          <div class="text-center mb-10 sm:mb-14">
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[450px] mx-auto">
              Three simple steps to uncover what makes a landing page convert.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {STEPS.map((s) => (
              <div key={s.num} class="glass rounded-2xl p-6 sm:p-8 text-center">
                <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/15 text-accent font-bold text-sm mb-4">
                  {s.num}
                </span>
                <h3 class="font-semibold text-base mb-1.5">{s.title}</h3>
                <p class="text-sm text-fg-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      {!hasAnalysis && (
        <section id="features" class="py-12 sm:py-16 border-t border-border/40">
          <div class="text-center mb-10 sm:mb-14">
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Everything you get
            </h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[500px] mx-auto">
              A complete competitive analysis of any landing page — in seconds.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[900px] mx-auto">
            {FEATURES.map((f) => (
              <div key={f.title} class="feature-card">
                <div class="mb-3">{f.icon}</div>
                <h3 class="font-semibold text-sm sm:text-base mb-1">{f.title}</h3>
                <p class="text-xs sm:text-sm text-fg-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXAMPLE OUTPUT ── */}
      {!hasAnalysis && (
        <section class="py-12 sm:py-16 border-t border-border/40">
          <div class="text-center mb-8 sm:mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              See it in action
            </h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[500px] mx-auto">
              What you get after analyzing a landing page.
            </p>
          </div>

          <div class="max-w-[800px] mx-auto glass rounded-2xl p-5 sm:p-8 space-y-5">
            {/* Angle badge */}
            <div class="flex flex-wrap items-center gap-3">
              <span class="px-3 py-1 rounded-lg bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider">
                scarcity
              </span>
              <span class="text-sm text-green font-semibold">92% confidence</span>
            </div>

            {/* Hook ideas preview */}
            <div>
              <p class="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-2">
                Hook Ideas
              </p>
              <ul class="space-y-1.5">
                {[
                  "Limited supply — act before it's gone",
                  "Only 47 spots left at this price",
                  "Last chance to lock in early access",
                ].map((h, i) => (
                  <li key={i} class="flex items-start gap-2 text-sm text-fg-2">
                    <svg
                      class="w-4 h-4 mt-0.5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Two-column preview */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-input/30 rounded-xl p-4">
                <p class="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-2">
                  Conversion Blocker
                </p>
                <p class="text-sm text-fg-2">
                  <span class="text-red font-medium">High:</span>{" "}
                  No urgency indicators — countdown timer missing
                </p>
              </div>
              <div class="bg-input/30 rounded-xl p-4">
                <p class="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-2">
                  Ad Copy (Facebook)
                </p>
                <p class="text-sm text-fg-2">
                  <span class="text-accent font-medium">"</span>Don't miss out. Only 24h
                  left.<span class="text-accent font-medium">"</span>
                </p>
              </div>
            </div>
          </div>

          <p class="text-center text-xs text-fg-3 mt-4">
            Paste a real URL above to see the full analysis for any page.
          </p>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      {!hasAnalysis && !preloadedUrl && (
        <section class="py-12 sm:py-16 border-t border-border/40 text-center">
          <div class="max-w-[580px] mx-auto glass rounded-2xl p-8 sm:p-10">
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to analyze?
            </h2>
            <p class="text-sm sm:text-base text-fg-2 mb-6">
              Paste a URL above or enter one now — it's free.
            </p>
            <form onSubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3">
              <div class="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onInput={(e) => handleUrlInput((e.target as HTMLInputElement).value)}
                  class="w-full px-4 py-3 pl-10 bg-input/50 border border-border rounded-xl text-sm
                    focus:outline-none focus:border-accent transition-all"
                  placeholder="Paste a landing page URL..."
                />
                <svg
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-3 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <button
                type="submit"
                disabled={isLoading.value}
                class="btn-glow px-6 py-3 text-white rounded-xl font-semibold text-sm
                  border-none cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading.value ? "Analyzing..." : "Analyze →"}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ── LOADING / RESULTS / ERRORS ── */}
      {isLoading.value && !preloadedUrl && <LoadingSkeleton />}

      {errorMessage.value && (
        <div class="glass rounded-xl p-5 my-6 mx-auto max-w-[600px] text-center border-red/30">
          <p class="text-red font-medium">{errorMessage.value}</p>
          {!preloadedUrl && (
            <button
              type="button"
              onClick={() => errorMessage.value = ""}
              class="mt-2 text-xs text-fg-2 hover:text-fg underline bg-transparent border-none cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {analysis && <AnalysisResults analysis={analysis} />}
    </>
  )
}
