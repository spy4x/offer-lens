export function LoadingSkeleton() {
  return (
    <div class="mt-6 animate-pulse">
      {/* Primary angle skeleton */}
      <div class="mb-6">
        <div class="skeleton h-5 w-40 mb-2.5" />
        <div class="skeleton h-20 w-full" />
      </div>

      {/* Hooks skeleton */}
      <div class="mb-6">
        <div class="skeleton h-5 w-32 mb-2.5" />
        <div class="skeleton h-4 w-full mb-2" />
        <div class="skeleton h-4 w-3/4 mb-2" />
        <div class="skeleton h-4 w-5/6" />
      </div>

      {/* Target audience skeleton */}
      <div class="mb-6">
        <div class="skeleton h-5 w-36 mb-2.5" />
        <div class="skeleton h-24 w-full" />
      </div>

      {/* Ad copy skeleton */}
      <div class="mb-6">
        <div class="skeleton h-5 w-24 mb-2.5" />
        <div class="skeleton h-10 w-full mb-2.5" />
        <div class="skeleton h-32 w-full" />
      </div>

      <p class="text-center text-sm text-fg-3 mt-4">Analyzing page... (2-5s)</p>
    </div>
  )
}
