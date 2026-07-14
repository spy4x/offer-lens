import { useState } from "preact/hooks"
import { login } from "../lib/api.ts"
import { setAuth, showToast } from "../lib/state.ts"
import { Icon } from "../components/Icon.tsx"

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
      showToast("Welcome back", "success")
      history.pushState(null, "", "/")
      dispatchEvent(new PopStateEvent("popstate"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="max-w-[420px] mx-auto mt-6 sm:mt-12 fade-up">
      <div class="card p-7 sm:p-9">
        <div class="flex justify-center mb-5">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-subtle text-accent border border-accent/20">
            <Icon name="user" size={22} />
          </div>
        </div>

        <h1 class="text-2xl font-bold tracking-tight text-center mb-1">Welcome back</h1>
        <p class="text-sm text-fg-2 text-center mb-7">Sign in to access your analyses</p>

        <form onSubmit={handleSubmit} class="flex flex-col gap-4">
          <div>
            <label class="label">Email</label>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="you@example.com"
              required
              class="input"
              autoComplete="email"
            />
          </div>
          <div>
            <label class="label">Password</label>
            <input
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="••••••"
              required
              minLength={6}
              class="input"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div class="flex items-center gap-2 text-sm text-red bg-red-subtle border border-red/30 rounded-md px-3 py-2">
              <Icon name="alert" size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            class="btn-primary w-full py-3 mt-1"
          >
            {loading ? <span class="spinner" /> : "Sign in"}
          </button>
        </form>

        <p class="text-sm text-fg-2 text-center mt-6">
          No account?{" "}
          <a
            href="/register"
            onClick={navTo("/register")}
            class="text-accent font-medium hover:text-accent-hover"
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  )
}
