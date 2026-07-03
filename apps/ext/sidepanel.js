// OfferLens Side Panel — Main Logic
// Handles URL fetching, API calls, rendering, copy buttons, settings

let state = {
  currentUrl: "",
  backendUrl: "http://localhost:8000",
  apiKey: "",
  useDemoKey: true,
  sessionId: "",
  isAnalyzing: false,
  results: null,
  batchResults: null,
  isBatchMode: false,
  demoUsage: null,
}

// --- Initialization ---

async function init() {
  // Load settings from storage
  const stored = await chrome.storage.local.get([
    "sessionId",
    "backendUrl",
    "apiKey",
    "useDemoKey",
  ])

  state.sessionId = stored.sessionId || crypto.randomUUID()
  state.backendUrl = stored.backendUrl || "http://localhost:8000"
  state.apiKey = stored.apiKey || ""
  state.useDemoKey = stored.useDemoKey !== false

  if (!stored.sessionId) {
    await chrome.storage.local.set({ sessionId: state.sessionId })
  }

  // Get current tab URL
  await getCurrentUrl()

  // Load demo usage
  await loadDemoUsage()

  // Setup UI
  setupEventListeners()
  updateSettingsUI()
  updateDemoCounter()
}

async function getCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_CURRENT_URL" })
      if (response?.url) {
        state.currentUrl = response.url
        document.getElementById("currentUrl").textContent = state.currentUrl
      }
    }
  } catch {
    // Content script might not be injected on chrome:// pages etc.
    document.getElementById("currentUrl").textContent = "Cannot read URL on this page"
    state.currentUrl = ""
  }
}

async function loadDemoUsage() {
  try {
    const res = await fetch(`${state.backendUrl}/api/usage`, {
      headers: { "X-Session-Id": state.sessionId },
    })
    if (res.ok) {
      state.demoUsage = await res.json()
      updateDemoCounter()
    }
  } catch {
    // Backend not reachable
    state.demoUsage = null
  }
}

// --- Event Listeners ---

function setupEventListeners() {
  document.getElementById("analyzeBtn").addEventListener("click", () => analyzeSingle())
  document.getElementById("batchAnalyzeBtn").addEventListener("click", () => analyzeBatch())
  document.getElementById("settingsBtn").addEventListener("click", toggleSettings)
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings)
  document.getElementById("closeSettingsBtn").addEventListener("click", () => toggleSettings(false))
  document.getElementById("singleModeTab").addEventListener("click", () => switchMode(false))
  document.getElementById("batchModeTab").addEventListener("click", () => switchMode(true))
  document.getElementById("retryBtn").addEventListener("click", () => {
    if (state.isBatchMode) analyzeBatch()
    else analyzeSingle()
  })
  document.getElementById("useDemoKeyToggle").addEventListener("change", (e) => {
    state.useDemoKey = e.target.checked
    updateSettingsUI()
  })
}

// --- Mode Switching ---

function switchMode(batch) {
  state.isBatchMode = batch
  document.getElementById("singleMode").classList.toggle("hidden", batch)
  document.getElementById("batchMode").classList.toggle("hidden", !batch)
  document.getElementById("singleModeTab").classList.toggle("active", !batch)
  document.getElementById("batchModeTab").classList.toggle("active", batch)
  document.getElementById("results").classList.add("hidden")
}

// --- Settings ---

function toggleSettings(show) {
  const panel = document.getElementById("settingsPanel")
  if (show === undefined) {
    panel.classList.toggle("hidden")
  } else {
    panel.classList.toggle("hidden", !show)
  }
}

function updateSettingsUI() {
  document.getElementById("apiKeyInput").value = state.apiKey
  document.getElementById("useDemoKeyToggle").checked = state.useDemoKey
  document.getElementById("backendUrlInput").value = state.backendUrl
}

async function saveSettings() {
  state.apiKey = document.getElementById("apiKeyInput").value.trim()
  state.useDemoKey = document.getElementById("useDemoKeyToggle").checked
  state.backendUrl = document.getElementById("backendUrlInput").value.trim()

  await chrome.storage.local.set({
    apiKey: state.apiKey,
    useDemoKey: state.useDemoKey,
    backendUrl: state.backendUrl,
  })

  toggleSettings(false)
  await loadDemoUsage()
}

// --- Analysis ---

async function analyzeSingle() {
  if (state.isAnalyzing) return
  const url = state.currentUrl
  if (!url) {
    showError("No URL available. Navigate to a landing page first.")
    return
  }
  await runAnalysis(url)
}

