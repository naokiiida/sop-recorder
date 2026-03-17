/**
 * Offscreen document for MediaRecorder (audio+video from tab capture).
 * MV3 requires this pattern since Service Workers cannot access MediaRecorder.
 *
 * Flow:
 * 1. Background sends START_MEDIA_CAPTURE with streamId
 * 2. We get MediaStream via getUserMedia with chromeMediaSource: 'tab'
 * 3. MediaRecorder records chunks
 * 4. On STOP_MEDIA_CAPTURE, we send the complete blob back
 */

let mediaRecorder: MediaRecorder | null = null
let chunks: Blob[] = []
let stream: MediaStream | null = null

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== "offscreen") return false

  switch (message.type) {
    case "START_MEDIA_CAPTURE":
      handleStart(message.payload.streamId)
      sendResponse({ success: true })
      break

    case "STOP_MEDIA_CAPTURE":
      handleStop()
      sendResponse({ success: true })
      break

    case "PAUSE_MEDIA_CAPTURE":
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.pause()
      }
      sendResponse({ success: true })
      break

    case "RESUME_MEDIA_CAPTURE":
      if (mediaRecorder?.state === "paused") {
        mediaRecorder.resume()
      }
      sendResponse({ success: true })
      break
  }

  return false
})

async function handleStart(streamId: string) {
  try {
    // Get media stream from tab capture stream ID
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      } as unknown as MediaTrackConstraints,
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      } as unknown as MediaTrackConstraints
    })

    chunks = []

    // Try VP9+Opus, fallback to VP8+Opus
    const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9,opus")
      ? "video/webm; codecs=vp9,opus"
      : "video/webm; codecs=vp8,opus"

    mediaRecorder = new MediaRecorder(stream, { mimeType })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType })
      const buffer = await blob.arrayBuffer()

      // Send complete recording back to background
      chrome.runtime.sendMessage({
        type: "MEDIA_RECORDING_COMPLETE",
        payload: { data: Array.from(new Uint8Array(buffer)) }
      })

      cleanup()
    }

    // Collect chunks every second
    mediaRecorder.start(1000)

    chrome.runtime.sendMessage({ type: "MEDIA_CAPTURE_READY" })
  } catch (err) {
    console.error("Offscreen: failed to start recording:", err)
    chrome.runtime.sendMessage({
      type: "MEDIA_CAPTURE_ERROR",
      payload: { error: String(err) }
    })
  }
}

function handleStop() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop()
  } else {
    cleanup()
  }
}

function cleanup() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }
  mediaRecorder = null
  chunks = []
}
