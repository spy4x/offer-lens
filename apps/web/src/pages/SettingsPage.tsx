// Settings page: BYOK key management, theme toggle
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
  const [testing, setTesting] = useState<string | null>(null) // provider being tested

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    setLoading(true)
    try {
      const data = await fetchKeys()
      setKeys(data.keys)
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  function handleProviderChange(id: string) {
    setProvider(id)
    const p = PROVIDERS.find((x) => x.id === id)
    if (p) {
      setBaseUrl(p.baseUrl)
      // Set default model per provider
      if (id === "openai") setModel("gpt-4o-mini")
      else if (id === "deepseek") setModel("deepseek-chat")
      else setModel("")
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
      showToast(`API key saved for ${provider}`, "success")
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
      showToast(`Key removed for ${prov}`, "success")
      await loadKeys()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete key", "error")
    }
  }

  async function handleTest(prov: string) {
    setTesting(prov)
    try {
      const result = await testKey(prov)
      if (result.success) {
        showToast(`Key works! Model: ${result.model || "unknown"}`, "success")
      } else {
        showToast(result.error || "Test failed", "error")
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Test failed", "error")
    }
    setTesting(null)
  }

  return (
    <section class="max-w-[650px] mx-auto">
      <h1 class="text-2xl font-bold mb-1">Settings</h1>
      <p class="text-sm text-fg-2 mb-6">Manage your API keys and preferences</p>

      {/* Saved keys */}
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Your API Keys</h2>
        <p class="text-xs text-fg-2 mb-4">
          Save your own API key for any OpenAI-compatible provider. When set, your key is used
          automatically — no demo limits apply. Keys are encrypted at rest and never exposed in
          responses.
        </p>

        {loading
          ? <p class="text-sm text-fg-2">Loading keys...</p>
          : keys.length === 0
          ? (
            <div class="bg-card border border-border rounded-lg p-4 text-sm text-fg-2">
              No API keys saved yet. Add one below.
            </div>
          )
          : (
            <div class="flex flex-col gap-2">
              {keys.map((k) => (
                <div
                  key={k.provider}
                  class="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3"
                >
                  <div>
                    <span class="font-medium text-sm">{k.provider}</span>
                    <span class="text-xs text-fg-2 ml-2 font-mono">{k.keyHint}</span>
                    {k.model && <span class="text-xs text-fg-2 ml-2">({k.model})</span>}
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTest(k.provider)}
                      disabled={testing === k.provider}
                      class="text-xs px-2.5 py-1 bg-input border border-border rounded-lg hover:bg-border cursor-pointer disabled:opacity-50"
                    >
                      {testing === k.provider ? "Testing..." : "Test"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.provider)}
                      class="text-xs px-2.5 py-1 bg-red/10 border border-red/30 text-red rounded-lg hover:bg-red/20 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Add new key */}
      <div class="bg-card border border-border rounded-lg p-5">
        <h3 class="text-base font-semibold mb-4">Add API Key</h3>
        <form onSubmit={handleSave} class="flex flex-col gap-3">
          {/* Provider */}
          <div>
            <label class="text-xs text-fg-2 block mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange((e.target as HTMLSelectElement).value)}
              class="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            >
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label class="text-xs text-fg-2 block mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              placeholder="sk-..."
              required
              minLength={8}
            />
          </div>

          {/* Base URL */}
          <div>
            <label class="text-xs text-fg-2 block mb-1">Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onInput={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              placeholder="https://api.openai.com"
            />
          </div>

          {/* Model */}
          <div>
            <label class="text-xs text-fg-2 block mb-1">Model (optional)</label>
            <input
              type="text"
              value={model}
              onInput={(e) => setModel((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              placeholder="gpt-4o-mini"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            class="mt-2 px-5 py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer self-start"
          >
            {saving ? "Saving..." : "Save Key"}
          </button>
        </form>
      </div>
    </section>
  )
}
