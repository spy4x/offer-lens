// BYOK key management
import { useEffect, useState } from "preact/hooks"
import { deleteKey, fetchKeys, type SavedKey, saveKey, testKey } from "../lib/api.ts"
import { showToast } from "../lib/state.ts"
import { Icon } from "../components/Icon.tsx"

const PROVIDERS = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com" },
  { id: "custom", label: "Custom", baseUrl: "" },
]

export function SettingsPage() {
  const [keys, setKeys] = useState<SavedKey[]>([])
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState("openai")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com")
  const [model, setModel] = useState("")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    setLoading(true)
    try {
      setKeys((await fetchKeys()).keys)
    } catch { /* */ }
    setLoading(false)
  }

  function handleProviderChange(id: string) {
    setProvider(id)
    const p = PROVIDERS.find((x) => x.id === id)
    if (p) {
      setBaseUrl(p.baseUrl)
      setModel(id === "deepseek" ? "deepseek-chat" : id === "openai" ? "gpt-4o-mini" : "")
    }
  }

  async function handleSave(e: Event) {
    e.preventDefault()
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await saveKey({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || undefined,
        model: model.trim() || undefined,
      })
      showToast(`Key saved for ${provider}`, "success")
      setApiKey("")
      await loadKeys()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save key", "error")
    }
    setSaving(false)
  }

  async function handleDelete(prov: string) {
    if (!confirm(`Remove API key for ${prov}?`)) return
    try {
      await deleteKey(prov)
      showToast("Key removed", "success")
      await loadKeys()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error")
    }
  }

  async function handleTest(prov: string) {
    setTesting(prov)
    try {
      const result = await testKey(prov)
      showToast(
        result.success
          ? `Key works · ${result.model || "model unknown"}`
          : result.error || "Test failed",
        result.success ? "success" : "error",
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Test failed", "error")
    }
    setTesting(null)
  }

  return (
    <div class="max-w-[760px] space-y-6 fade-up">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20">
          <Icon name="cog" size={18} />
        </span>
        <div>
          <h1 class="text-xl font-bold tracking-tight">Settings</h1>
          <p class="text-xs text-fg-3">Manage your API keys</p>
        </div>
      </div>

      {/* Saved keys */}
      <section class="card p-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold tracking-tight">Your API keys</h2>
            <p class="text-xs text-fg-3 mt-0.5">
              When a key is saved, it's used automatically — no demo limits. Encrypted at rest.
            </p>
          </div>
        </div>

        {loading
          ? <div class="text-sm text-fg-3">Loading…</div>
          : keys.length === 0
          ? (
            <div class="flex flex-col items-center text-center py-8 px-4 rounded-lg bg-surface-2 border border-dashed border-border">
              <Icon name="key" size={22} class="text-fg-3 mb-2" />
              <p class="text-sm text-fg-2 mb-0.5">No keys saved yet</p>
              <p class="text-xs text-fg-3">Add a key below to bypass demo limits.</p>
            </div>
          )
          : (
            <div class="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.provider}
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg bg-surface-2 border border-border"
                >
                  <div class="flex items-center gap-3 flex-wrap min-w-0">
                    <div class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-accent-subtle text-accent">
                      <Icon name="key" size={14} />
                    </div>
                    <div>
                      <p class="font-semibold text-sm capitalize">{k.provider}</p>
                      <p class="text-xs text-fg-3 font-mono">{k.keyHint}</p>
                    </div>
                    {k.model && (
                      <span class="badge badge-neutral normal-case tracking-normal">
                        {k.model}
                      </span>
                    )}
                    {k.isActive && (
                      <span class="inline-flex items-center gap-1.5 text-xs text-green">
                        <span class="live-dot" />
                        Active
                      </span>
                    )}
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTest(k.provider)}
                      disabled={testing === k.provider}
                      class="btn-secondary text-xs px-3 py-1.5"
                    >
                      {testing === k.provider
                        ? <span class="spinner" style={{ width: 12, height: 12 }} />
                        : (
                          <>
                            <Icon name="zap" size={12} />
                            Test
                          </>
                        )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.provider)}
                      class="btn-danger text-xs px-3 py-1.5"
                    >
                      <Icon name="trash" size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>

      {/* Add key */}
      <section class="card p-5 sm:p-6">
        <h2 class="text-base font-semibold tracking-tight mb-1">Add API key</h2>
        <p class="text-xs text-fg-3 mb-5">
          Keys are encrypted at rest and never logged.
        </p>
        <form onSubmit={handleSave} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange((e.target as HTMLSelectElement).value)}
                class="select"
              >
                {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="label">API key</label>
              <input
                type="password"
                value={apiKey}
                onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                class="input font-mono text-sm"
                placeholder="sk-..."
                required
                minLength={8}
                autoComplete="off"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onInput={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
                class="input font-mono text-sm"
                placeholder="https://api.openai.com"
              />
            </div>
            <div>
              <label class="label">Model</label>
              <input
                type="text"
                value={model}
                onInput={(e) => setModel((e.target as HTMLInputElement).value)}
                class="input font-mono text-sm"
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
          <div class="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              class="btn-primary px-5 py-2.5"
            >
              {saving ? <span class="spinner" /> : (
                <>
                  <Icon name="key" size={14} />
                  Save key
                </>
              )}
            </button>
            <p class="text-xs text-fg-3">
              {apiKey.length > 0 ? `${apiKey.length} chars` : "Paste key to save"}
            </p>
          </div>
        </form>
      </section>
    </div>
  )
}
