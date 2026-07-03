import { useEffect, useState } from "preact/hooks"
import { analyzeBatch, type BatchResult, fetchUsage } from "../lib/api.ts"
import { demoUsage, errorMessage, isLoading } from "../lib/state.ts"
import { BatchResults } from "../components/BatchResults.tsx"

export function BatchPage() {
  const [urls, setUrls] = useState("")
  const [results, setResults] = useState<BatchResult[]>([])
  const [errors, setErrors] = useState<{ url: string; error: string }[]>([])

  useEffect(() => {
    fetchUsage().then((u) => {
      demoUsage.value = u
    }).catch(() => {})
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
      const data = await analyzeBatch(lines)
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
    <>
      <section class="text-center mb-6">
        <h1 class="text-3xl mb-2">Batch Analysis</h1>
        <p class="text-base text-fg-2 mb-5">
          Paste up to 50 URLs (one per line) for comparison.
        </p>
        <div class="max-w-[650px] mx-auto flex flex-col gap-3">
          <textarea
            id="batchUrls"
            value={urls}
            onInput={(e) => setUrls((e.target as HTMLTextAreaElement).value)}
            class="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg text-fg text-base focus:outline-none focus:border-accent resize-vertical min-h-[200px]"
            rows={10}
            placeholder="https://example.com/offer1&#10;https://example.com/offer2&#10;..."
          />
          <button
            id="batchAnalyzeBtn"
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading.value}
            class="px-7 py-3.5 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
          >
            🔍 Analyze All
          </button>
        </div>
      </section>

      {isLoading.value && (
        <div class="text-center py-10">
          <div class="spinner mb-4" />
          <p>Analyzing pages... (2-5s each)</p>
        </div>
      )}

      {errorMessage.value && (
        <div class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center">
          <p>{errorMessage.value}</p>
        </div>
      )}

      {(results.length > 0 || errors.length > 0) && (
        <BatchResults results={results} errors={errors} />
      )}
    </>
  )
}
