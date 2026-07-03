import { useState } from "preact/hooks"
import { register } from "../lib/api.ts"
import { setAuth, showToast } from "../lib/state.ts"

export function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!email || password.length < 6) return
    setLoading(true)
    setError("")

    try {
      const res = await register(email, password)
      setAuth(res.token, res.user)
      showToast("Account created!", "success")
      history.pushState(null, "", "/")
      dispatchEvent(new PopStateEvent("popstate"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section class="max-w-[400px] mx-auto mt-10">
      <h1 class="text-2xl text-center mb-6">Create Account</h1>

      <form onSubmit={handleSubmit} class="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="Email"
          required
          class="w-full px-4 py-3 bg-input border border-border rounded-lg text-fg focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          placeholder="Password (min 6 chars)"
          required
          minLength={6}
          class="w-full px-4 py-3 bg-input border border-border rounded-lg text-fg focus:outline-none focus:border-accent"
        />

        {error && <p class="text-sm text-red text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          class="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 border-none cursor-pointer"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p class="text-sm text-fg-2 text-center mt-4">
        Already have an account?{" "}
        <a
          href="/login"
          class="text-accent"
          onClick={(e) => {
            e.preventDefault()
            history.pushState(null, "", "/login")
            dispatchEvent(new PopStateEvent("popstate"))
          }}
        >
          Login
        </a>
      </p>
    </section>
  )
}
