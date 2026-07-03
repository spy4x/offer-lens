import { useEffect, useState } from "preact/hooks"
import { Header } from "./components/Header.tsx"
import { HomePage } from "./pages/HomePage.tsx"
import { BatchPage } from "./pages/BatchPage.tsx"
import { LoginPage } from "./pages/LoginPage.tsx"
import { RegisterPage } from "./pages/RegisterPage.tsx"
import { HistoryPage } from "./pages/HistoryPage.tsx"
import { SettingsPage } from "./pages/SettingsPage.tsx"
import { SectionsPage } from "./pages/SectionsPage.tsx"
import { ToastContainer } from "./components/Toast.tsx"
import { authToken, currentUser, setAuth, theme } from "./lib/state.ts"
import { fetchMe } from "./lib/api.ts"

type Page = "home" | "batch" | "login" | "register" | "history" | "settings" | "sections"

function getPageFromPath(): Page {
  const path = location.pathname
  if (path === "/batch") return "batch"
  if (path === "/login") return "login"
  if (path === "/register") return "register"
  if (path === "/history") return "history"
  if (path === "/settings") return "settings"
  if (path === "/sections") return "sections"
  return "home"
}

export function App() {
  const [page, setPage] = useState<Page>(getPageFromPath)
  const [preloadedUrl, setPreloadedUrl] = useState("")

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.value)
  }, [])

  // Restore session: if token exists, verify it
  useEffect(() => {
    if (authToken.value && !currentUser.value) {
      fetchMe().then((res) => {
        setAuth(authToken.value, res.user)
      }).catch(() => {
        // Token invalid — clear
        setAuth(null, null)
      })
    }
  }, [])

  useEffect(() => {
    const handlePop = () => {
      setPage(getPageFromPath())
    }
    addEventListener("popstate", handlePop)

    const params = new URLSearchParams(location.search)
    const urlParam = params.get("url") || ""
    if (page === "home" && urlParam) {
      setPreloadedUrl(urlParam)
    }

    return () => removeEventListener("popstate", handlePop)
  }, [])

  return (
    <div class="max-w-[900px] mx-auto px-5 py-4 pb-10">
      <Header />

      <main>
        {page === "home" && <HomePage preloadedUrl={preloadedUrl} />}
        {page === "batch" && <BatchPage />}
        {page === "login" && <LoginPage />}
        {page === "register" && <RegisterPage />}
        {page === "history" && <HistoryPage />}
        {page === "settings" && <SettingsPage />}
        {page === "sections" && <SectionsPage />}
      </main>

      <footer class="mt-10 pt-5 border-t border-border text-center text-xs text-fg-3">
        <span>OfferLens v1.0 &middot; It's Today Media</span>
      </footer>

      <ToastContainer />
    </div>
  )
}
