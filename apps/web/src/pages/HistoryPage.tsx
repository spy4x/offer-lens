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
    fetchHistory().then((res) => setAnalyses(res.analyses)).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load history")
    ).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div class="text-center py-20 text-fg-2">
        <div class="spinner" />
        <p class="text-sm">Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div class="glass rounded-xl p-8 text-center max-w-md mx-auto mt-10">
        <p class="text-red font-medium mb-3">{error}</p>
        <a href="/login" class="text-accent font-medium text-sm">Login to view your analyses →</a>
      </div>
    )
  }

  return (
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Analysis History</h1>
        <p class="text-sm text-fg-2 mt-1">{analyses.length} analyses</p>
      </div>

      {analyses.length === 0
        ? (
          <div class="glass rounded-xl p-10 text-center text-fg-2">
            No analyses yet. Paste a URL on the home page to get started.
          </div>
        )
        : (
          <div class="table-wrap">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-border text-left text-xs font-medium text-fg-3 uppercase tracking-wider">
                  <th class="px-3 py-2.5">URL</th>
                  <th class="px-3 py-2.5 hidden sm:table-cell">Date</th>
                  <th class="px-3 py-2.5">Angle</th>
                  <th class="px-3 py-2.5 hidden md:table-cell">Conf.</th>
                  <th class="px-3 py-2.5 hidden lg:table-cell">Top Hook</th>
                  <th class="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr
                    key={a.id}
                    class="border-b border-border/50 cursor-pointer hover:bg-accent-subtle transition-colors text-sm"
                    onClick={() => {
                      history.pushState(null, "", `/analyses/${a.id}`)
                      dispatchEvent(new PopStateEvent("popstate"))
                    }}
                  >
                    <td class="px-3 py-3 text-xs break-all max-w-[180px] truncate block sm:table-cell">
                      {esc(a.url)}
                    </td>
                    <td class="px-3 py-3 text-xs text-fg-2 whitespace-nowrap hidden sm:table-cell">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td class="px-3 py-3">
                      {a.primaryAngle
                        ? (
                          <span class="bg-accent/15 text-accent px-2 py-0.5 rounded-md text-xs font-semibold uppercase">
                            {esc(a.primaryAngle)}
                          </span>
                        )
                        : <span class="text-fg-3 text-xs">—</span>}
                    </td>
                    <td class="px-3 py-3 text-xs text-green font-semibold hidden md:table-cell">
                      {a.confidence != null ? `${a.confidence}%` : "—"}
                    </td>
                    <td class="px-3 py-3 text-xs text-fg-2 max-w-[160px] truncate hidden lg:table-cell">
                      {esc(a.topHook || "") || "—"}
                    </td>
                    <td class="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(
                            globalThis.location.origin + `/analyses/${a.id}`,
                          ).then(() => showToast("Share link copied!", "success"))
                        }}
                        class="text-xs px-3 py-1.5 rounded-lg font-medium border border-accent/30
                          text-accent hover:bg-accent/10 transition-colors cursor-pointer bg-transparent"
                      >
                        Share
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

function esc(str: unknown): string {
  if (!str) return ""
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
