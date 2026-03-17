/**
 * Typed wrappers around chrome.storage.local for SOPRecording and AISettings.
 */

import type { SOPRecording, AISettings } from "./types"
import { DEFAULT_AI_SETTINGS } from "./types"

const KEYS = {
  CURRENT_RECORDING: "sop_current_recording",
  RECORDINGS: "sop_recordings",
  AI_SETTINGS: "sop_ai_settings"
} as const

export async function getCurrentRecording(): Promise<SOPRecording | null> {
  const result = await chrome.storage.local.get(KEYS.CURRENT_RECORDING)
  return result[KEYS.CURRENT_RECORDING] ?? null
}

export async function setCurrentRecording(
  recording: SOPRecording | null
): Promise<void> {
  if (recording === null) {
    await chrome.storage.local.remove(KEYS.CURRENT_RECORDING)
  } else {
    await chrome.storage.local.set({ [KEYS.CURRENT_RECORDING]: recording })
  }
}

export async function getAISettings(): Promise<AISettings> {
  const result = await chrome.storage.local.get(KEYS.AI_SETTINGS)
  return result[KEYS.AI_SETTINGS] ?? { ...DEFAULT_AI_SETTINGS }
}

export async function setAISettings(settings: AISettings): Promise<void> {
  await chrome.storage.local.set({ [KEYS.AI_SETTINGS]: settings })
}
