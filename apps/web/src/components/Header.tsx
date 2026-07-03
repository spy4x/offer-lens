import { DemoCounter } from "./DemoCounter.tsx"

export function Header() {
  return (
    <header class="flex justify-between items-center pb-4 border-b border-border mb-6">
      <div class="flex items-center gap-3">
        <a href="/" class="text-xl font-bold text-accent hover:no-underline">
          🔍 OfferLens
        </a>
      </div>
      <div class="flex items-center gap-3">
        <DemoCounter />
        <a
          href="/batch"
          class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover no-underline"
        >
          📦 Batch
        </a>
      </div>
    </header>
  )
}
