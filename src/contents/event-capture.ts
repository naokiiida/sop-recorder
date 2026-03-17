/**
 * Content script: captures user interactions (click, type, scroll)
 * and sends them to the background service worker.
 *
 * Plasmo content script — auto-injected into web pages.
 */

import type { PlasmoCSConfig } from "plasmo"
import { extractTargetInfo } from "~lib/element-info"
import { debounce } from "~lib/debounce"
import type { ActionType, CaptureEventMessage } from "~lib/types"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
}

let isRecording = false

// Track recent clicks to deduplicate (same element within 500ms)
let lastClickTarget: Element | null = null
let lastClickTime = 0
const CLICK_DEDUP_MS = 500

// Track drag detection
let mouseDownPos: { x: number; y: number } | null = null
const DRAG_THRESHOLD_PX = 50

// ─── Listen for recording state changes ──────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "RECORDING_STATE_CHANGED") {
    isRecording = message.payload.status === "recording"
  }
})

// Initialize: ask background for current state
chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
  if (response?.status) {
    isRecording = response.status === "recording"
  }
})

// ─── Event helpers ───────────────────────────────

function buildEventPayload(action: ActionType, el?: Element | null): CaptureEventMessage {
  return {
    type: "CAPTURE_EVENT",
    payload: {
      action,
      url: window.location.href,
      pageTitle: document.title,
      target: el ? extractTargetInfo(el) : undefined,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      timestamp: Date.now()
    }
  }
}

function sendEvent(message: CaptureEventMessage) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Extension context may have been invalidated
  })
}

// ─── Click capture (capture phase, isTrusted only) ──

document.addEventListener(
  "mousedown",
  (e) => {
    if (!isRecording || !e.isTrusted) return
    mouseDownPos = { x: e.clientX, y: e.clientY }
  },
  true
)

document.addEventListener(
  "mouseup",
  (e) => {
    if (!isRecording || !e.isTrusted || !mouseDownPos) return

    const target = e.target as Element
    if (!target) return

    // Check for drag (skip if dragged more than threshold)
    const dx = e.clientX - mouseDownPos.x
    const dy = e.clientY - mouseDownPos.y
    mouseDownPos = null
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) return

    // Deduplicate clicks on same element within 500ms
    if (target === lastClickTarget && Date.now() - lastClickTime < CLICK_DEDUP_MS) {
      return
    }
    lastClickTarget = target
    lastClickTime = Date.now()

    const message = buildEventPayload("click", target)
    sendEvent(message)
  },
  true
)

// ─── Input/type capture ─────────────────────────

const handleInput = debounce((e: Event) => {
  if (!isRecording) return
  const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  if (!target) return

  // NEVER capture password values
  if (target instanceof HTMLInputElement && target.type === "password") {
    const message = buildEventPayload("type", target)
    message.payload.value = "••••••••"
    sendEvent(message)
    return
  }

  const message = buildEventPayload("type", target)
  message.payload.value = target.value
  sendEvent(message)
}, 500)

document.addEventListener("input", handleInput, true)

// Also capture on blur for final value
document.addEventListener(
  "blur",
  (e) => {
    if (!isRecording || !e.isTrusted) return
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    if (!target || !("value" in target)) return

    handleInput.cancel()

    if (target instanceof HTMLInputElement && target.type === "password") {
      const message = buildEventPayload("type", target)
      message.payload.value = "••••••••"
      sendEvent(message)
      return
    }

    const message = buildEventPayload("type", target)
    message.payload.value = target.value
    sendEvent(message)
  },
  true
)

// ─── Scroll capture (debounced) ──────────────────

const handleScroll = debounce(() => {
  if (!isRecording) return

  const message = buildEventPayload("scroll")
  message.payload.scrollDelta = {
    x: window.scrollX,
    y: window.scrollY
  }
  sendEvent(message)
}, 500)

window.addEventListener("scroll", handleScroll, { passive: true, capture: true })