async function analyzeBatch() {
  if (state.isAnalyzing) return
  const urlsText = document.getElementById("batchUrls").value
  const urls = urlsText.split("\n").map((u) => u.trim()).filter(Boolean)
  if (urls.length === 0) {
    showError("Enter at least one URL.")
    return
  }
  if (urls.length > 50) {
    showError("Maximum 50 URLs allowed.")
    return
  }
  await runBatchAnalysis(urls)
}

async function runAnalysis(url) {
  state.isAnalyzing = true
  showLoading(true)
  hideError()
  hideResults()

  try {
    const body = { url }
    if (!state.useDemoKey && state.apiKey) {
      body.apiKey = state.apiKey
    }

    const res = await fetch(`${state.backendUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": state.sessionId,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    state.results = data.analysis
    state.demoUsage = data.demoUsage || state.demoUsage
    updateDemoCounter()
    renderResults(data.analysis)
  } catch (err) {
    showError(err.message)
  } finally {
    state.isAnalyzing = false
    showLoading(false)
  }
}

async function runBatchAnalysis(urls) {
  state.isAnalyzing = true
  showLoading(true)
  hideError()
  hideResults()

  try {
    const body = { urls }
    if (!state.useDemoKey && state.apiKey) {
      body.apiKey = state.apiKey
    }

    const res = await fetch(`${state.backendUrl}/api/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": state.sessionId,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    state.batchResults = data
    state.demoUsage = data.demoUsage || state.demoUsage
    updateDemoCounter()
    renderBatchResults(data)
  } catch (err) {
    showError(err.message)
  } finally {
    state.isAnalyzing = false
    showLoading(false)
  }
}

// --- UI State Helpers ---

function showLoading(show) {
  document.getElementById("loadingState").classList.toggle("hidden", !show)
}

function hideError() {
  document.getElementById("errorState").classList.add("hidden")
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message
  document.getElementById("errorState").classList.remove("hidden")
}

function hideResults() {
  document.getElementById("results").classList.add("hidden")
}

function updateDemoCounter() {
  const el = document.getElementById("demoCounter")
  if (state.demoUsage) {
    el.textContent = `📊 ${state.demoUsage.used}/${state.demoUsage.limit}`
    el.title = `${state.demoUsage.remaining} demo requests remaining`
  } else {
    el.textContent = "📊 --/50"
  }
  // Highlight if running low
  if (state.demoUsage && state.demoUsage.remaining <= 10 && state.demoUsage.remaining > 0) {
    el.classList.add("warning")
  } else if (state.demoUsage && state.demoUsage.remaining <= 0) {
    el.classList.add("danger")
  } else {
    el.classList.remove("warning", "danger")
  }
}

// --- Render Results ---

function renderResults(analysis) {
  const resultsEl = document.getElementById("results")
  if (!analysis) return

  const primaryAngle = analysis.primaryAngle || {}
  const audience = analysis.targetAudience || {}
  const email = analysis.emailAngle || {}
  const intel = analysis.competitiveIntel || {}

  let html = ""

  // Primary Angle
  html += `
    <section class="section">
      <h2>&#127919; PRIMARY ANGLE</h2>
      <div class="card">
        <div class="angle-header">
          <span class="badge badge-angle">${escapeHtml(primaryAngle.type || "unknown")}</span>
          <span class="confidence">${primaryAngle.confidence ?? 0}% confidence</span>
        </div>
        <p class="text-muted">${escapeHtml(primaryAngle.explanation || "")}</p>
      </div>
    </section>
  `

  // Hook Ideas
  if (analysis.hookIdeas?.length) {
    html += `
      <section class="section">
        <h2>&#128203; HOOK IDEAS <button class="btn btn-small copy-all-btn" data-copy="${
      escapeAttr(analysis.hookIdeas.join("\n"))
    }">Copy All</button></h2>
        <ol class="hook-list">
          ${
      analysis.hookIdeas.map((h, i) => `
            <li class="hook-item">
              <span>${escapeHtml(h)}</span>
              <button class="btn-icon copy-btn" data-copy="${
        escapeAttr(h)
      }" title="Copy">&#128203;</button>
            </li>
          `).join("")
    }
        </ol>
      </section>
    `
  }

  // Target Audience
  html += `
    <section class="section">
      <h2>&#128100; TARGET AUDIENCE</h2>
      <div class="card">
        <p><strong>Demographics:</strong> ${escapeHtml(audience.demographics || "")}</p>
        <p><strong>Interests:</strong> ${escapeHtml(audience.interests || "")}</p>
        <p><strong>Likely Platform:</strong> <span class="badge">${
    escapeHtml(audience.likelyPlatform || "")
  }</span></p>
        <p class="text-muted"><strong>Notes:</strong> ${
    escapeHtml(audience.confidenceNotes || "")
  }</p>
      </div>
    </section>
  `

  // Ad Copy
  html += `
    <section class="section">
      <h2>&#128221; AD COPY</h2>
      <div class="tabs">
        <button class="tab active ad-tab" data-tab="facebook">Facebook</button>
        <button class="tab ad-tab" data-tab="google">Google</button>
        <button class="tab ad-tab" data-tab="native">Native</button>
      </div>
      <div class="tab-content" id="ad-facebook">
        ${renderAdVariants(analysis.adCopy?.facebook || [], "facebook")}
      </div>
      <div class="tab-content hidden" id="ad-google">
        ${renderAdVariants(analysis.adCopy?.google || [], "google")}
      </div>
      <div class="tab-content hidden" id="ad-native">
        ${renderNativeVariants(analysis.adCopy?.native || [])}
      </div>
    </section>
  `

  // Email & SMS
  html += `
    <section class="section">
      <h2>&#128231; EMAIL & SMS ANGLES</h2>
      <div class="card">
        <h4>Subject Lines <button class="btn btn-small copy-all-btn" data-copy="${
    escapeAttr(email.subjectLines?.join("\n") || "")
  }">Copy All</button></h4>
        <ul>
          ${
    (email.subjectLines || []).map((s) => `
            <li class="copy-row"><span>${
      escapeHtml(s)
    }</span><button class="btn-icon copy-btn" data-copy="${escapeAttr(s)}">&#128203;</button></li>
          `).join("")
  }
        </ul>
        <h4>Email Body Angle</h4>
        <p class="text-muted">${escapeHtml(email.bodyAngle || "")}</p>
        <h4>SMS Pitch <button class="btn-icon copy-btn" data-copy="${
    escapeAttr(email.smsAngle || "")
  }">&#128203;</button></h4>
        <p class="sms-pitch">${escapeHtml(email.smsAngle || "")}</p>
      </div>
    </section>
  `

  // Trust Signals
  if (analysis.trustSignals?.length) {
    html += `
      <section class="section">
        <h2>&#128737; TRUST SIGNALS</h2>
        <div class="card">
          ${
      analysis.trustSignals.map((ts) => {
        const icon = ts.present ? "&#9989;" : "&#10060;"
        const strengthClass = ts.strength === "strong"
          ? "green"
          : ts.strength === "medium"
          ? "yellow"
          : "red"
        return `<p>${icon} <strong>${
          escapeHtml(ts.type)
        }</strong> <span class="text-${strengthClass}">(${ts.strength})</span>: ${
          escapeHtml(ts.detail)
        }</p>`
      }).join("")
    }
        </div>
      </section>
    `
  }

  // Conversion Blockers
  if (analysis.conversionBlockers?.length) {
    html += `
      <section class="section">
        <h2>&#9888; CONVERSION BLOCKERS</h2>
        <div class="card">
          ${
      analysis.conversionBlockers.map((b) => {
        const sevIcon = b.severity === "high"
          ? "&#128308;"
          : b.severity === "medium"
          ? "&#128993;"
          : "&#128994;"
        return `<div class="blocker"><p>${sevIcon} <strong>${
          escapeHtml(b.issue)
        }</strong></p><p class="text-muted">Suggestion: ${escapeHtml(b.suggestion)}</p></div>`
      }).join("")
    }
        </div>
      </section>
    `
  }

  // A/B Test Ideas
  if (analysis.abTestIdeas?.length) {
    html += `
      <section class="section">
        <h2>&#128161; A/B TEST IDEAS</h2>
        <ol class="card">
          ${analysis.abTestIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join("")}
        </ol>
      </section>
    `
  }

  // Competitive Intel
  html += `
    <section class="section">
      <h2>&#128373; COMPETITIVE INTEL</h2>
      <div class="card">
        <p><strong>Likely Traffic:</strong> ${
    escapeHtml((intel.likelyTrafficSources || []).join(", "))
  }</p>
        <p><strong>Est. Daily Spend:</strong> <span class="badge">${
    escapeHtml(intel.estimatedDailySpend || "")
  }</span></p>
        <p><strong>Competitors Testing:</strong> ${
    escapeHtml(intel.whatCompetitorsAreLikelyTesting || "")
  }</p>
      </div>
    </section>
  `

  // Competitor Angles
  if (analysis.competitorAngles?.length) {
    html += `
      <section class="section">
        <h2>&#9878; COMPETITOR COUNTER-ANGLES</h2>
        <ul class="card">
          ${analysis.competitorAngles.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
        </ul>
      </section>
    `
  }

  resultsEl.innerHTML = html
  resultsEl.classList.remove("hidden")

  // Setup tab switching
  resultsEl.querySelectorAll(".ad-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab
      resultsEl.querySelectorAll(".ad-tab").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      resultsEl.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"))
      document.getElementById(`ad-${tab}`)?.classList.remove("hidden")
    })
  })

  // Setup copy buttons
  resultsEl.querySelectorAll(".copy-btn, .copy-all-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy
      await navigator.clipboard.writeText(text)
      const original = btn.textContent
      btn.textContent = "Copied!"
      setTimeout(() => {
        btn.textContent = original
      }, 1500)
    })
  })
}

