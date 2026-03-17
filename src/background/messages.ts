/**
 * Message handler definitions for the background service worker.
 */

import type { CaptureEventMessage, SOPStep } from "~lib/types"
import { recordingState } from "./recording-state"
import { captureScreenshot } from "./screenshot"
import { startMediaCapture, stopMediaCapture, pauseMediaCapture, resumeMediaCapture, cleanupOffscreen } from "./media-capture"

/** Handle incoming messages from content scripts and side panel */
export async function handleMessage(
  message: { type: string; payload?: unknown },
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case "START_RECORDING":
      return handleStartRecording(sender)

    case "STOP_RECORDING":
      return handleStopRecording()

    case "PAUSE_RECORDING":
      return handlePauseRecording()

    case "RESUME_RECORDING":
      return handleResumeRecording()

    case "CAPTURE_EVENT":
      return handleCaptureEvent(message as CaptureEventMessage)

    case "UPDATE_STEP":
      return handleUpdateStep(message.payload as { stepId: string; updates: Partial<Pick<SOPStep, "title" | "description">> })

    case "DELETE_STEP":
      return handleDeleteStep(message.payload as { stepId: string })

    case "GET_STATE":
      return {
        status: recordingState.status,
        recording: recordingState.recording
      }

    default:
      return null
  }
}

async function handleStartRecording(sender: chrome.runtime.MessageSender) {
  recordingState.transition("recording")

  // Start tab media capture
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const activeTab = tabs[0]
  if (activeTab?.id) {
    try {
      await startMediaCapture(activeTab.id)
    } catch (err) {
      console.warn("Media capture failed to start:", err)
    }
  }

  broadcastState()
  return { success: true }
}

async function handleStopRecording() {
  recordingState.transition("stopped")

  // Stop media capture and get video data
  try {
    const videoData = await stopMediaCapture()
    if (videoData && recordingState.recording) {
      // Store video as blob URL (will be used during export)
      const blob = new Blob([videoData], { type: "video/webm" })
      recordingState.recording.videoBlobUrl = URL.createObjectURL(blob)
    }
  } catch (err) {
    console.warn("Media capture failed to stop:", err)
  }

  await cleanupOffscreen()
  broadcastState()
  return { success: true, recording: recordingState.recording }
}

async function handlePauseRecording() {
  recordingState.transition("paused")
  await pauseMediaCapture()
  broadcastState()
  return { success: true }
}

async function handleResumeRecording() {
  recordingState.transition("recording")
  await resumeMediaCapture()
  broadcastState()
  return { success: true }
}

async function handleCaptureEvent(message: CaptureEventMessage) {
  if (recordingState.status !== "recording") return null

  const { payload } = message

  // Take screenshot
  let screenshotDataUrl = ""
  try {
    screenshotDataUrl = await captureScreenshot()
  } catch (err) {
    console.warn("Screenshot capture failed:", err)
  }

  const step: SOPStep = {
    id: crypto.randomUUID(),
    order: 0, // Will be set by addStep
    action: payload.action,
    timestamp: payload.timestamp,
    timeSinceStart: 0, // Will be set by addStep
    url: payload.url,
    pageTitle: payload.pageTitle,
    target: payload.target,
    value: payload.value,
    scrollDelta: payload.scrollDelta,
    viewport: payload.viewport,
    devicePixelRatio: payload.devicePixelRatio,
    screenshotDataUrl
  }

  recordingState.addStep(step)

  // Broadcast the new step to the side panel
  chrome.runtime.sendMessage({
    type: "STEP_ADDED",
    payload: step
  }).catch(() => {
    // Side panel may not be open
  })

  return { success: true, step }
}

function handleUpdateStep(payload: { stepId: string; updates: Partial<Pick<SOPStep, "title" | "description">> }) {
  recordingState.updateStep(payload.stepId, payload.updates)
  broadcastState()
  return { success: true }
}

function handleDeleteStep(payload: { stepId: string }) {
  recordingState.deleteStep(payload.stepId)
  broadcastState()
  return { success: true }
}

function broadcastState() {
  chrome.runtime.sendMessage({
    type: "RECORDING_STATE_CHANGED",
    payload: {
      status: recordingState.status,
      recording: recordingState.recording
    }
  }).catch(() => {
    // Side panel may not be open
  })
}
