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
  // Add protocol if missing
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

export function HomePage({ preloadedUrl }: Props) {
  const [url, setUrl] = useState(preloadedUrl || "")
  const [analysis, setAnalysis] = useState<LandingPageAnalysis | null>(null)
  const [validationError, setValidationError] = useState("")
  const [showValidation, setShowValidation] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>([])
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchUsage().then((u) => {
      demoUsage.value = u
    }).catch(() => {})
    // Load custom sections if authenticated
    if (authToken.value) {
      fetchSections().then((data) => {
        setCustomSections(data.sections)
        // Auto-select all active sections
        setSelectedSections(new Set(data.sections.map((s) => s.id)))
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (preloadedUrl) handleAnalyze(preloadedUrl)
  }, [preloadedUrl])

  // Keyboard: Enter to submit when url input focused
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setValidationError("")
        errorMessage.value = ""
      }
    }
    addEventListener("keydown", handler)
    return () => removeEventListener("keydown", handler)
  }, [])

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
      const err = validateUrl(value)
      setValidationError(err || "")
    }
  }

  const handleAnalyze = async (targetUrl: string) => {
    isLoading.value = true
    errorMessage.value = ""
    setAnalysis(null)

    // Get selected section prompts
    const activeSections = customSections
      .filter((s) => selectedSections.has(s.id))
      .map((s) => ({ title: s.title, prompt: s.prompt }))

    try {
      const data = await analyzeSingle(
        targetUrl,
        activeSections.length > 0 ? activeSections : undefined,
      )
      if (data.demoUsage) demoUsage.value = data.demoUsage
      setAnalysis(data.analysis)
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : "Analysis failed"
    } finally {
      isLoading.value = false
    }
  }

  const isAnalyzing = preloadedUrl && !analysis && isLoading.value

  return (
    <>
      <section class="text-center mb-6">
        <h1 class="text-3xl mb-2">
          {analysis ? "Analysis Results" : "Analyze Any Landing Page in Seconds"}
        </h1>
        {!analysis && !isAnalyzing && (
          <p class="text-base text-fg-2 mb-5">
            Get angles, hooks, ad copy, email/SMS angles, and competitive intel — instantly.
          </p>
        )}
        {preloadedUrl && (
          <div class="bg-input border border-border rounded-lg px-3.5 py-2.5 max-w-[650px] mx-auto text-left">
            <span class="text-xs text-fg-3 block">Analyzed page:</span>
            <span class="text-sm text-fg-2 break-all">{preloadedUrl}</span>
          </div>
        )}
        {!preloadedUrl && (
          <form id="analyzeForm" onSubmit={handleSubmit} class="max-w-[650px] mx-auto">
            <div class="flex gap-2 max-w-[650px] mx-auto">
              <div class="flex-1">
                <input
                  id="urlInput"
                  type="url"
                  value={url}
                  onInput={(e) =>
                    handleUrlInput((e.target as HTMLInputElement).value)}
                  class={`w-full px-4.5 py-3.5 bg-input border rounded-lg text-fg text-base focus:outline-none focus:border-accent ${
                    showValidation && validationError ? "border-red" : "border-border"
                  }`}
                  placeholder="Paste a landing page URL..."
                  required
                />
                {showValidation && validationError && (
                  <p class="text-xs text-red text-left mt-1 ml-1">{validationError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading.value}
                class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                🔍 Analyze
              </button>
            </div>
            {customSections.length > 0 && (
              <div class="mt-3 text-left">
                <details class="text-xs">
                  <summary class="cursor-pointer text-fg-2 hover:text-fg select-none">
                    Custom sections ({selectedSections.size}/{customSections.length} selected)
                  </summary>
                  <div class="mt-2 flex flex-wrap gap-2">
                    {customSections.map((s) => (
                      <label
                        key={s.id}
                        class="flex items-center gap-1.5 px-2 py-1 bg-card border border-border rounded-lg cursor-pointer hover:bg-border select-none"
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
              </div>
            )}
          </form>
        )}
      </section>

      {isAnalyzing && <LoadingSkeleton />}

      {isLoading.value && !preloadedUrl && <LoadingSkeleton />}

      {errorMessage.value && (
        <div class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center">
          <p>{errorMessage.value}</p>
          {!preloadedUrl && (
            <button
              type="button"
              onClick={() => errorMessage.value = ""}
              class="mt-2 text-xs underline cursor-pointer bg-transparent border-none text-red"
            >
              Dismiss (Esc)
            </button>
          )}
        </div>
      )}

      {analysis && <AnalysisResults analysis={analysis} />}
    </>
  )
}
