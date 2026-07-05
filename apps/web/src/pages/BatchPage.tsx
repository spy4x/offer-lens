import { useEffect, useState } from "preact/hooks"
import { analyzeBatch, type BatchResult, fetchSections, fetchUsage } from "../lib/api.ts"
import { authToken, demoUsage, errorMessage, isLoading } from "../lib/state.ts"
import { BatchResults } from "../components/BatchResults.tsx"
import { Icon } from "../components/Icon.tsx"

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

  const urlCount = urls.split("\n").filter((u) => u.trim()).length

  return (
    <div class="max-w-[760px] space-y-5 fade-up">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20">
          <Icon name="package" size={18} />
        </span>
        <div>
          <h1 class="text-xl font-bold tracking-tight">Batch analysis</h1>
          <p class="text-xs text-fg-3">Up to 50 URLs · one per line</p>
        </div>
      </div>

      <div class="card p-5 sm:p-6">
        <label class="label">URLs</label>
        <div class="relative">
          <textarea
            value={urls}
            onInput={(e) => setUrls((e.target as HTMLTextAreaElement).value)}
            class="textarea font-mono text-sm"
            rows={10}
            placeholder={`https://example.com/landing-1\nhttps://example.com/landing-2\nhttps://example.com/landing-3`}
          />
          <div class="absolute bottom-3 right-3 text-xs text-fg-3 nums bg-card border border-border rounded px-2 py-0.5 pointer-events-none">
            {urlCount} / 50
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <p class="text-xs text-fg-3">
            URLs are processed in parallel · ~3–5s each
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading.value || urlCount === 0}
            class="btn-primary px-5 py-2.5"
          >
            {isLoading.value ? <span class="spinner" /> : (
              <>
                <Icon name="zap" size={14} />
                Analyze all
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading.value && (
        <div class="text-center py-10 fade-up">
          <div class="spinner-lg mx-auto mb-3" />
          <p class="text-sm text-fg-2">Analyzing pages…</p>
          <p class="text-xs text-fg-3 mt-1">3–5 seconds per page</p>
        </div>
      )}

      {errorMessage.value && (
        <div class="card p-4 border-red/30 bg-red-subtle flex items-start gap-3">
          <Icon name="alert" size={16} class="text-red shrink-0 mt-0.5" />
          <p class="text-sm text-red">{errorMessage.value}</p>
        </div>
      )}

      {(results.length > 0 || errors.length > 0) && (
        <BatchResults results={results} errors={errors} />
      )}
    </div>
  )
}
