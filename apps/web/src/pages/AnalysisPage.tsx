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
    setData(null)

    fetchAnalysisById(id).then((res) => {
      setData(res)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load analysis")
    }).finally(() => {
      setLoading(false)
    })
  }, [id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(globalThis.location.href).then(() => {
      showToast("Link copied!", "success")
    })
  }

  if (loading) {
    return (
      <section class="mt-6">
        <div class="text-center py-10 text-fg-2">Loading analysis...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section class="mt-6">
        <div class="bg-red/10 border border-red rounded-lg p-4 text-center">
          <h1 class="text-xl mb-2">Analysis Not Found</h1>
          <p class="text-fg-2 text-sm">{error}</p>
        </div>
      </section>
    )
  }

  if (!data) return null

  return (
    <section class="mt-6">
      <div class="mb-4">
        <div class="flex items-center justify-between gap-2">
          <h1 class="text-xl font-semibold truncate">{data.url}</h1>
          <button
            type="button"
            onClick={handleCopyLink}
            class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1 hover:bg-accent-hover border-none cursor-pointer shrink-0"
          >
            Share
          </button>
        </div>
        <div class="flex items-center gap-3 mt-1">
          <p class="text-xs text-fg-2">
            {new Date(data.createdAt).toLocaleDateString()}
          </p>
          {data.tokensUsed && data.tokensUsed.totalTokens > 0 && (
            <p class="text-xs text-fg-2">
              ~{data.tokensUsed.totalTokens} tokens
            </p>
          )}
        </div>
      </div>

      <AnalysisResults analysis={data.analysis} />
    </section>
  )
}
