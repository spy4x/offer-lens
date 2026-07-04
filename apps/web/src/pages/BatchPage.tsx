import { useEffect, useState } from "preact/hooks"
import { analyzeBatch, type BatchResult, fetchSections, fetchUsage } from "../lib/api.ts"
import { authToken, demoUsage, errorMessage, isLoading } from "../lib/state.ts"
import { BatchResults } from "../components/BatchResults.tsx"

export function BatchPage() {
  const [urls, setUrls] = useState("")
  const [results, setResults] = useState<BatchResult[]>([])
  const [errors, setErrors] = useState<{ url: string; error: string }[]>([])
  const [customSections, setCustomSections] = useState<
    Array<{ title: string; prompt: string }>
  >([])

  useEffect(() => {
    fetchUsage().then((u) => demoUsage.value = u).catch(() => {})
    if (authToken.value) {
      fetchSections().then((data) =>
        setCustomSections(
          data.sections.filter((s) => s.isActive).map((s) => ({
            title: s.title,
            prompt: s.prompt,
          })),
        )
      ).catch(() => {})
    }
  }, [])

  const handleAnalyze = async () => {
    const lines = urls.split("\n").map((u) => u.trim()).filter(Boolean)
    if (lines.length === 0) {
      errorMessage.value = "Enter at least one URL."
      return
    }
    if (lines.length > 50) {
      errorMessage.value = "Maximum 50 URLs allowed."
      return
    }
    isLoading.value = true
    errorMessage.value = ""
    setResults([])
    setErrors([])
    try {
      const data = await analyzeBatch(
        lines,
        customSections.length > 0 ? customSections : undefined,
      )
      if (data.demoUsage) demoUsage.value = data.demoUsage
      setResults(data.results || [])
      setErrors(data.errors || [])
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : "Batch analysis failed"
    } finally {
      isLoading.value = false
    }
  }

  return (
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Batch Analysis</h1>
        <p class="text-sm text-fg-2 mt-1">Paste up to 50 URLs, one per line.</p>
      </div>

      <div class="flex flex-col gap-3 max-w-[700px]">
        <textarea
          id="batchUrls"
          value={urls}
          onInput={(e) => setUrls((e.target as HTMLTextAreaElement).value)}
          class="w-full px-4 py-3 bg-input border border-border rounded-xl text-fg text-sm
            focus:outline-none focus:border-accent transition-colors resize-vertical min-h-[200px]"
          rows={10}
          placeholder={`https://example.com/landing-page-1\nhttps://example.com/landing-page-2\n...`}
        />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading.value}
          class="btn-glow px-8 py-3.5 text-white rounded-xl font-semibold text-sm
            inline-flex items-center justify-center gap-2 disabled:opacity-50
            disabled:cursor-not-allowed border-none cursor-pointer self-start"
        >
          {isLoading.value
            ? (
              <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )
            : (
              "🔍 Analyze All"
            )}
        </button>
      </div>

      {isLoading.value && (
        <div class="text-center py-12">
          <div class="spinner" />
          <p class="text-sm text-fg-2">Analyzing pages... (2–5s each)</p>
        </div>
      )}

      {errorMessage.value && (
        <div class="glass rounded-xl p-5 mt-6 max-w-[700px] text-center">
          <p class="text-red font-medium text-sm">{errorMessage.value}</p>
        </div>
      )}

      {(results.length > 0 || errors.length > 0) && (
        <BatchResults results={results} errors={errors} />
      )}
    </div>
  )
}
