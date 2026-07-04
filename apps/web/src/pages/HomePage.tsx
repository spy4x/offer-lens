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
    if (!["http:", "https:"].includes(u.protocol)) {
      return "URL must start with http:// or https://"
    }
    if (!u.hostname.includes(".")) return "Invalid domain"
    return null
  } catch {
    return "Invalid URL format"
  }
}

export function HomePage({ preloadedUrl }: Props) {
  const [url, setUrl] = useState(preloadedUrl || "")
  const [analysis, setAnalysis] = useState<LandingPageAnalysis | null>(null)
  const [validationError, setValidationError] = useState("")
  const [showValidation, setShowValidation] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>([])
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchUsage().then((u) => demoUsage.value = u).catch(() => {})
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
    if (showValidation && value.trim()) {
      setValidationError(validateUrl(value) || "")
    }
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
      {/* Hero */}
      <section class="text-center py-10 sm:py-16 lg:py-20">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs sm:text-sm text-accent mb-6">
          <span class="w-2 h-2 rounded-full bg-green animate-pulse" />
          AI-Powered Marketing Intelligence
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
          <span class="gradient-text">Analyze</span> <span class="text-fg">Any Landing Page</span>
          <br class="hidden sm:block" />
          <span class="text-fg">in Seconds</span>
        </h1>

        <p class="max-w-[600px] mx-auto text-base sm:text-lg text-fg-2 mb-8 leading-relaxed">
          Uncover angles, hooks, ad copy, email/SMS angles, and competitive intel —{" "}
          <span class="text-fg font-medium">instantly</span>. No guessing, just data.
        </p>

        {/* CTA Input */}
        {!hasAnalysis && !preloadedUrl && (
          <form onSubmit={handleSubmit} class="max-w-[600px] mx-auto">
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="flex-1">
                <input
                  id="urlInput"
                  type="text"
                  value={url}
                  onInput={(e) =>
                    handleUrlInput((e.target as HTMLInputElement).value)}
                  class={`w-full px-5 py-4 bg-input border rounded-xl text-fg text-base
                    focus:outline-none focus:border-accent transition-all duration-200
                    ${showValidation && validationError ? "border-red" : "border-border"}`}
                  placeholder="Paste a landing page URL..."
                />
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
                  : (
                    "Analyze →"
                  )}
              </button>
            </div>

            {/* Custom sections toggle */}
            {customSections.length > 0 && (
              <details class="mt-3 text-left">
                <summary class="cursor-pointer text-xs text-fg-2 hover:text-fg select-none py-1">
                  Custom sections ({selectedSections.size}/{customSections.length} active)
                </summary>
                <div class="mt-2 flex flex-wrap gap-2">
                  {customSections.map((s) => (
                    <label
                      key={s.id}
                      class="flex items-center gap-1.5 px-2.5 py-1.5 bg-input/50 border border-border
                        rounded-lg cursor-pointer hover:border-accent/30 text-xs select-none
                        transition-colors duration-150"
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
          <div class="max-w-[600px] mx-auto mt-4 bg-input/50 border border-border rounded-xl px-4 py-3 text-left">
            <span class="text-xs text-fg-3 block">Analyzed page:</span>
            <span class="text-sm text-fg-2 break-all">{preloadedUrl}</span>
          </div>
        )}
      </section>

      {/* Features grid — only show when no analysis */}
      {!hasAnalysis && (
        <section class="py-6 sm:py-10">
          <div class="text-center mb-8 sm:mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Everything you need to outsmart competitors
            </h2>
            <p class="text-fg-2 text-sm sm:text-base max-w-[500px] mx-auto">
              OfferLens reverse-engineers landing pages so you can replicate what works.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "🎯",
                title: "Primary Angle Detection",
                desc:
                  "Identifies the core persuasion angle — scarcity, social proof, transformation & more.",
              },
              {
                icon: "📝",
                title: "Ad Copy Generator",
                desc:
                  "Facebook, Google & native ad variants ready to launch. Headlines, body, CTAs included.",
              },
              {
                icon: "📧",
                title: "Email & SMS Angles",
                desc: "Subject lines, body angles, and SMS pitches tailored to the landing page.",
              },
              {
                icon: "⚠️",
                title: "Conversion Blockers",
                desc:
                  "Spots what's hurting conversions — weak CTAs, missing trust signals, poor copy.",
              },
              {
                icon: "🕺",
                title: "Competitive Intel",
                desc:
                  "Traffic source estimates, daily spend, and what competitors are likely testing.",
              },
              {
                icon: "💡",
                title: "A/B Test Ideas",
                desc: "Data-driven experiment suggestions to optimize the landing page further.",
              },
            ].map((f) => (
              <div key={f.title} class="feature-card">
                <div class="text-2xl mb-3">{f.icon}</div>
                <h3 class="font-semibold text-sm sm:text-base mb-1.5">{f.title}</h3>
                <p class="text-xs sm:text-sm text-fg-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Loading / Results / Errors */}
      {isLoading.value && !preloadedUrl && <LoadingSkeleton />}

      {errorMessage.value && (
        <div class="glass rounded-xl p-5 my-6 mx-auto max-w-[600px] text-center">
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
