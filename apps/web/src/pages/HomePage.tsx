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
import { Icon } from "../components/Icon.tsx"
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
    icon: "target" as const,
    title: "Angle Detection",
    desc:
      "Identifies the core persuasion angle — scarcity, social proof, transformation, urgency, and more.",
  },
  {
    icon: "document" as const,
    title: "Ad Copy Generator",
    desc: "Facebook, Google & native variants ready to launch. Headlines, body, and CTAs included.",
  },
  {
    icon: "mail" as const,
    title: "Email & SMS Angles",
    desc:
      "Subject lines, body angles, and SMS pitches tailored to the specific landing page offer.",
  },
  {
    icon: "alert" as const,
    title: "Conversion Blockers",
    desc: "Spots weak CTAs, missing trust signals, poor copy — exactly what's hurting conversions.",
  },
  {
    icon: "eye" as const,
    title: "Competitive Intel",
    desc:
      "Traffic source estimates, daily spend, and what competitors are likely A/B testing right now.",
  },
  {
    icon: "flask" as const,
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
  const socialProofCount = Math.max(totalAnalyses, 247)

  return (
    <>
      {/* ── HERO ── */}
      <section class="relative pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 overflow-hidden">
        {/* Background mesh + grid */}
        <div class="hero-mesh" aria-hidden="true" />
        <div class="hero-grid" aria-hidden="true" />

        <div class="relative z-10 text-center">
          {/* Eyebrow badge */}
          <div class="fade-up">
            <a
              href="#features"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-card border border-border text-xs text-fg-2 mb-7
                hover:border-accent/40 hover:text-fg transition-colors no-underline"
            >
              <span class="live-dot" />
              <span class="font-medium">AI-powered landing page intelligence</span>
              <Icon name="chevron-right" size={12} />
            </a>
          </div>

          {/* Headline */}
          <h1 class="display display-xl fade-up delay-1 mb-6">
            <span class="text-fg">Reverse-engineer</span>
            <br />
            <span class="text-gradient">any landing page</span>
          </h1>

          {/* Subhead */}
          <p class="max-w-[600px] mx-auto text-base sm:text-lg text-fg-2 mb-8 leading-relaxed fade-up delay-2">
            Paste a URL. Get the exact angles, hooks, ad copy, and{" "}
            <span class="text-fg font-medium">competitive intel</span>{" "}
            your competitors are using — in under five seconds.
          </p>

          {/* CTA Input */}
          {!hasAnalysis && !preloadedUrl && (
            <div class="max-w-[640px] mx-auto mb-10 fade-up delay-3">
              <form onSubmit={handleSubmit}>
                <div
                  class={`flex flex-col sm:flex-row gap-2 p-2 bg-card border rounded-2xl
                    shadow-lg transition-all duration-200
                    ${
                    showValidation && validationError
                      ? "border-red"
                      : "border-border focus-within:border-accent focus-within:shadow-glow"
                  }`}
                >
                  <div class="flex-1 relative">
                    <Icon
                      name="link"
                      size={16}
                      class="absolute left-4 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={url}
                      onInput={(e) => handleUrlInput((e.target as HTMLInputElement).value)}
                      class="w-full pl-11 pr-4 py-3.5 bg-transparent border-none
                        focus:outline-none text-fg text-sm sm:text-base placeholder:text-fg-3"
                      placeholder="https://competitor.com/offer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading.value}
                    class="btn-primary px-6 py-3.5 shrink-0 w-full sm:w-auto"
                  >
                    {isLoading.value ? <span class="spinner" /> : (
                      <>
                        <span>Analyze</span>
                        <Icon name="arrow-right" size={16} />
                      </>
                    )}
                  </button>
                </div>

                {showValidation && validationError && (
                  <p class="text-xs text-red text-left mt-2 ml-1 flex items-center gap-1.5">
                    <Icon name="alert" size={12} />
                    {validationError}
                  </p>
                )}
              </form>

              {/* Custom sections (logged-in only) */}
              {customSections.length > 0 && (
                <details class="mt-4 text-left">
                  <summary class="cursor-pointer text-xs text-fg-2 hover:text-fg select-none inline-flex items-center gap-1.5">
                    <Icon name="filter" size={12} />
                    Custom sections ({selectedSections.size}/{customSections.length} active)
                  </summary>
                  <div class="mt-3 flex flex-wrap gap-2">
                    {customSections.map((s) => (
                      <label
                        key={s.id}
                        class={`flex items-center gap-1.5 px-2.5 py-1.5 bg-input border rounded-md
                          cursor-pointer text-xs select-none transition-colors duration-150
                          ${
                          selectedSections.has(s.id)
                            ? "border-accent/40 text-fg"
                            : "border-border text-fg-2 hover:border-border-strong"
                        }`}
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
            </div>
          )}

          {/* Social proof row */}
          {!hasAnalysis && (
            <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fg-2 fade-up delay-4">
              <div class="inline-flex items-center gap-1.5">
                <Icon name="check" size={12} class="text-green" stroke={2.5} />
                <span class="nums font-semibold text-fg">{socialProofCount.toLocaleString()}+</span>
                <span>pages analyzed</span>
              </div>
              <span class="hidden sm:inline w-1 h-1 rounded-full bg-fg-3" />
              <div class="inline-flex items-center gap-1.5">
                <Icon name="zap" size={12} class="text-accent" />
                <span class="font-semibold text-fg">~3s</span>
                <span>average time</span>
              </div>
              <span class="hidden sm:inline w-1 h-1 rounded-full bg-fg-3" />
              <div class="inline-flex items-center gap-1.5">
                <Icon name="shield" size={12} class="text-accent" />
                <span class="font-semibold text-fg">No login</span>
                <span>to try</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      {!hasAnalysis && (
        <section id="how-it-works" class="py-16 sm:py-20 border-t border-border/60">
          <div class="text-center mb-12">
            <p class="eyebrow mb-3">Workflow</p>
            <h2 class="display display-lg mb-3">From URL to insights in three steps</h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[460px] mx-auto leading-relaxed">
              The fastest way to understand what makes a landing page convert.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[960px] mx-auto">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                class={`card p-6 sm:p-7 fade-up delay-${i + 1}`}
              >
                <div class="flex items-center justify-between mb-5">
                  <span class="text-xs font-mono font-semibold text-fg-3 nums">{s.num}</span>
                  <Icon name="arrow-up-right" size={14} class="text-fg-3" />
                </div>
                <h3 class="font-semibold text-base mb-1.5 tracking-tight">{s.title}</h3>
                <p class="text-sm text-fg-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      {!hasAnalysis && (
        <section id="features" class="py-16 sm:py-20 border-t border-border/60">
          <div class="text-center mb-12">
            <p class="eyebrow mb-3">Capabilities</p>
            <h2 class="display display-lg mb-3">Everything you need to out-convert</h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[520px] mx-auto leading-relaxed">
              A complete competitive analysis of any landing page — angles, copy, blockers, and what
              to test next.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1080px] mx-auto">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                class={`card p-6 hover-lift fade-up delay-${(i % 3) + 1}`}
              >
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg
                  bg-accent-subtle text-accent mb-4 border border-accent/20">
                  <Icon name={f.icon} size={18} stroke={1.75} />
                </div>
                <h3 class="font-semibold text-base mb-1.5 tracking-tight">{f.title}</h3>
                <p class="text-sm text-fg-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXAMPLE OUTPUT ── */}
      {!hasAnalysis && (
        <section class="py-16 sm:py-20 border-t border-border/60">
          <div class="text-center mb-12">
            <p class="eyebrow mb-3">Sample output</p>
            <h2 class="display display-lg mb-3">See what you get</h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[520px] mx-auto leading-relaxed">
              Real structure, real copy. Paste a URL above to see your page analyzed.
            </p>
          </div>

          <div class="max-w-[860px] mx-auto card overflow-hidden">
            {/* Mock browser chrome */}
            <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
              <span class="w-2.5 h-2.5 rounded-full bg-fg-3/30" />
              <span class="w-2.5 h-2.5 rounded-full bg-fg-3/30" />
              <span class="w-2.5 h-2.5 rounded-full bg-fg-3/30" />
              <div class="flex-1 mx-4">
                <div class="bg-input border border-border rounded-md px-3 py-1 text-xs text-fg-3 font-mono truncate max-w-[300px] mx-auto">
                  competitor.com/offer
                </div>
              </div>
            </div>

            <div class="p-6 sm:p-8 space-y-6">
              {/* Primary angle */}
              <div>
                <div class="flex flex-wrap items-center gap-3 mb-3">
                  <span class="badge badge-accent">Scarcity</span>
                  <div class="flex items-center gap-2 flex-1 max-w-xs">
                    <div class="confidence-bar flex-1">
                      <div class="confidence-fill high" style={{ transform: "scaleX(0.92)" }} />
                    </div>
                    <span class="text-xs font-semibold text-green nums">92%</span>
                  </div>
                </div>
                <p class="text-sm text-fg-2 leading-relaxed">
                  The page presents itself as an official example domain — implying it's a standard
                  reference.
                </p>
              </div>

              <hr />

              {/* Hook ideas */}
              <div>
                <div class="flex items-center justify-between mb-3">
                  <p class="eyebrow">Hook Ideas</p>
                  <span class="text-xs text-fg-3 nums">3 of 5</span>
                </div>
                <ul class="space-y-2">
                  {[
                    "Limited supply — act before it's gone",
                    "Only 47 spots left at this price",
                    "Last chance to lock in early access",
                  ].map((h, i) => (
                    <li key={i} class="flex items-start gap-2.5 text-sm text-fg">
                      <Icon
                        name="check"
                        size={14}
                        stroke={2.5}
                        class="text-green mt-0.5 shrink-0"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <hr />

              {/* Two-column preview */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-surface-2 border border-border rounded-xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <Icon name="alert" size={12} class="text-red" />
                    <p class="eyebrow text-fg-2">Top blocker</p>
                  </div>
                  <p class="text-sm text-fg">
                    <span class="badge badge-red mr-2">High</span>
                    No urgency indicators — countdown timer missing
                  </p>
                </div>
                <div class="bg-surface-2 border border-border rounded-xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <Icon name="document" size={12} class="text-accent" />
                    <p class="eyebrow text-fg-2">Ad copy · Facebook</p>
                  </div>
                  <p class="text-sm text-fg leading-relaxed">
                    <span class="text-accent font-medium">"</span>Don't miss out. Only 24h left at
                    this price.
                    <span class="text-accent font-medium">"</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p class="text-center text-xs text-fg-3 mt-5 inline-flex items-center gap-1.5 mx-auto justify-center w-full">
            <Icon name="sparkle" size={12} class="text-accent" />
            Paste a real URL above to see the full analysis for any page.
          </p>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      {!hasAnalysis && !preloadedUrl && (
        <section class="py-16 sm:py-20 border-t border-border/60">
          <div class="max-w-[640px] mx-auto card p-8 sm:p-10 text-center relative overflow-hidden">
            <div class="absolute inset-0 hero-mesh opacity-60" aria-hidden="true" />
            <div class="relative">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white mb-5 shadow-glow">
                <Icon name="rocket" size={22} />
              </div>
              <h2 class="display display-lg mb-3">Ready to analyze?</h2>
              <p class="text-sm sm:text-base text-fg-2 mb-6 leading-relaxed max-w-md mx-auto">
                Paste a URL and watch OfferLens reverse-engineer the offer in seconds.
              </p>
              <form
                onSubmit={handleSubmit}
                class="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              >
                <div class="flex-1 relative">
                  <Icon
                    name="link"
                    size={14}
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={url}
                    onInput={(e) => handleUrlInput((e.target as HTMLInputElement).value)}
                    class="input pl-10 py-3 text-sm"
                    placeholder="Paste a landing page URL..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading.value}
                  class="btn-primary px-5 py-3 text-sm"
                >
                  {isLoading.value ? <span class="spinner" /> : (
                    <>
                      Analyze
                      <Icon name="arrow-right" size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ── LOADING / RESULTS / ERRORS ── */}
      {isLoading.value && !preloadedUrl && <LoadingSkeleton />}

      {errorMessage.value && (
        <div class="card border-red/40 bg-red-subtle p-5 my-6 mx-auto max-w-[600px] flex items-start gap-3">
          <Icon name="alert" size={18} class="text-red shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-fg">{errorMessage.value}</p>
          </div>
          {!preloadedUrl && (
            <button
              type="button"
              onClick={() => errorMessage.value = ""}
              class="btn-ghost text-xs"
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
