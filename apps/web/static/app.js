// OfferLens Web App — Client-side logic
// Handles: form submission, API calls, rendering, copy buttons, demo counter

document.addEventListener("DOMContentLoaded", () => {
  loadDemoUsage()
  setupForms()
  setupAutoAnalyze()
})

// --- Demo Counter ---

async function loadDemoUsage() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/usage`, {
      headers: { "X-Session-Id": SESSION_ID },
    })
    if (res.ok) {
      const usage = await res.json()
      updateDemoCounter(usage)
    }
  } catch { /* backend not available */ }
}

function updateDemoCounter(usage) {
  const el = document.getElementById("demoCounter")
  if (!el) return
  if (usage && typeof usage.used === "number") {
    el.textContent = `📊 ${usage.used}/${usage.limit}`
    el.title = `${usage.remaining} demo requests remaining`
    el.classList.remove("warning", "danger")
    if (usage.remaining <= 10 && usage.remaining > 0) el.classList.add("warning")
    if (usage.remaining <= 0) el.classList.add("danger")
  }
}

// --- Form Setup ---

function setupForms() {
  const form = document.getElementById("analyzeForm")
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const url = document.getElementById("urlInput").value.trim()
      if (!url) return
      await analyzeSingle(url)
    })
  }

  const batchBtn = document.getElementById("batchAnalyzeBtn")
  if (batchBtn) {
    batchBtn.addEventListener("click", async () => {
      const text = document.getElementById("batchUrls").value
      const urls = text.split("\n").map((u) => u.trim()).filter(Boolean)
      if (urls.length === 0) {
        showError("Enter at least one URL.")
        return
      }
      if (urls.length > 50) {
        showError("Maximum 50 URLs allowed.")
        return
      }
      await analyzeBatch(urls)
    })
  }
}

// --- Auto-analyze from URL param ---

function setupAutoAnalyze() {
  if (typeof PRELOADED_URL !== "undefined" && PRELOADED_URL) {
    analyzeSingle(PRELOADED_URL)
  }
}

// --- API Calls ---

async function analyzeSingle(url) {
  showLoading(true)
  hideError()
  hideResults()

  try {
    const body = { url }
    const apiKey = getApiKey()
    if (apiKey) body.apiKey = apiKey

    const res = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": SESSION_ID,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    if (data.demoUsage) updateDemoCounter(data.demoUsage)
    renderResults(data.analysis)
  } catch (err) {
    showError(err.message)
  } finally {
    showLoading(false)
  }
}

async function analyzeBatch(urls) {
  showLoading(true)
  hideError()
  hideResults()

  try {
    const body = { urls }
    const apiKey = getApiKey()
    if (apiKey) body.apiKey = apiKey

    const res = await fetch(`${BACKEND_URL}/api/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": SESSION_ID,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    if (data.demoUsage) updateDemoCounter(data.demoUsage)
    renderBatchResults(data)
  } catch (err) {
    showError(err.message)
  } finally {
    showLoading(false)
  }
}

function getApiKey() {
  try {
    return localStorage.getItem("ol_apiKey") || ""
  } catch {
    return ""
  }
}

// --- UI State ---

function showLoading(show) {
  const el = document.getElementById("loadingState")
  if (el) el.classList.toggle("hidden", !show)
}

function hideError() {
  const el = document.getElementById("errorState")
  if (el) el.classList.add("hidden")
}

function showError(msg) {
  const el = document.getElementById("errorState")
  const msgEl = document.getElementById("errorMessage")
  if (el) el.classList.remove("hidden")
  if (msgEl) msgEl.textContent = msg
}

function hideResults() {
  const el = document.getElementById("results")
  if (el) el.classList.add("hidden")
}

// --- Render Results (same as extension, adapted) ---

