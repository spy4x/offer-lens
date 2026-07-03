import { useEffect, useState } from "preact/hooks"
import { Header } from "./components/Header.tsx"
import { HomePage } from "./pages/HomePage.tsx"
import { BatchPage } from "./pages/BatchPage.tsx"
import { ToastContainer } from "./components/Toast.tsx"
import { theme } from "./lib/state.ts"

type Page = "home" | "batch"

function getPageFromPath(): Page {
  const path = location.pathname
  if (path === "/batch") return "batch"
  return "home"
}

export function App() {
  const [page, setPage] = useState<Page>(getPageFromPath)
  const [preloadedUrl, setPreloadedUrl] = useState("")

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.value)
  }, [])

  useEffect(() => {
    const handlePop = () => {
      setPage(getPageFromPath())
    }
    addEventListener("popstate", handlePop)

    // Handle preloaded URL from query param
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
      </main>

      <footer class="mt-10 pt-5 border-t border-border text-center text-xs text-fg-3">
        <span>OfferLens v1.0 &middot; It's Today Media</span>
      </footer>

      <ToastContainer />
    </div>
  )
}
