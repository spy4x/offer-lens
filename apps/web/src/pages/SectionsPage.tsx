// Custom sections management page
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
      const data = await fetchSections()
      setSections(data.sections)
    } catch {
      // silently fail
    }
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
    <section class="max-w-[650px] mx-auto">
      <h1 class="text-2xl font-bold mb-1">Custom Sections</h1>
      <p class="text-sm text-fg-2 mb-6">
        Define custom questions for the AI to answer about each landing page. These appear below
        standard analysis results when selected.
      </p>

      {/* Form */}
      <form onSubmit={handleSave} class="bg-card border border-border rounded-lg p-4 mb-6">
        <h3 class="text-base font-semibold mb-3">
          {editingId ? "Edit Section" : "New Section"}
        </h3>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs text-fg-2 block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              placeholder="e.g., Competitor Analysis"
              required
            />
          </div>
          <div>
            <label class="text-xs text-fg-2 block mb-1">Prompt</label>
            <textarea
              value={prompt}
              onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
              class="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-accent min-h-[80px]"
              placeholder="e.g., What specific competitors are mentioned on this page and how do they compare?"
              required
            />
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              disabled={saving || !title.trim() || !prompt.trim()}
              class="px-4 py-2 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                class="px-4 py-2 bg-input border border-border rounded-lg text-sm hover:bg-border cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* List */}
      {loading
        ? <p class="text-sm text-fg-2">Loading sections...</p>
        : sections.length === 0
        ? (
          <div class="bg-card border border-border rounded-lg p-4 text-sm text-fg-2">
            No custom sections yet. Create one above.
          </div>
        )
        : (
          <div class="flex flex-col gap-2">
            {sections.map((s) => (
              <div
                key={s.id}
                class="bg-card border border-border rounded-lg px-4 py-3"
              >
                <div class="flex items-start justify-between mb-1">
                  <div>
                    <span class="font-medium text-sm">{s.title}</span>
                  </div>
                  <div class="flex gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      class="text-xs px-2 py-1 bg-input border border-border rounded-lg hover:bg-border cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.title)}
                      class="text-xs px-2 py-1 bg-red/10 border border-red/30 text-red rounded-lg hover:bg-red/20 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p class="text-xs text-fg-2">{s.prompt}</p>
              </div>
            ))}
          </div>
        )}
    </section>
  )
}
