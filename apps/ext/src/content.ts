// OfferLens Content Script
// Responds to URL requests from the side panel

interface UrlRequest {
  type: "GET_CURRENT_URL"
}

chrome.runtime.onMessage.addListener((
  message: UrlRequest,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: { url: string }) => void,
): boolean => {
  if (message.type === "GET_CURRENT_URL") {
    // deno-lint-ignore no-window
    sendResponse({ url: window.location.href })
  }
  return true
})
