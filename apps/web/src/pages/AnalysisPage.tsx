import { useEffect, useState } from "preact/hooks"
import { type AnalysisDetail, fetchAnalysisById } from "../lib/api.ts"
import { AnalysisResults } from "../components/AnalysisResults.tsx"
import { showToast } from "../lib/state.ts"
import { Icon } from "../components/Icon.tsx"

interface Props {
  id: number
}

export function AnalysisPage({ id }: Props) {
  const [data, setData] = useState<AnalysisDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    fetchAnalysisById(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div class="text-center py-20 fade-up">
        <div class="spinner-lg mx-auto mb-4" />
        <p class="text-sm text-fg-2">Loading analysis…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div class="max-w-md mx-auto mt-10 fade-up">
        <div class="card p-8 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-subtle text-red border border-red/20 mb-4">
            <Icon name="alert" size={20} />
          </div>
          <h1 class="text-xl font-bold mb-2">Analysis not found</h1>
          <p class="text-sm text-fg-2">{error || "Unknown error"}</p>
        </div>
      </div>
    )
  }

  return (
    <div class="space-y-5 fade-up">
      {/* Header bar */}
      <div class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-green">
              <span class="live-dot" style={{ width: 5, height: 5 }} />
              Analyzed
            </span>
            <span class="text-xs text-fg-3 nums">
              {new Date(data.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {data.tokensUsed && data.tokensUsed.totalTokens > 0 && (
              <span class="badge badge-neutral normal-case tracking-normal">
                {data.tokensUsed.totalTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
          <h1 class="text-lg font-bold tracking-tight truncate flex items-center gap-2">
            <Icon name="link" size={16} class="text-fg-3 shrink-0" />
            <span class="truncate">{data.url}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(globalThis.location.href).then(() =>
              showToast("Link copied", "success")
            )}
          class="btn-primary px-4 py-2.5 shrink-0"
        >
          <Icon name="share" size={14} />
          Share
        </button>
      </div>

      <AnalysisResults analysis={data.analysis} />
    </div>
  )
}
