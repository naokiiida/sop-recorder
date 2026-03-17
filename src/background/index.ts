/**
 * Background service worker — entry point.
 * Routes messages, manages keepalive, handles tab navigation.
 */

import { handleMessage } from "./messages"
import { recordingState } from "./recording-state"
import { captureScreenshot } from "./screenshot"

// ─── Side Panel: open on toolbar icon click ──────
// Chrome 116+: declarative approach — no onClicked listener needed
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})

// Fallback for older Chrome: explicitly open side panel on icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
  }
})

// ─── Content script filename resolution ──────────
// Plasmo bundles content scripts with hashed filenames (e.g. event-capture.860d17eb.js).
// We read the actual filename from the built manifest at runtime.

let contentScriptFile: string | null = null

async function getContentScriptFile(): Promise<string | null> {
  if (contentScriptFile) return contentScriptFile
  try {
    const manifestUrl = chrome.runtime.getURL("manifest.json")
    const resp = await fetch(manifestUrl)
    const manifest = await resp.json()
    const cs = manifest.content_scripts?.[0]?.js?.[0]
    if (cs) contentScriptFile = cs
    return contentScriptFile
  } catch {
    return null
  }
}

/** Notify a tab's content script about recording state */
async function notifyTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "RECORDING_STATE_CHANGED",
      payload: { status: recordingState.status }
    })
  } catch {
    // Content script not ready — try re-injection
    const file = await getContentScriptFile()
    if (file) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [file]
        })
      } catch {
        // Restricted page (chrome://, etc.)
      }
    }
  }
}

// ─── Message routing ─────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Skip messages targeted at the offscreen document
  if (message.target === "offscreen") return false

  handleMessage(message, sender).then(sendResponse).catch((err) => {
    console.error("Message handler error:", err)
    sendResponse({ error: err.message })
  })

  return true // Keep the message channel open for async response
})

// ─── Service Worker keepalive ────────────────────

chrome.alarms.create("keepalive", { periodInMinutes: 25 / 60 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepalive") {
    // No-op: simply waking the service worker
  }
})

// ─── Tab navigation → re-inject content script ──
// Guard: chrome.webNavigation requires the "webNavigation" permission.
// If the extension was reloaded (not reinstalled) after adding the permission,
// the API may still be undefined. The guard prevents the SW from crashing.

if (chrome.webNavigation) {
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (recordingState.status !== "recording") return
    if (details.frameId !== 0) return // Only main frame

    // Skip chrome:// and other restricted URLs
    if (!details.url.startsWith("http")) return

    await notifyTab(details.tabId)

    // Add a navigate step
    const step = {
      id: crypto.randomUUID(),
      order: 0,
      action: "navigate" as const,
      timestamp: Date.now(),
      timeSinceStart: 0,
      url: details.url,
      pageTitle: "",
      viewport: { width: 0, height: 0 },
      devicePixelRatio: 1,
      screenshotDataUrl: ""
    }

    try {
      recordingState.addStep(step)

      // Try to get page title and screenshot
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]) {
        step.pageTitle = tabs[0].title || ""
      }
      step.screenshotDataUrl = await captureScreenshot()
    } catch {
      // Non-critical
    }

    chrome.runtime.sendMessage({
      type: "STEP_ADDED",
      payload: step
    }).catch(() => {})
  })
} else {
  console.warn("chrome.webNavigation unavailable — remove and reinstall the extension to activate the webNavigation permission")
}

// ─── Tab switch tracking ─────────────────────────

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (recordingState.status !== "recording") return

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (!tab.url?.startsWith("http")) return

    await notifyTab(activeInfo.tabId)

    const screenshot = await captureScreenshot().catch(() => "")

    const step = {
      id: crypto.randomUUID(),
      order: 0,
      action: "tab_switch" as const,
      timestamp: Date.now(),
      timeSinceStart: 0,
      url: tab.url || "",
      pageTitle: tab.title || "",
      viewport: { width: 0, height: 0 },
      devicePixelRatio: 1,
      screenshotDataUrl: screenshot
    }

    recordingState.addStep(step)
    chrome.runtime.sendMessage({
      type: "STEP_ADDED",
      payload: step
    }).catch(() => {})
  } catch {
    // Non-critical
  }
})

// ─── Keyboard shortcut ──────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-recording") {
    if (recordingState.status === "idle") {
      recordingState.transition("recording")
    } else if (recordingState.status === "recording") {
      recordingState.transition("stopped")
    }

    // Notify active tab about the state change
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      await notifyTab(tabs[0].id).catch(() => {})
    }

    chrome.runtime.sendMessage({
      type: "RECORDING_STATE_CHANGED",
      payload: {
        status: recordingState.status,
        recording: recordingState.recording
      }
    }).catch(() => {})
  }
})

export {}