function renderAdVariants(variants, platform) {
  if (!variants.length) return "<p>No variants</p>"
  return variants
    .map(
      (v, i) => `
    <div class="variant">
      <p class="variant-label">Variant ${i + 1}</p>
      <p><strong>Headline:</strong> ${
        escapeHtml(v.headline)
      } <button class="btn-icon copy-btn" data-copy="${
        escapeAttr(v.headline)
      }">&#128203;</button></p>
      <p><strong>Text:</strong> ${
        escapeHtml(v.primaryText)
      } <button class="btn-icon copy-btn" data-copy="${
        escapeAttr(v.primaryText)
      }">&#128203;</button></p>
      <p><strong>CTA:</strong> <span class="badge">${
        escapeHtml(v.cta)
      }</span> <button class="btn-icon copy-btn" data-copy="${
        escapeAttr(v.cta)
      }">&#128203;</button></p>
    </div>
  `,
    )
    .join("")
}

function renderNativeVariants(variants) {
  if (!variants.length) return "<p>No variants</p>"
  return variants
    .map(
      (v, i) => `
    <div class="variant">
      <p class="variant-label">Variant ${i + 1}</p>
      <p><strong>Headline:</strong> ${
        escapeHtml(v.headline)
      } <button class="btn-icon copy-btn" data-copy="${
        escapeAttr(v.headline)
      }">&#128203;</button></p>
      <p><strong>Body:</strong> ${
        escapeHtml(v.body)
      } <button class="btn-icon copy-btn" data-copy="${escapeAttr(v.body)}">&#128203;</button></p>
      <p><strong>CTA:</strong> <span class="badge">${
        escapeHtml(v.cta)
      }</span> <button class="btn-icon copy-btn" data-copy="${
        escapeAttr(v.cta)
      }">&#128203;</button></p>
    </div>
  `,
    )
    .join("")
}

