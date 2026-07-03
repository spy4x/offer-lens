import { showToast } from "../lib/state.ts"

interface CopyButtonProps {
  text: string
  label?: string
  class?: string
}

export function CopyButton(props: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.text)
    } catch {
      fallbackCopy(props.text)
    }
    showToast("Copied!", "success")
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      class={props.class ||
        "bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg"}
      title="Copy"
    >
      {props.label || "📋"}
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
