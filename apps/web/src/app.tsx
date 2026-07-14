import { useEffect, useState } from "preact/hooks"
import { Header } from "./components/Header.tsx"
import { HomePage } from "./pages/HomePage.tsx"
import { BatchPage } from "./pages/BatchPage.tsx"
import { LoginPage } from "./pages/LoginPage.tsx"
import { RegisterPage } from "./pages/RegisterPage.tsx"
import { HistoryPage } from "./pages/HistoryPage.tsx"
import { SettingsPage } from "./pages/SettingsPage.tsx"
import { SectionsPage } from "./pages/SectionsPage.tsx"
import { AnalysisPage } from "./pages/AnalysisPage.tsx"
import { ToastContainer } from "./components/Toast.tsx"
import { authToken, currentUser, setAuth, theme } from "./lib/state.ts"
import { fetchMe } from "./lib/api.ts"
import { Icon } from "./components/Icon.tsx"

type Page =
  | { type: "home" }
  | { type: "batch" }
  | { type: "login" }
  | { type: "register" }
  | { type: "history" }
  | { type: "settings" }
  | { type: "sections" }
  | { type: "analysis"; id: number }

function getPageFromPath(): Page {
  const path = location.pathname
  const analysisMatch = path.match(/^\/analyses\/(\d+)$/)
  if (analysisMatch) return { type: "analysis", id: parseInt(analysisMatch[1], 10) }
  if (path === "/batch") return { type: "batch" }
  if (path === "/login") return { type: "login" }
  if (path === "/register") return { type: "register" }
  if (path === "/history") return { type: "history" }
  if (path === "/settings") return { type: "settings" }
  if (path === "/sections") return { type: "sections" }
  return { type: "home" }
}

const navTo = (path: string) => (e: Event) => {
  e.preventDefault()
  history.pushState(null, "", path)
  dispatchEvent(new PopStateEvent("popstate"))
}

export function App() {
  const [page, setPage] = useState<Page>(getPageFromPath)
  const [preloadedUrl, setPreloadedUrl] = useState("")

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.value)
  }, [])

  useEffect(() => {
    if (authToken.value && !currentUser.value) {
      fetchMe().then((res) => setAuth(authToken.value, res.user)).catch(() => setAuth(null, null))
    }
  }, [])

  useEffect(() => {
    const handlePop = () => setPage(getPageFromPath())
    addEventListener("popstate", handlePop)
    const params = new URLSearchParams(location.search)
    const urlParam = params.get("url") || ""
    if (page.type === "home" && urlParam) setPreloadedUrl(urlParam)
    return () => removeEventListener("popstate", handlePop)
  }, [])

  // Wider container for home (hero needs space) and analysis (results)
  const wide = page.type === "home" || page.type === "analysis"

  return (
    <div class="min-h-screen flex flex-col">
      <Header />

      <main
        class={`flex-1 mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 ${
          wide ? "max-w-[1180px]" : "max-w-[860px]"
        }`}
      >
        {page.type === "home" && <HomePage preloadedUrl={preloadedUrl} />}
        {page.type === "batch" && <BatchPage />}
        {page.type === "login" && <LoginPage />}
        {page.type === "register" && <RegisterPage />}
        {page.type === "history" && <HistoryPage />}
        {page.type === "settings" && <SettingsPage />}
        {page.type === "sections" && <SectionsPage />}
        {page.type === "analysis" && <AnalysisPage id={page.id} />}
      </main>

      <footer class="border-t border-border/50 mt-auto">
        <div class="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-3">
          <div class="flex items-center gap-2">
            <Icon name="sparkle" size={12} class="text-accent" />
            <span>© {new Date().getFullYear()} OfferLens</span>
            <span class="text-fg-3/50">·</span>
            <span>AI-powered marketing intelligence</span>
          </div>
          <div class="flex items-center gap-4">
            <a href="/" onClick={navTo("/")} class="hover:text-fg transition-colors">Home</a>
            <a href="/batch" onClick={navTo("/batch")} class="hover:text-fg transition-colors">
              Batch
            </a>
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  )
}
