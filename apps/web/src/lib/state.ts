// Shared app state
import { signal } from "@preact/signals"
import type { DemoUsage } from "./api.ts"

export const demoUsage = signal<DemoUsage | null>(null)
export const isLoading = signal(false)
export const errorMessage = signal("")

// Auth state
export interface UserInfo {
  id: string
  email?: string
  isAnonymous: boolean
  usageCount: number
  createdAt: string
}

export const authToken = signal<string | null>(localStorage.getItem("ol_token"))
export const currentUser = signal<UserInfo | null>(null)

// Subscribe to token changes
authToken.subscribe((t) => {
  if (t) localStorage.setItem("ol_token", t)
  else localStorage.removeItem("ol_token")
})

export function setAuth(token: string | null, user: UserInfo | null) {
  authToken.value = token
  currentUser.value = user
}

export function logout() {
  authToken.value = null
  currentUser.value = null
  localStorage.removeItem("ol_token")
}

// Theme state
export const theme = signal<"dark" | "light">(
  (localStorage.getItem("ol_theme") as "dark" | "light") || "dark",
)

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
