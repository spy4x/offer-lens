import { useEffect, useState } from "preact/hooks"
import { analyzeSingle, fetchUsage, type LandingPageAnalysis } from "../lib/api.ts"
import { demoUsage, errorMessage, isLoading } from "../lib/state.ts"
import { AnalysisResults } from "../components/AnalysisResults.tsx"

interface Props {
  preloadedUrl?: string
}

export function HomePage({ preloadedUrl }: Props) {
  const [url, setUrl] = useState(preloadedUrl || "")
  const [analysis, setAnalysis] = useState<LandingPageAnalysis | null>(null)

  useEffect(() => {
    fetchUsage().then((u) => {
      demoUsage.value = u
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (preloadedUrl) handleAnalyze(preloadedUrl)
  }, [preloadedUrl])

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    const input = (document.getElementById("urlInput") as HTMLInputElement)?.value.trim()
    if (!input) return
    await handleAnalyze(input)
  }

  const handleAnalyze = async (targetUrl: string) => {
    isLoading.value = true
    errorMessage.value = ""
    setAnalysis(null)

    try {
      const data = await analyzeSingle(targetUrl)
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
              <input
                id="urlInput"
                type="url"
                value={url}
                onInput={(e) =>
                  setUrl((e.target as HTMLInputElement).value)}
                class="w-full px-4.5 py-3.5 bg-input border border-border rounded-lg text-fg text-base focus:outline-none focus:border-accent"
                placeholder="Paste a landing page URL..."
                required
              />
              <button
                type="submit"
                disabled={isLoading.value}
                class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                🔍 Analyze
              </button>
            </div>
          </form>
        )}
      </section>

      {isAnalyzing && (
        <div class="text-center py-10">
          <div class="spinner mb-4" />
          <p>Analyzing page... (2-5s)</p>
        </div>
      )}

      {errorMessage.value && (
        <div class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center">
          <p>{errorMessage.value}</p>
        </div>
      )}

      {analysis && <AnalysisResults analysis={analysis} />}
    </>
  )
}
