import { toasts } from "../lib/state.ts"
import { Icon } from "./Icon.tsx"

export function ToastContainer() {
  const list = toasts.value
  if (!list.length) return null

  return (
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {list.map((t) => (
        <div key={t.id} class={`toast ${t.type === "success" ? "toast-success" : "toast-error"}`}>
          <Icon name={t.type === "success" ? "check" : "alert"} size={14} stroke={2.5} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
