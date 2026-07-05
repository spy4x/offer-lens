import { Icon } from "./Icon.tsx"

export function LoadingSkeleton() {
  return (
    <div class="mt-8 space-y-3">
      <div class="card p-5 flex items-center gap-4">
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20">
          <Icon name="sparkle" size={18} class="animate-pulse" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="skeleton h-4 w-48 mb-2" />
          <div class="skeleton h-3 w-32" />
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} class="card p-5 sm:p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="skeleton w-8 h-8 rounded-lg shrink-0" />
            <div class="skeleton h-4 w-32" />
          </div>
          <div class="space-y-2.5">
            <div class="skeleton h-4 w-full" />
            <div class="skeleton h-4 w-5/6" />
            <div class="skeleton h-4 w-2/3" />
          </div>
        </div>
      ))}

      <p class="text-center text-sm text-fg-3 pt-3 inline-flex items-center gap-2 mx-auto justify-center w-full">
        <span class="live-dot" />
        Analyzing page · usually 3–5 seconds
      </p>
    </div>
  )
}
