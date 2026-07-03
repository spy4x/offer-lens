import { DemoCounter } from "./DemoCounter.tsx"
import { currentUser, logout, theme, toggleTheme } from "../lib/state.ts"
import { useState } from "preact/hooks"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = currentUser.value

  const navTo = (path: string) => (e: Event) => {
    e.preventDefault()
    setMenuOpen(false)
    history.pushState(null, "", path)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <header class="flex justify-between items-center pb-4 border-b border-border mb-6">
      <div class="flex items-center gap-3">
        <a href="/" class="text-xl font-bold text-accent hover:no-underline">
          🔍 OfferLens
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        class="md:hidden bg-transparent border-none cursor-pointer text-fg-2 p-1"
        aria-label="Toggle menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          {menuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Desktop nav */}
      <div class="hidden md:flex items-center gap-3">
        <DemoCounter />
        <a
          href="/batch"
          onClick={navTo("/batch")}
          class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover no-underline"
        >
          📦 Batch
        </a>

        {user
          ? (
            <>
              <a
                href="/history"
                onClick={navTo("/history")}
                class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg font-medium hover:bg-border no-underline text-fg-2"
              >
                📋 History
              </a>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navTo("/")()
                }}
                class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg font-medium hover:bg-border cursor-pointer text-fg-2"
              >
                Logout
              </button>
            </>
          )
          : (
            <a
              href="/login"
              onClick={navTo("/login")}
              class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg font-medium hover:bg-border no-underline text-fg-2"
            >
              Login
            </a>
          )}

        <button
          type="button"
          onClick={toggleTheme}
          class="bg-input border border-border rounded-lg px-2.5 py-1.5 text-sm cursor-pointer hover:bg-border"
          aria-label="Toggle theme"
          title={`Switch to ${theme.value === "dark" ? "light" : "dark"} mode`}
        >
          {theme.value === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div class="absolute top-14 right-5 bg-card border border-border rounded-lg p-3 flex flex-col gap-2 z-40 shadow-lg md:hidden">
          <DemoCounter />
          <a
            href="/batch"
            onClick={navTo("/batch")}
            class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover no-underline"
          >
            📦 Batch
          </a>
          {user
            ? (
              <>
                <a
                  href="/history"
                  onClick={navTo("/history")}
                  class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg no-underline text-fg-2"
                >
                  📋 History
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                    navTo("/")()
                  }}
                  class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg cursor-pointer text-fg-2"
                >
                  Logout
                </button>
              </>
            )
            : (
              <a
                href="/login"
                onClick={navTo("/login")}
                class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg no-underline text-fg-2"
              >
                Login
              </a>
            )}
          <button
            type="button"
            onClick={toggleTheme}
            class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg cursor-pointer hover:bg-border"
          >
            {theme.value === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      )}
    </header>
  )
}
