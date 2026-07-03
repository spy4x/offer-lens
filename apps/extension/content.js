// OfferLens Content Script
// Responds to URL requests from the side panel

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_CURRENT_URL") {
    sendResponse({ url: window.location.href })
  }
  return true
})
