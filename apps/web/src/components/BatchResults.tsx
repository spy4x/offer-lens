import type { BatchResult } from "../lib/api.ts"
import { Icon } from "./Icon.tsx"

interface Props {
  results: BatchResult[]
  errors: { url: string; error: string }[]
}

export function BatchResults({ results, errors }: Props) {
  const goToAnalysis = (id: number) => {
    history.pushState(null, "", `/analyses/${id}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <section class="mt-8 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-accent-subtle text-accent border border-accent/20">
            <Icon name="package" size={16} />
          </span>
          <div>
            <h2 class="text-lg font-bold tracking-tight">Batch results</h2>
            <p class="text-xs text-fg-3">
              {results.length} analyzed · {errors.length} failed
            </p>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Angle</th>
                <th class="hidden sm:table-cell">Conf.</th>
                <th class="hidden md:table-cell">Top hook</th>
                <th class="hidden lg:table-cell">Top blocker</th>
                <th class="hidden md:table-cell text-center">Custom</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const a = r.analysis
                const conf = a?.primaryAngle?.confidence ?? 0
                return (
                  <tr key={i} onClick={() => r.id ? goToAnalysis(r.id) : undefined}>
                    <td>
                      <span class="font-mono text-xs text-fg-2 truncate block max-w-[200px]">
                        {host(r.url)}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-accent">
                        {esc(a?.primaryAngle?.type || "?")}
                      </span>
                    </td>
                    <td class="hidden sm:table-cell">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-green nums">{conf}%</span>
                      </div>
                    </td>
                    <td class="hidden md:table-cell">
                      <span class="text-xs text-fg-2 truncate block max-w-[200px]">
                        {esc(a?.hookIdeas?.[0] || "") || "—"}
                      </span>
                    </td>
                    <td class="hidden lg:table-cell">
                      <span class="text-xs text-fg-2 truncate block max-w-[200px]">
                        {esc(a?.conversionBlockers?.[0]?.issue || "") || "—"}
                      </span>
                    </td>
                    <td class="hidden md:table-cell text-center">
                      {a?.customSections?.length
                        ? (
                          <span class="text-xs font-semibold text-accent nums">
                            +{a.customSections.length}
                          </span>
                        )
                        : <span class="text-xs text-fg-3">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {errors.length > 0 && (
        <div class="card p-5 border-red/30 bg-red-subtle">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="alert" size={14} class="text-red" />
            <p class="font-semibold text-sm text-red">
              {errors.length} {errors.length === 1 ? "URL failed" : "URLs failed"}
            </p>
          </div>
          <ul class="space-y-1.5">
            {errors.map((e, i) => (
              <li key={i} class="text-xs text-fg-2 flex items-start gap-2">
                <span class="font-mono text-red shrink-0 max-w-[200px] truncate">{esc(e.url)}</span>
                <span class="text-fg-3">·</span>
                <span>{esc(e.error)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function esc(str: unknown): string {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
