import { useEffect, useState } from "preact/hooks"
import { type AnalysisSummary, fetchHistory } from "../lib/api.ts"
import { currentUser, showToast } from "../lib/state.ts"

export function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!currentUser.value) {
      setError("Login to view history")
      setLoading(false)
      return
    }

    fetchHistory().then((res) => {
      setAnalyses(res.analyses)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load history")
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const handleViewAnalysis = (id: number) => {
    history.pushState(null, "", `/analyses/${id}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast("URL copied", "success")
    })
  }

  if (loading) {
    return (
      <section class="mt-6">
        <h1 class="text-2xl mb-4">Analysis History</h1>
        <div class="text-center py-10 text-fg-2">Loading...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section class="mt-6">
        <h1 class="text-2xl mb-4">Analysis History</h1>
        <div class="bg-red/10 border border-red rounded-lg p-4 text-center">{error}</div>
        <p class="text-center mt-4">
          <a href="/login" class="text-accent">Login</a>
        </p>
      </section>
    )
  }

  return (
    <section class="mt-6">
      <h1 class="text-2xl mb-4">Analysis History</h1>

      {analyses.length === 0 && <p class="text-center text-fg-2 py-10">No analyses yet.</p>}

      <div class="flex flex-col gap-2">
        {analyses.map((a) => (
          <div
            key={a.id}
            class="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-input/30"
            onClick={() => handleViewAnalysis(a.id)}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{a.url}</p>
              <p class="text-xs text-fg-2">
                {new Date(a.createdAt).toLocaleDateString()}
                {a.primaryAngle && (
                  <span class="ml-2 bg-accent/20 text-accent px-1.5 py-0.5 rounded text-xs">
                    {a.primaryAngle}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleCopyUrl(a.url)
              }}
              class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover border-none cursor-pointer ml-3 shrink-0"
            >
              Copy URL
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
