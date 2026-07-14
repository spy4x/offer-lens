import { useState } from "preact/hooks"
import { register } from "../lib/api.ts"
import { setAuth, showToast } from "../lib/state.ts"
import { Icon } from "../components/Icon.tsx"

export function RegisterPage() {
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
    if (!email || password.length < 6) return
    setLoading(true)
    setError("")
    try {
      const res = await register(email, password)
      setAuth(res.token, res.user)
      showToast("Account created", "success")
      history.pushState(null, "", "/")
      dispatchEvent(new PopStateEvent("popstate"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="max-w-[420px] mx-auto mt-6 sm:mt-12 fade-up">
      <div class="card p-7 sm:p-9 relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-72 h-72 bg-accent/30 rounded-full blur-3xl opacity-30" />

        <div class="relative">
          <div class="flex justify-center mb-5">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-glow">
              <Icon name="rocket" size={22} />
            </div>
          </div>

          <h1 class="text-2xl font-bold tracking-tight text-center mb-1">
            <span class="text-gradient">Start free</span>
          </h1>
          <p class="text-sm text-fg-2 text-center mb-7">
            Create an account to save and share your analyses
          </p>

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
                placeholder="Min 6 characters"
                required
                minLength={6}
                class="input"
                autoComplete="new-password"
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
              {loading ? <span class="spinner" /> : "Create free account"}
            </button>

            <p class="text-xs text-fg-3 text-center mt-2">
              No credit card required
            </p>
          </form>

          <p class="text-sm text-fg-2 text-center mt-6">
            Already registered?{" "}
            <a
              href="/login"
              onClick={navTo("/login")}
              class="text-accent font-medium hover:text-accent-hover"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
