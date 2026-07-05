import { useEffect, useState } from "preact/hooks"
import { Logo } from "./Logo.tsx"
import { Icon } from "./Icon.tsx"
import { DemoCounter } from "./DemoCounter.tsx"
import { currentUser, logout, theme, toggleTheme } from "../lib/state.ts"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = currentUser.value

  // Close menu on route change
  useEffect(() => {
    const close = () => setMenuOpen(false)
    addEventListener("popstate", close)
    return () => removeEventListener("popstate", close)
  }, [])

  const navTo = (path: string) => (e: Event) => {
    e.preventDefault()
    setMenuOpen(false)
    history.pushState(null, "", path)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const linkBase =
    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 no-underline"

  return (
    <header class="sticky top-0 z-50 glass">
      <div class="max-w-[1180px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          onClick={navTo("/")}
          class="flex items-center no-underline hover:opacity-90 transition-opacity"
          aria-label="OfferLens home"
        >
          <Logo size={26} />
        </a>

        {/* Desktop nav */}
        <nav class="hidden md:flex items-center gap-1">
          <DemoCounter />
          <a
            href="/batch"
            onClick={navTo("/batch")}
            class={`${linkBase} text-fg-2 hover:text-fg hover:bg-input/60`}
          >
            Batch
          </a>
          {user
            ? (
              <>
                <a
                  href="/sections"
                  onClick={navTo("/sections")}
                  class={`${linkBase} text-fg-2 hover:text-fg hover:bg-input/60`}
                >
                  Sections
                </a>
                <a
                  href="/history"
                  onClick={navTo("/history")}
                  class={`${linkBase} text-fg-2 hover:text-fg hover:bg-input/60`}
                >
                  History
                </a>
                <a
                  href="/settings"
                  onClick={navTo("/settings")}
                  class={`btn-icon`}
                  aria-label="Settings"
                  title="Settings"
                >
                  <Icon name="cog" size={16} />
                </a>
                <div class="w-px h-5 bg-border mx-1" />
                <button
                  type="button"
                  onClick={toggleTheme}
                  class="btn-icon"
                  aria-label="Toggle theme"
                  title={`Switch to ${theme.value === "dark" ? "light" : "dark"} mode`}
                >
                  <Icon name={theme.value === "dark" ? "sun" : "moon"} size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navTo("/")()
                  }}
                  class={`${linkBase} text-fg-2 hover:text-fg hover:bg-input/60 border-none cursor-pointer bg-transparent inline-flex items-center gap-1.5`}
                  title="Sign out"
                >
                  <Icon name="logout" size={14} />
                  <span class="hidden lg:inline">Sign out</span>
                </button>
              </>
            )
            : (
              <>
                <button
                  type="button"
                  onClick={toggleTheme}
                  class="btn-icon"
                  aria-label="Toggle theme"
                  title={`Switch to ${theme.value === "dark" ? "light" : "dark"} mode`}
                >
                  <Icon name={theme.value === "dark" ? "sun" : "moon"} size={16} />
                </button>
                <a
                  href="/login"
                  onClick={navTo("/login")}
                  class={`${linkBase} text-fg-2 hover:text-fg hover:bg-input/60`}
                >
                  Sign in
                </a>
                <a
                  href="/register"
                  onClick={navTo("/register")}
                  class="btn-primary"
                >
                  Get started
                </a>
              </>
            )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          class="md:hidden btn-icon border-0"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={18} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div class="md:hidden glass border-t-0 px-4 py-3 flex flex-col gap-1 fade-up">
          <div class="px-1 py-1">
            <DemoCounter />
          </div>
          <a
            href="/batch"
            onClick={navTo("/batch")}
            class={`${linkBase} text-fg hover:bg-input/60`}
          >
            Batch
          </a>
          {user
            ? (
              <>
                <a
                  href="/sections"
                  onClick={navTo("/sections")}
                  class={`${linkBase} text-fg hover:bg-input/60`}
                >
                  Sections
                </a>
                <a
                  href="/history"
                  onClick={navTo("/history")}
                  class={`${linkBase} text-fg hover:bg-input/60`}
                >
                  History
                </a>
                <a
                  href="/settings"
                  onClick={navTo("/settings")}
                  class={`${linkBase} text-fg hover:bg-input/60`}
                >
                  Settings
                </a>
                <hr class="my-1" />
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navTo("/")()
                  }}
                  class={`${linkBase} text-fg hover:bg-input/60 text-left border-none cursor-pointer bg-transparent inline-flex items-center gap-2`}
                >
                  <Icon name="logout" size={14} />
                  Sign out
                </button>
              </>
            )
            : (
              <>
                <a
                  href="/login"
                  onClick={navTo("/login")}
                  class={`${linkBase} text-fg hover:bg-input/60`}
                >
                  Sign in
                </a>
                <a
                  href="/register"
                  onClick={navTo("/register")}
                  class="btn-primary justify-center mt-1"
                >
                  Get started
                </a>
              </>
            )}
          <button
            type="button"
            onClick={() => {
              toggleTheme()
              setMenuOpen(false)
            }}
            class={`${linkBase} text-fg-2 hover:bg-input/60 text-left border-none cursor-pointer bg-transparent inline-flex items-center gap-2`}
          >
            <Icon name={theme.value === "dark" ? "sun" : "moon"} size={14} />
            {theme.value === "dark" ? "Light" : "Dark"} theme
          </button>
        </div>
      )}
    </header>
  )
}
