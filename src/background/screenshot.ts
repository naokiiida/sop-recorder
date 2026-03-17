/**
 * Screenshot capture — waits briefly after an event, then captures the visible tab.
 */

const CAPTURE_DELAY_MS = 200

export async function captureScreenshot(tabId?: number): Promise<string> {
  // Wait for any visual changes to settle
  await new Promise((resolve) => setTimeout(resolve, CAPTURE_DELAY_MS))

  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: "png",
    quality: 85
  })

  return dataUrl
}
