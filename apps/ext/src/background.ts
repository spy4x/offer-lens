// OfferLens Background Service Worker
// Opens side panel when extension icon is clicked

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab): Promise<void> => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Generate session ID on install if not exists
chrome.runtime.onInstalled.addListener(async (): Promise<void> => {
  const { sessionId } = await chrome.storage.local.get("sessionId")
  if (!sessionId) {
    const id = crypto.randomUUID()
    await chrome.storage.local.set({ sessionId: id })
    console.log("OfferLens: Generated session ID", id)
  }
})
