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

  const linkClass =
    "text-sm px-3 py-2 rounded-lg font-medium transition-colors duration-150 hover:bg-input/80 no-underline"

  return (
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-border/50 mb-8">
      <div class="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" onClick={navTo("/")} class="flex items-center gap-2 group no-underline">
          <span class="text-2xl">🔍</span>
          <span class="text-lg font-bold tracking-tight">
            <span class="gradient-text">Offers</span>
            <span class="text-fg">Lens</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav class="hidden md:flex items-center gap-1.5">
          <DemoCounter />
          <a href="/batch" onClick={navTo("/batch")} class={`${linkClass} text-accent`}>
            📦 Batch
          </a>
          {user
            ? (
              <>
                <a href="/sections" onClick={navTo("/sections")} class={`${linkClass} text-fg-2`}>
                  📋 Sections
                </a>
                <a href="/settings" onClick={navTo("/settings")} class={`${linkClass} text-fg-2`}>
                  ⚙ Settings
                </a>
                <a href="/history" onClick={navTo("/history")} class={`${linkClass} text-fg-2`}>
                  📋 History
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navTo("/")()
                  }}
                  class={`${linkClass} text-fg-2 border-none cursor-pointer bg-transparent`}
                >
                  Logout
                </button>
              </>
            )
            : (
              <>
                <a
                  href="/register"
                  onClick={navTo("/register")}
                  class="btn-glow text-sm px-4 py-2 rounded-lg font-semibold no-underline text-white"
                >
                  Sign up free
                </a>
                <a href="/login" onClick={navTo("/login")} class={`${linkClass} text-fg-2`}>
                  Login
                </a>
              </>
            )}
          <button
            type="button"
            onClick={toggleTheme}
            class="ml-1 w-9 h-9 flex items-center justify-center rounded-lg bg-transparent
              border border-border hover:bg-input/50 cursor-pointer transition-colors"
            title={`Switch to ${theme.value === "dark" ? "light" : "dark"} mode`}
          >
            {theme.value === "dark" ? "☀️" : "🌙"}
          </button>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          class="md:hidden w-10 h-10 flex items-center justify-center rounded-lg
            border border-border bg-transparent cursor-pointer text-fg-2"
          aria-label="Toggle menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            {menuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div class="md:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 shadow-xl animate-in">
          <DemoCounter />
          <a href="/batch" onClick={navTo("/batch")} class={linkClass}>📦 Batch</a>
          {user
            ? (
              <>
                <a href="/sections" onClick={navTo("/sections")} class={linkClass}>📋 Sections</a>
                <a href="/settings" onClick={navTo("/settings")} class={linkClass}>⚙ Settings</a>
                <a href="/history" onClick={navTo("/history")} class={linkClass}>📋 History</a>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                    navTo("/")()
                  }}
                  class={`${linkClass} text-left border-none cursor-pointer bg-transparent`}
                >
                  Logout
                </button>
              </>
            )
            : (
              <>
                <a
                  href="/register"
                  onClick={navTo("/register")}
                  class="btn-glow text-sm px-3 py-2 rounded-lg font-semibold no-underline text-white inline-block text-center"
                >
                  Sign up free
                </a>
                <a href="/login" onClick={navTo("/login")} class={linkClass}>Login</a>
              </>
            )}
          <button
            type="button"
            onClick={() => {
              toggleTheme()
              setMenuOpen(false)
            }}
            class={`${linkClass} text-left border-none cursor-pointer bg-transparent`}
          >
            {theme.value === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      )}
    </header>
  )
}
