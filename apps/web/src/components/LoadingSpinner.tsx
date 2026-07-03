import { isLoading } from "../lib/state.ts"

export function LoadingSpinner() {
  if (!isLoading.value) return null
  return (
    <div class="text-center py-10">
      <div class="spinner mb-4" />
      <p>Analyzing page... (2-5s)</p>
    </div>
  )
}
