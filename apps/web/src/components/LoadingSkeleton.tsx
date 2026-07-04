export function LoadingSkeleton() {
  return (
    <div class="mt-6 animate-pulse space-y-6">
      <div>
        <div class="skeleton h-5 w-40 mb-3" />
        <div class="skeleton h-28 w-full rounded-xl" />
      </div>
      <div>
        <div class="skeleton h-5 w-32 mb-3" />
        <div class="skeleton h-4 w-full mb-2.5" />
        <div class="skeleton h-4 w-3/4 mb-2.5" />
        <div class="skeleton h-4 w-5/6" />
      </div>
      <div>
        <div class="skeleton h-5 w-36 mb-3" />
        <div class="skeleton h-24 w-full rounded-xl" />
      </div>
      <div>
        <div class="skeleton h-5 w-24 mb-3" />
        <div class="skeleton h-12 w-full rounded-xl mb-3" />
        <div class="skeleton h-32 w-full rounded-xl" />
      </div>
      <p class="text-center text-sm text-fg-3 pt-2">Analyzing page... (2–5s)</p>
    </div>
  )
}
