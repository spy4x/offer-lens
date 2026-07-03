// Shared app state
import { signal } from "@preact/signals"
import type { DemoUsage } from "./api.ts"

export const demoUsage = signal<DemoUsage | null>(null)
export const isLoading = signal(false)
export const errorMessage = signal("")

// Theme state: "dark" | "light"
export const theme = signal<"dark" | "light">(
  (localStorage.getItem("ol_theme") as "dark" | "light") || "dark",
)

// Subscribe to theme changes — apply to <html>
theme.subscribe((t) => {
  document.documentElement.setAttribute("data-theme", t)
  localStorage.setItem("ol_theme", t)
})

export function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark"
}

// Toast system
export interface Toast {
  id: number
  message: string
  type: "success" | "error"
}

export const toasts = signal<Toast[]>([])

let toastId = 0

export function showToast(message: string, type: "success" | "error" = "success") {
  const id = ++toastId
  toasts.value = [...toasts.value, { id, message, type }]
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 2500)
}
