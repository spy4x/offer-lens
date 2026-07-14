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
import { Icon } from "../components/Icon.tsx"

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
    <div class="max-w-[760px] space-y-5 fade-up">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20">
          <Icon name="list" size={18} />
        </span>
        <div>
          <h1 class="text-xl font-bold tracking-tight">Custom sections</h1>
          <p class="text-xs text-fg-3">
            Define custom questions for the AI to answer about each page.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} class="card p-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold tracking-tight">
            {editingId ? "Edit section" : "New section"}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} class="btn-ghost text-xs">
              Cancel
            </button>
          )}
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">Title</label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              class="input"
              placeholder="e.g. Competitor analysis"
              required
            />
          </div>
          <div>
            <label class="label">Prompt</label>
            <textarea
              value={prompt}
              onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
              class="textarea"
              placeholder="e.g. What specific competitors are mentioned on this page?"
              required
            />
          </div>
          <div class="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving || !title.trim() || !prompt.trim()}
              class="btn-primary px-5 py-2.5"
            >
              {saving ? <span class="spinner" /> : (
                <>
                  {editingId ? "Update" : "Create"}
                  <Icon name={editingId ? "check" : "plus"} size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* List */}
      {loading
        ? <div class="text-sm text-fg-3">Loading…</div>
        : sections.length === 0
        ? (
          <div class="card p-10 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-input text-fg-3 mb-3">
              <Icon name="list" size={20} />
            </div>
            <p class="text-sm text-fg-2 mb-1">No sections yet</p>
            <p class="text-xs text-fg-3">Create your first one above.</p>
          </div>
        )
        : (
          <div class="space-y-2">
            {sections.map((s) => (
              <div
                key={s.id}
                class="flex items-start gap-3 px-4 py-3.5 rounded-lg bg-surface-2 border border-border hover:border-border-strong transition-colors"
              >
                <div class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-accent-subtle text-accent shrink-0">
                  <Icon name="sparkle" size={15} />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-fg">{s.title}</p>
                  <p class="text-xs text-fg-3 mt-0.5 line-clamp-2 leading-relaxed">{s.prompt}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    class="btn-ghost text-xs"
                  >
                    <Icon name="edit" size={12} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.title)}
                    class="btn-danger text-xs"
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
