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
    <section class="mt-6 mb-6">
      <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">
        📦 BATCH RESULTS
      </h2>

      {results?.length > 0 && (
        <>
          <p class="mb-3">
            <strong>{results.length} analyzed successfully</strong>
          </p>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-input text-left text-xs text-fg-2">
                <th class="px-2 py-1.5">URL</th>
                <th class="px-2 py-1.5">Angle</th>
                <th class="px-2 py-1.5">Conf.</th>
                <th class="px-2 py-1.5">Top Hook</th>
                <th class="px-2 py-1.5">Top Blocker</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const a = r.analysis
                return (
                  <tr
                    key={i}
                    class="border-b border-border text-sm cursor-pointer hover:bg-input/50"
                    onClick={() => r.id ? goToAnalysis(r.id) : undefined}
                  >
                    <td class="text-xs break-all text-accent-hover px-2 py-1.5">
                      {esc(r.url)}
                    </td>
                    <td class="px-2 py-1.5">
                      <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold uppercase">
                        {esc(a?.primaryAngle?.type || "?")}
                      </span>
                    </td>
                    <td class="px-2 py-1.5 text-green font-semibold">
                      {a?.primaryAngle?.confidence ?? 0}%
                    </td>
                    <td class="text-xs text-fg-3 px-2 py-1.5">
                      {esc(a?.hookIdeas?.[0] || "")}
                    </td>
                    <td class="px-2 py-1.5">
                      {esc(a?.conversionBlockers?.[0]?.issue || "")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {errors?.length > 0 && (
        <>
          <p class="mt-3">
            <strong class="text-red">{errors.length} errors</strong>
          </p>
          <ul class="pl-5 mt-2.5 text-sm">
            {errors.map((e, i) => (
              <li key={i}>
                {esc(e.url)}: {esc(e.error)}
              </li>
            ))}
          </ul>
        </>
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
