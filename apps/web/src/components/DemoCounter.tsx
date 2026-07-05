import { demoUsage } from "../lib/state.ts"
import { Icon } from "./Icon.tsx"

export function DemoCounter() {
  const usage = demoUsage.value
  if (!usage || usage.hasDemoKey === false) return null
  if (typeof usage.used !== "number") return null

  let colorClass = "text-fg-2"
  if (usage.remaining <= 0) colorClass = "text-red"
  else if (usage.remaining <= 10) colorClass = "text-yellow"

  return (
    <span
      class={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md
        bg-input border border-border ${colorClass} nums`}
      title={`${usage.remaining} demo requests remaining`}
    >
      <Icon name="zap" size={11} />
      <span class="font-semibold">{usage.used}</span>
      <span class="text-fg-3">/</span>
      <span>{usage.limit}</span>
    </span>
  )
}