function renderResults(analysis) {
  const resultsEl = document.getElementById("results")
  if (!resultsEl || !analysis) return

  const pa = analysis.primaryAngle || {}
  const aud = analysis.targetAudience || {}
  const email = analysis.emailAngle || {}
  const intel = analysis.competitiveIntel || {}

  let html = ""

  // Primary Angle
  html += `<section class="mb-6">
    <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#127919; PRIMARY ANGLE</h2>
    <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
      <div class="flex items-center gap-2.5 mb-2">
        <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold uppercase text-sm">${
    esc(pa.type || "unknown")
  }</span>
        <span class="text-sm text-green font-semibold">${pa.confidence ?? 0}% confidence</span>
      </div>
      <p class="text-xs text-fg-3">${esc(pa.explanation || "")}</p>
    </div>
  </section>`

  // Hook Ideas
  if (analysis.hookIdeas?.length) {
    html += `<section class="mb-6">
      <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128203; HOOK IDEAS <button class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover border-none cursor-pointer copy-all-btn" data-copy="${
      escAttr(analysis.hookIdeas.join("\n"))
    }">Copy All</button></h2>
      <ol class="list-decimal pl-6">
        ${
      analysis.hookIdeas.map((h, i) => `
          <li class="flex justify-between items-start py-1.5 gap-2.5 text-sm">
            <span>${esc(h)}</span>
            <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
        escAttr(h)
      }" title="Copy">&#128203;</button>
          </li>
        `).join("")
    }
      </ol>
    </section>`
  }

  // Target Audience
  html += `<section class="mb-6">
    <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128100; TARGET AUDIENCE</h2>
    <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
      <p><strong>Demographics:</strong> ${esc(aud.demographics || "")}</p>
      <p><strong>Interests:</strong> ${esc(aud.interests || "")}</p>
      <p><strong>Likely Platform:</strong> <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">${
    esc(aud.likelyPlatform || "")
  }</span></p>
      <p class="text-xs text-fg-3"><strong>Notes:</strong> ${esc(aud.confidenceNotes || "")}</p>
    </div>
  </section>`

  // Ad Copy
  html += `<section class="mb-6">
    <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128221; AD COPY</h2>
    <div class="flex gap-0.5 mb-2.5">
      <button class="flex-1 py-2 px-3 bg-accent text-white border border-accent cursor-pointer text-xs text-center rounded-lg ad-tab" data-tab="facebook">Facebook</button>
      <button class="flex-1 py-2 px-3 bg-input border border-border text-fg-2 cursor-pointer text-xs text-center rounded-lg ad-tab" data-tab="google">Google</button>
      <button class="flex-1 py-2 px-3 bg-input border border-border text-fg-2 cursor-pointer text-xs text-center rounded-lg ad-tab" data-tab="native">Native</button>
    </div>
    <div class="" id="ad-facebook">${renderAdVariants(analysis.adCopy?.facebook || [])}</div>
    <div class="hidden" id="ad-google">${renderAdVariants(analysis.adCopy?.google || [])}</div>
    <div class="hidden" id="ad-native">${renderNativeVariants(analysis.adCopy?.native || [])}</div>
  </section>`

  // Email & SMS
  html += `<section class="mb-6">
    <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128231; EMAIL & SMS ANGLES</h2>
    <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
      <h4>Subject Lines <button class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover border-none cursor-pointer copy-all-btn" data-copy="${
    escAttr((email.subjectLines || []).join("\n"))
  }">Copy All</button></h4>
      <ul>
        ${
    (email.subjectLines || []).map((s) => `
          <li class="flex justify-between items-start gap-2.5"><span>${
      esc(s)
    }</span><button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
      escAttr(s)
    }">&#128203;</button></li>
        `).join("")
  }
      </ul>
      <h4>Email Body Angle</h4>
      <p class="text-xs text-fg-3">${esc(email.bodyAngle || "")}</p>
      <h4>SMS Pitch <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(email.smsAngle || "")
  }">&#128203;</button></h4>
      <p class="bg-input border-l-4 border-accent px-3 py-2.5 rounded text-sm">${
    esc(email.smsAngle || "")
  }</p>
    </div>
  </section>`

  // Trust Signals
  if (analysis.trustSignals?.length) {
    html += `<section class="mb-6">
      <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128737; TRUST SIGNALS</h2>
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        ${
      analysis.trustSignals.map((ts) => {
        const icon = ts.present ? "&#9989;" : "&#10060;"
        const sc = ts.strength === "strong"
          ? "text-green"
          : ts.strength === "medium"
          ? "text-yellow"
          : "text-red"
        return `<p>${icon} <strong>${
          esc(ts.type)
        }</strong> <span class="${sc}">(${ts.strength})</span>: ${esc(ts.detail)}</p>`
      }).join("")
    }
      </div>
    </section>`
  }

  // Conversion Blockers
  if (analysis.conversionBlockers?.length) {
    html += `<section class="mb-6">
      <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#9888; CONVERSION BLOCKERS</h2>
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        ${
      analysis.conversionBlockers.map((b) => {
        const sev = b.severity === "high"
          ? "&#128308;"
          : b.severity === "medium"
          ? "&#128993;"
          : "&#128994;"
        return `<div class="mb-2.5"><p>${sev} <strong>${
          esc(b.issue)
        }</strong></p><p class="text-xs text-fg-3">Suggestion: ${esc(b.suggestion)}</p></div>`
      }).join("")
    }
      </div>
    </section>`
  }

  // A/B Tests
  if (analysis.abTestIdeas?.length) {
    html += `<section class="mb-6">
      <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128161; A/B TEST IDEAS</h2>
      <ol class="bg-card border border-border rounded-lg px-4.5 py-3.5">${
      analysis.abTestIdeas.map((i) => `<li>${esc(i)}</li>`).join("")
    }</ol>
    </section>`
  }

  // Competitive Intel
  html += `<section class="mb-6">
    <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128373; COMPETITIVE INTEL</h2>
    <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
      <p><strong>Likely Traffic:</strong> ${esc((intel.likelyTrafficSources || []).join(", "))}</p>
      <p><strong>Est. Daily Spend:</strong> <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">${
    esc(intel.estimatedDailySpend || "")
  }</span></p>
      <p><strong>Competitors Testing:</strong> ${
    esc(intel.whatCompetitorsAreLikelyTesting || "")
  }</p>
    </div>
  </section>`

  // Competitor Angles
  if (analysis.competitorAngles?.length) {
    html += `<section class="mb-6">
      <h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#9878; COMPETITOR COUNTER-ANGLES</h2>
      <ul class="bg-card border border-border rounded-lg px-4.5 py-3.5">${
      analysis.competitorAngles.map((a) => `<li>${esc(a)}</li>`).join("")
    }</ul>
    </section>`
  }

  resultsEl.innerHTML = html
  resultsEl.classList.remove("hidden")

  // Tab switching
  resultsEl.querySelectorAll(".ad-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab
      resultsEl.querySelectorAll(".ad-tab").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      resultsEl.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"))
      document.getElementById(`ad-${tab}`)?.classList.remove("hidden")
    })
  })

  // Copy buttons
  resultsEl.querySelectorAll(".copy-btn, .copy-all-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        fallbackCopy(text)
      }
      const orig = btn.textContent
      btn.textContent = "Copied!"
      setTimeout(() => {
        btn.textContent = orig
      }, 1500)
    })
  })

  resultsEl.scrollIntoView({ behavior: "smooth" })
}

