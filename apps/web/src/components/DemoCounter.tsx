import { demoUsage } from "../lib/state.ts"

export function DemoCounter() {
  const usage = demoUsage.value
  // Hide counter when user has their own API key or no demo key configured
  if (!usage || usage.hasDemoKey === false) return null
  if (typeof usage.used !== "number") return null

  let colorClass = ""
  if (usage.remaining <= 0) colorClass = "text-red"
  else if (usage.remaining <= 10) colorClass = "text-yellow"

  return (
    <span
      class={`text-xs bg-input px-3 py-1 rounded ${colorClass || "text-fg-2"}`}
      title={`${usage.remaining} demo requests remaining`}
    >
      📊 {usage.used}/{usage.limit}
    </span>
  )
}
