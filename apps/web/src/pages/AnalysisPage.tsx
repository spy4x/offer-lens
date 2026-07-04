import { useEffect, useState } from "preact/hooks"
import { type AnalysisDetail, fetchAnalysisById } from "../lib/api.ts"
import { AnalysisResults } from "../components/AnalysisResults.tsx"
import { showToast } from "../lib/state.ts"

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
    fetchAnalysisById(id).then(setData).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    ).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div class="text-center py-20">
        <div class="spinner" />
        <p class="text-sm text-fg-2">Loading analysis...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div class="glass rounded-xl p-8 text-center max-w-md mx-auto mt-10">
        <h1 class="text-xl font-bold mb-2">Analysis Not Found</h1>
        <p class="text-sm text-fg-2">{error || "Unknown error"}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header bar */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-bold tracking-tight truncate">{data.url}</h1>
          <div class="flex items-center gap-3 mt-1 text-xs text-fg-2">
            <span>
              {new Date(data.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {data.tokensUsed && data.tokensUsed.totalTokens > 0 && (
              <span class="px-2 py-0.5 rounded-full bg-input/50">
                ~{data.tokensUsed.totalTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(globalThis.location.href).then(() =>
              showToast("Link copied!", "success")
            )}
          class="btn-glow px-5 py-2.5 text-white rounded-xl font-semibold text-sm
            inline-flex items-center gap-2 border-none cursor-pointer shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Share
        </button>
      </div>

      <AnalysisResults analysis={data.analysis} />
    </div>
  )
}
