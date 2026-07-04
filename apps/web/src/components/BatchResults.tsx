import type { BatchResult } from "../lib/api.ts"

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
    <section class="mt-8">
      <h2 class="text-lg font-bold tracking-tight mb-3 flex items-center gap-2">
        📦 Batch Results
        {results.length > 0 && (
          <span class="text-xs font-normal text-fg-2 bg-input/50 px-2 py-0.5 rounded-full">
            {results.length} analyzed
          </span>
        )}
      </h2>

      {results.length > 0 && (
        <div class="table-wrap glass rounded-xl">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border/50 text-left text-xs font-medium text-fg-3 uppercase tracking-wider">
                <th class="px-3 py-2.5">URL</th>
                <th class="px-3 py-2.5">Angle</th>
                <th class="px-3 py-2.5 hidden sm:table-cell">Conf.</th>
                <th class="px-3 py-2.5 hidden md:table-cell">Top Hook</th>
                <th class="px-3 py-2.5 hidden lg:table-cell">Top Blocker</th>
                <th class="px-3 py-2.5 hidden md:table-cell text-center">Custom</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const a = r.analysis
                return (
                  <tr
                    key={i}
                    class="border-b border-border/30 text-sm cursor-pointer hover:bg-accent-subtle transition-colors"
                    onClick={() => r.id ? goToAnalysis(r.id) : undefined}
                  >
                    <td class="text-xs break-all text-fg px-3 py-3 max-w-[180px] truncate block sm:table-cell">
                      {esc(r.url)}
                    </td>
                    <td class="px-3 py-3">
                      <span class="bg-accent/15 text-accent px-2 py-0.5 rounded-md text-xs font-semibold uppercase">
                        {esc(a?.primaryAngle?.type || "?")}
                      </span>
                    </td>
                    <td class="px-3 py-3 text-green font-semibold text-xs hidden sm:table-cell">
                      {a?.primaryAngle?.confidence ?? 0}%
                    </td>
                    <td class="text-xs text-fg-2 px-3 py-3 max-w-[160px] truncate hidden md:table-cell">
                      {esc(a?.hookIdeas?.[0] || "") || "—"}
                    </td>
                    <td class="px-3 py-3 text-xs text-fg-2 max-w-[160px] truncate hidden lg:table-cell">
                      {esc(a?.conversionBlockers?.[0]?.issue || "") || "—"}
                    </td>
                    <td class="px-3 py-3 text-center hidden md:table-cell">
                      {a?.customSections?.length
                        ? (
                          <span
                            class="text-xs text-accent font-semibold"
                            title={`${a.customSections.length} custom sections`}
                          >
                            +{a.customSections.length}
                          </span>
                        )
                        : <span class="text-fg-3 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {errors.length > 0 && (
        <div class="mt-4">
          <p class="text-sm font-medium text-red mb-2">{errors.length} failed</p>
          <ul class="space-y-1 text-xs">
            {errors.map((e, i) => (
              <li key={i} class="text-fg-2">
                <span class="text-red font-medium">{esc(e.url)}</span>: {esc(e.error)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function esc(str: unknown): string {
  if (!str) return ""
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
