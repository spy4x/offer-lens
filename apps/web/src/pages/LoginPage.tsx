import { useState } from "preact/hooks"
import { login } from "../lib/api.ts"
import { setAuth, showToast } from "../lib/state.ts"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const navTo = (p: string) => (e: Event) => {
    e.preventDefault()
    history.pushState(null, "", p)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError("")
    try {
      const res = await login(email, password)
      setAuth(res.token, res.user)
      showToast("Welcome back!", "success")
      history.pushState(null, "", "/")
      dispatchEvent(new PopStateEvent("popstate"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="max-w-[420px] mx-auto mt-10 sm:mt-16">
      <div class="glass rounded-2xl p-6 sm:p-8">
        <h1 class="text-2xl font-bold tracking-tight text-center mb-1">Welcome back</h1>
        <p class="text-sm text-fg-2 text-center mb-6">Sign in to access your analyses</p>

        <form onSubmit={handleSubmit} class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-medium text-fg-2 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="you@example.com"
              required
              class="w-full px-4 py-3 bg-input border border-border rounded-xl text-fg text-sm
                focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-fg-2 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="••••••"
              required
              minLength={6}
              class="w-full px-4 py-3 bg-input border border-border rounded-xl text-fg text-sm
                focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && <p class="text-sm text-red text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            class="btn-glow w-full py-3 text-white rounded-xl font-semibold text-sm
              border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p class="text-sm text-fg-2 text-center mt-5">
          No account?{" "}
          <a href="/register" onClick={navTo("/register")} class="text-accent font-medium">
            Create one
          </a>
        </p>
      </div>
    </div>
  )
}
