import { useEffect, useState } from "preact/hooks"
import { type AnalysisSummary, fetchHistory } from "../lib/api.ts"
import { currentUser, showToast } from "../lib/state.ts"
import { Icon } from "../components/Icon.tsx"

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
    fetchHistory()
      .then((res) => setAnalyses(res.analyses))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false))
  }, [])

  const navTo = (path: string) => () => {
    history.pushState(null, "", path)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const shareLink = (id: number) => (e: Event) => {
    e.stopPropagation()
    navigator.clipboard
      .writeText(globalThis.location.origin + `/analyses/${id}`)
      .then(() => showToast("Share link copied", "success"))
  }

  if (loading) {
    return (
      <div class="text-center py-20 fade-up">
        <div class="spinner-lg mx-auto mb-4" />
        <p class="text-sm text-fg-2">Loading history…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div class="max-w-md mx-auto mt-10 fade-up">
        <div class="card p-8 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-subtle text-red border border-red/20 mb-4">
            <Icon name="alert" size={20} />
          </div>
          <p class="text-red font-medium mb-3">{error}</p>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault()
              navTo("/login")()
            }}
            class="btn-primary inline-flex"
          >
            Sign in
            <Icon name="arrow-right" size={14} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div class="space-y-5 fade-up">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20">
            <Icon name="clock" size={18} />
          </span>
          <div>
            <h1 class="text-xl font-bold tracking-tight">Analysis history</h1>
            <p class="text-xs text-fg-3 nums">
              {analyses.length} {analyses.length === 1 ? "analysis" : "analyses"}
            </p>
          </div>
        </div>
      </div>

      {analyses.length === 0
        ? (
          <div class="card p-12 text-center">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-input text-fg-3 mb-4">
              <Icon name="search" size={22} />
            </div>
            <p class="text-sm text-fg-2 mb-1">No analyses yet</p>
            <p class="text-xs text-fg-3 mb-5">Paste a URL on the home page to get started.</p>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navTo("/")()
              }}
              class="btn-primary inline-flex"
            >
              Analyze a URL
              <Icon name="arrow-right" size={14} />
            </a>
          </div>
        )
        : (
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th class="hidden sm:table-cell">Date</th>
                  <th>Angle</th>
                  <th class="hidden md:table-cell">Conf.</th>
                  <th class="hidden lg:table-cell">Top hook</th>
                  <th class="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navTo(`/analyses/${a.id}`)()}
                  >
                    <td>
                      <span class="font-mono text-xs text-fg-2 block max-w-[220px] truncate">
                        {host(a.url)}
                      </span>
                    </td>
                    <td class="hidden sm:table-cell">
                      <span class="text-xs text-fg-2 whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      {a.primaryAngle
                        ? (
                          <span class="badge badge-accent">
                            {esc(a.primaryAngle)}
                          </span>
                        )
                        : <span class="text-fg-3 text-xs">—</span>}
                    </td>
                    <td class="hidden md:table-cell">
                      {a.confidence != null
                        ? (
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold text-green nums">
                              {a.confidence}%
                            </span>
                          </div>
                        )
                        : <span class="text-fg-3 text-xs">—</span>}
                    </td>
                    <td class="hidden lg:table-cell">
                      <span class="text-xs text-fg-2 block max-w-[180px] truncate">
                        {esc(a.topHook || "") || "—"}
                      </span>
                    </td>
                    <td class="text-right">
                      <button
                        type="button"
                        onClick={shareLink(a.id)}
                        class="btn-ghost text-xs"
                      >
                        <Icon name="share" size={12} />
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

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "") + new URL(url).pathname
  } catch {
    return url
  }
}

function esc(str: unknown): string {
  if (!str) return ""
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
    /"/g,
    "&quot;",
  )
}
