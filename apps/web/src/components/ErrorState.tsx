import { errorMessage } from "../lib/state.ts"

export function ErrorState() {
  if (!errorMessage.value) return null
  return (
    <div class="bg-red/10 border border-red rounded-lg p-4 my-4 mx-auto max-w-[650px] text-center">
      <p>{errorMessage.value}</p>
    </div>
  )
}
