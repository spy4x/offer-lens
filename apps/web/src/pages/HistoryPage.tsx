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

  const handleShare = (id: number) => {
    navigator.clipboard.writeText(globalThis.location.origin + `/analyses/${id}`).then(() => {
      showToast("Share link copied!", "success")
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

      {analyses.length > 0 && (
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-input text-left text-xs text-fg-2">
              <th class="px-2 py-1.5">URL</th>
              <th class="px-2 py-1.5">Date</th>
              <th class="px-2 py-1.5">Angle</th>
              <th class="px-2 py-1.5">Conf.</th>
              <th class="px-2 py-1.5">Top Hook</th>
              <th class="px-2 py-1.5">Top Blocker</th>
              <th class="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((a) => (
              <tr
                key={a.id}
                class="border-b border-border text-sm cursor-pointer hover:bg-input/30"
                onClick={() => handleViewAnalysis(a.id)}
              >
                <td class="text-xs break-all text-accent-hover px-2 py-1.5 max-w-[200px] truncate">
                  {esc(a.url)}
                </td>
                <td class="text-xs text-fg-2 px-2 py-1.5 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td class="px-2 py-1.5">
                  {a.primaryAngle
                    ? (
                      <span class="bg-accent text-white px-2 py-0.5 rounded text-xs font-semibold uppercase">
                        {esc(a.primaryAngle)}
                      </span>
                    )
                    : <span class="text-fg-3">—</span>}
                </td>
                <td class="px-2 py-1.5 text-green font-semibold">
                  {a.confidence != null ? `${a.confidence}%` : "—"}
                </td>
                <td class="text-xs text-fg-3 px-2 py-1.5 max-w-[180px] truncate">
                  {esc(a.topHook || "") || "—"}
                </td>
                <td class="text-xs text-fg-3 px-2 py-1.5 max-w-[180px] truncate">
                  {esc(a.topBlocker || "") || "—"}
                </td>
                <td class="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(a.id)
                    }}
                    class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover border-none cursor-pointer shrink-0"
                  >
                    Share
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function esc(str: unknown): string {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