function renderBatchResults(data) {
  const resultsEl = document.getElementById("results")

  let html = "<section class='section'><h2>&#128230; BATCH RESULTS</h2>"

  // Successes
  if (data.results?.length) {
    html += `<p><strong>${data.results.length} analyzed successfully</strong></p>`
    html += `<div class="batch-list">`
    for (const r of data.results) {
      const a = r.analysis
      html += `
        <div class="batch-item">
          <p class="batch-url">${escapeHtml(r.url)}</p>
          <p><span class="badge badge-angle">${
        escapeHtml(a?.primaryAngle?.type || "unknown")
      }</span>
          <span class="confidence">${a?.primaryAngle?.confidence ?? 0}%</span></p>
          <p class="text-muted">${escapeHtml(a?.hookIdeas?.[0] || "")}</p>
        </div>
      `
    }
    html += "</div>"
  }

  // Errors
  if (data.errors?.length) {
    html += `<p><strong class="text-red">${data.errors.length} errors</strong></p>`
    html += `<ul class="error-list">`
    for (const e of data.errors) {
      html += `<li>${escapeHtml(e.url)}: ${escapeHtml(e.error)}</li>`
    }
    html += "</ul>"
  }

  html += "</section>"
  resultsEl.innerHTML = html
  resultsEl.classList.remove("hidden")
}

// --- Helpers ---

function escapeHtml(str) {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttr(str) {
  if (!str) return ""
  return String(str).replace(/"/g, "&quot;").replace(/`/g, "&#96;")
}

// --- Init ---
init()
