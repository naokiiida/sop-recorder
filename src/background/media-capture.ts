/**
 * Tab media capture orchestration.
 * Uses chrome.tabCapture.getMediaStreamId → offscreen document pattern (MV3).
 */

let offscreenCreated = false

export async function startMediaCapture(tabId: number): Promise<void> {
  // Get a media stream ID for the target tab
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId
  })

  // Ensure offscreen document exists
  if (!offscreenCreated) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.USER_MEDIA as chrome.offscreen.Reason],
      justification: "Recording tab audio and video"
    })
    offscreenCreated = true
  }

  // Tell offscreen document to start recording
  chrome.runtime.sendMessage({
    type: "START_MEDIA_CAPTURE",
    target: "offscreen",
    payload: { streamId }
  })
}

export async function stopMediaCapture(): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    const handler = (message: { type: string; payload?: { data: number[] } }) => {
      if (message.type === "MEDIA_RECORDING_COMPLETE") {
        chrome.runtime.onMessage.removeListener(handler)
        if (message.payload?.data) {
          resolve(new Uint8Array(message.payload.data).buffer)
        } else {
          resolve(null)
        }
      }
    }
    chrome.runtime.onMessage.addListener(handler)

    chrome.runtime.sendMessage({
      type: "STOP_MEDIA_CAPTURE",
      target: "offscreen"
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(handler)
      resolve(null)
    }, 10000)
  })
}

export async function pauseMediaCapture(): Promise<void> {
  chrome.runtime.sendMessage({
    type: "PAUSE_MEDIA_CAPTURE",
    target: "offscreen"
  })
}

export async function resumeMediaCapture(): Promise<void> {
  chrome.runtime.sendMessage({
    type: "RESUME_MEDIA_CAPTURE",
    target: "offscreen"
  })
}

export async function cleanupOffscreen(): Promise<void> {
  if (offscreenCreated) {
    try {
      await chrome.offscreen.closeDocument()
    } catch {
      // May already be closed
    }
    offscreenCreated = false
  }
}
