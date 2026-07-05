// CopyButton — refined with new icon set + proper feedback
import { useState } from "preact/hooks"
import { showToast } from "../lib/state.ts"
import { Icon } from "./Icon.tsx"

interface CopyButtonProps {
  text: string
  label?: string
  variant?: "icon" | "pill" | "inline"
}

export function CopyButton({ text, label, variant = "icon" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      fallbackCopy(text)
    }
    setCopied(true)
    showToast("Copied", "success")
    setTimeout(() => setCopied(false), 1500)
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          bg-accent text-white border-none cursor-pointer hover:bg-accent-hover transition-colors"
      >
        <Icon name={copied ? "check" : "copy"} size={12} />
        {label || (copied ? "Copied" : "Copy")}
      </button>
    )
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Copy"
        class="inline-flex items-center justify-center w-6 h-6 ml-1 rounded
          bg-transparent border-none cursor-pointer text-fg-3 hover:text-fg hover:bg-input/60 transition-colors align-middle"
      >
        <Icon name={copied ? "check" : "copy"} size={13} />
      </button>
    )
  }

  // icon-only (default)
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      class="inline-flex items-center justify-center w-7 h-7 rounded-md
        bg-transparent border-none cursor-pointer text-fg-3 hover:text-fg hover:bg-input transition-colors"
    >
      <Icon name={copied ? "check" : "copy"} size={14} />
    </button>
  )
}

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea")
  ta.value = text
  ta.style.position = "fixed"
  ta.style.left = "-9999px"
  document.body.appendChild(ta)
  ta.select()
  document.execCommand("copy")
  document.body.removeChild(ta)
}
