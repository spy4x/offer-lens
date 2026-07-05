// Confidence meter — gradient bar with status-based color

interface Props {
  value: number
  label?: string
}

export function ConfidenceMeter({ value, label }: Props) {
  const clamped = Math.max(0, Math.min(100, value))
  const tier = clamped >= 75 ? "high" : clamped >= 50 ? "medium" : "low"
  const tierLabel = tier === "high" ? "High" : tier === "medium" ? "Medium" : "Low"
  const tierColor = tier === "high" ? "text-green" : tier === "medium" ? "text-yellow" : "text-red"

  return (
    <div class="flex items-center gap-3 min-w-0">
      <div class="flex-1 min-w-[120px]">
        <div class="confidence-bar">
          <div
            class={`confidence-fill ${tier}`}
            style={{ transform: `scaleX(${clamped / 100})` }}
          />
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class={`text-xs font-semibold ${tierColor} nums`}>{clamped}%</span>
        {label && <span class="text-xs text-fg-3">{label}</span>}
      </div>
      <span class="sr-only">{tierLabel} confidence</span>
    </div>
  )
}