function renderAdVariants(variants) {
  if (!variants.length) return "<p>No variants</p>"
  return variants.map((v, i) => `
    <div class="bg-input rounded px-3 py-2.5 mb-2">
      <p class="text-xs text-accent-hover mb-1.5 font-semibold">Variant ${i + 1}</p>
      <p><strong>Headline:</strong> ${
    esc(v.headline)
  } <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(v.headline)
  }">&#128203;</button></p>
      <p><strong>Text:</strong> ${
    esc(v.primaryText)
  } <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(v.primaryText)
  }">&#128203;</button></p>
      <p><strong>CTA:</strong> <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">${
    esc(v.cta)
  }</span> <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(v.cta)
  }">&#128203;</button></p>
    </div>
  `).join("")
}

function renderNativeVariants(variants) {
  if (!variants.length) return "<p>No variants</p>"
  return variants.map((v, i) => `
    <div class="bg-input rounded px-3 py-2.5 mb-2">
      <p class="text-xs text-accent-hover mb-1.5 font-semibold">Variant ${i + 1}</p>
      <p><strong>Headline:</strong> ${
    esc(v.headline)
  } <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(v.headline)
  }">&#128203;</button></p>
      <p><strong>Body:</strong> ${
    esc(v.body)
  } <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(v.body)
  }">&#128203;</button></p>
      <p><strong>CTA:</strong> <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">${
    esc(v.cta)
  }</span> <button class="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-sm text-fg-2 rounded hover:bg-input hover:text-fg copy-btn" data-copy="${
    escAttr(v.cta)
  }">&#128203;</button></p>
    </div>
  `).join("")
}

function renderBatchResults(data) {
  const resultsEl = document.getElementById("results")
  if (!resultsEl) return

  let html =
    `<section class="mb-6"><h2 class="text-lg mb-2.5 text-accent flex items-center justify-between">&#128230; BATCH RESULTS</h2>`

  if (data.results?.length) {
    html += `<p><strong>${data.results.length} analyzed successfully</strong></p>`
    html +=
      `<table class="batch-table"><thead><tr><th>URL</th><th>Angle</th><th>Confidence</th><th>Top Hook</th><th>Top Blocker</th></tr></thead><tbody>`
    for (const r of data.results) {
      const a = r.analysis
      html += `<tr>
        <td class="text-xs break-all text-accent-hover">${esc(r.url)}</td>
        <td><span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold uppercase text-sm">${
        esc(a?.primaryAngle?.type || "?")
      }</span></td>
        <td><span class="text-sm text-green font-semibold">${
        a?.primaryAngle?.confidence ?? 0
      }%</span></td>
        <td class="text-xs text-fg-3">${esc(a?.hookIdeas?.[0] || "")}</td>
        <td>${esc(a?.conversionBlockers?.[0]?.issue || "")}</td>
      </tr>`
    }
    html += `</tbody></table>`
  }

  if (data.errors?.length) {
    html += `<p><strong class="text-red">${data.errors.length} errors</strong></p>`
    html += `<ul class="pl-5 mt-2.5">${
      data.errors.map((e) => `<li>${esc(e.url)}: ${esc(e.error)}</li>`).join("")
    }</ul>`
  }

  html += `</section>`
  resultsEl.innerHTML = html
  resultsEl.classList.remove("hidden")
  resultsEl.scrollIntoView({ behavior: "smooth" })
}

// --- Helpers ---

function esc(str) {
  if (!str) return ""
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
    /"/g,
    "&quot;",
  )
}

function escAttr(str) {
  if (!str) return ""
  return String(str).replace(/"/g, "&quot;").replace(/`/g, "&#96;")
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea")
  ta.value = text
  ta.style.position = "fixed"
  ta.style.left = "-9999px"
  document.body.appendChild(ta)
  ta.select()
  document.execCommand("copy")
  document.body.removeChild(ta)
}
