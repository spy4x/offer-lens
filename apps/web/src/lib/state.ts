// Shared app state
import { signal } from "@preact/signals"
import type { DemoUsage } from "./api.ts"

export const demoUsage = signal<DemoUsage | null>(null)
export const isLoading = signal(false)
export const errorMessage = signal("")
