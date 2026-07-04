// Custom sections management
import { useEffect, useState } from "preact/hooks"
import {
  createSection,
  type CustomSection,
  deleteSection,
  fetchSections,
  updateSection,
} from "../lib/api.ts"
import { showToast } from "../lib/state.ts"

export function SectionsPage() {
  const [sections, setSections] = useState<CustomSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSections()
  }, [])

  async function loadSections() {
    setLoading(true)
    try {
      setSections((await fetchSections()).sections)
    } catch { /* */ }
    setLoading(false)
  }

  function resetForm() {
    setEditingId(null)
    setTitle("")
    setPrompt("")
  }

  function startEdit(s: CustomSection) {
    setEditingId(s.id)
    setTitle(s.title)
    setPrompt(s.prompt)
  }

  async function handleSave(e: Event) {
    e.preventDefault()
    if (!title.trim() || !prompt.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateSection(editingId, { title: title.trim(), prompt: prompt.trim() })
        showToast("Section updated", "success")
      } else {
        await createSection({ title: title.trim(), prompt: prompt.trim() })
        showToast("Section created", "success")
      }
      resetForm()
      await loadSections()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error")
    }
    setSaving(false)
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete section "${title}"?`)) return
    try {
      await deleteSection(id)
      showToast("Section deleted", "success")
      await loadSections()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error")
    }
  }

  return (
    <div class="max-w-[700px]">
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Custom Sections</h1>
        <p class="text-sm text-fg-2 mt-1">
          Define custom questions for the AI to answer about each landing page.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} class="glass rounded-2xl p-5 sm:p-6 mb-5">
        <h3 class="text-base font-semibold mb-3">{editingId ? "Edit" : "New"} Section</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs font-medium text-fg-2 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm
                focus:outline-none focus:border-accent transition-colors"
              placeholder="e.g., Competitor Analysis"
              required
            />
          </div>
          <div>
            <label class="text-xs font-medium text-fg-2 mb-1 block">Prompt</label>
            <textarea
              value={prompt}
              onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
              class="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm
                focus:outline-none focus:border-accent transition-colors min-h-[90px] resize-vertical"
              placeholder="e.g., What specific competitors are mentioned on this page?"
              required
            />
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              disabled={saving || !title.trim() || !prompt.trim()}
              class="btn-glow px-4 py-2 text-white rounded-xl font-semibold text-sm
                border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                class="px-4 py-2 rounded-xl border border-border text-sm hover:bg-input/50
                  cursor-pointer bg-transparent transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* List */}
      {loading
        ? <p class="text-sm text-fg-2">Loading...</p>
        : sections.length === 0
        ? <div class="glass rounded-xl p-4 text-sm text-fg-2">No sections yet.</div>
        : (
          <div class="flex flex-col gap-2">
            {sections.map((s) => (
              <div
                key={s.id}
                class="glass rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm">{s.title}</p>
                  <p class="text-xs text-fg-2 mt-0.5 line-clamp-2">{s.prompt}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    class="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-input/50
                      cursor-pointer bg-transparent transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.title)}
                    class="text-xs px-3 py-1.5 rounded-lg border border-red/30 text-red
                      hover:bg-red/10 cursor-pointer bg-transparent transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
