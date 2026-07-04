// Settings page: BYOK key management
import { useEffect, useState } from "preact/hooks"
import { deleteKey, fetchKeys, type SavedKey, saveKey, testKey } from "../lib/api.ts"
import { showToast } from "../lib/state.ts"

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
      showToast(`Key removed`, "success")
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
          ? `Key works! Model: ${result.model || "unknown"}`
          : result.error || "Test failed",
        result.success ? "success" : "error",
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Test failed", "error")
    }
    setTesting(null)
  }

  return (
    <div class="max-w-[700px]">
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
        <p class="text-sm text-fg-2 mt-1">Manage your API keys</p>
      </div>

      {/* Saved keys */}
      <div class="mb-8">
        <h2 class="text-base font-semibold mb-2">Your API Keys</h2>
        <p class="text-xs text-fg-2 mb-4 leading-relaxed">
          When a key is saved, it's used automatically — no demo limits. Keys are encrypted at rest.
        </p>

        {loading
          ? <p class="text-sm text-fg-2">Loading...</p>
          : keys.length === 0
          ? <div class="glass rounded-xl p-4 text-sm text-fg-2">No keys saved yet.</div>
          : (
            <div class="flex flex-col gap-2">
              {keys.map((k) => (
                <div
                  key={k.provider}
                  class="glass rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-sm capitalize">{k.provider}</span>
                    <span class="text-xs text-fg-2 font-mono">{k.keyHint}</span>
                    {k.model && (
                      <span class="text-xs bg-input/50 px-2 py-0.5 rounded-full">{k.model}</span>
                    )}
                    {k.isActive && <span class="w-1.5 h-1.5 rounded-full bg-green inline-block" />}
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTest(k.provider)}
                      disabled={testing === k.provider}
                      class="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-input/50
                        cursor-pointer disabled:opacity-50 bg-transparent transition-colors"
                    >
                      {testing === k.provider ? "Testing..." : "Test"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.provider)}
                      class="text-xs px-3 py-1.5 rounded-lg border border-red/30 text-red
                        hover:bg-red/10 cursor-pointer bg-transparent transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Add key */}
      <div class="glass rounded-2xl p-5 sm:p-6">
        <h3 class="text-base font-semibold mb-4">Add API Key</h3>
        <form onSubmit={handleSave} class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="text-xs font-medium text-fg-2 mb-1 block">Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange((e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm
                  focus:outline-none focus:border-accent transition-colors"
              >
                {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-medium text-fg-2 mb-1 block">API Key</label>
              <input
                type="password"
                value={apiKey}
                onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                class="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm
                  focus:outline-none focus:border-accent transition-colors"
                placeholder="sk-..."
                required
                minLength={8}
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-fg-2 mb-1 block">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onInput={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
                class="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm
                  focus:outline-none focus:border-accent transition-colors"
                placeholder="https://api.openai.com"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-fg-2 mb-1 block">Model</label>
              <input
                type="text"
                value={model}
                onInput={(e) => setModel((e.target as HTMLInputElement).value)}
                class="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm
                  focus:outline-none focus:border-accent transition-colors"
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            class="btn-glow px-6 py-2.5 text-white rounded-xl font-semibold text-sm
              border-none cursor-pointer self-start disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {saving ? "Saving..." : "Save Key"}
          </button>
        </form>
      </div>
    </div>
  )
}
