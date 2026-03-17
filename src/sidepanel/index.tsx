/**
 * Side Panel — main React app for SOP Recorder.
 * Plasmo auto-generates sidepanel.html pointing to this file.
 */

import { useState, useEffect, useCallback } from "react"
import type { SOPRecording, SOPStep, RecordingStatus, AISettings } from "~lib/types"
import { DEFAULT_AI_SETTINGS } from "~lib/types"
import { getAISettings } from "~lib/storage"
import { exportRecording } from "~lib/export-markdown"
import { RecordingControls } from "~components/RecordingControls"
import { StepList } from "~components/StepList"
import { ExportPanel } from "~components/ExportPanel"
import { SettingsPanel } from "~components/SettingsPanel"
import "~styles/sidepanel.css"

function SidePanel() {
  const [status, setStatus] = useState<RecordingStatus>("idle")
  const [recording, setRecording] = useState<SOPRecording | null>(null)
  const [steps, setSteps] = useState<SOPStep[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS)

  // Load initial state
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
      if (response) {
        setStatus(response.status)
        if (response.recording) {
          setRecording(response.recording)
          setSteps(response.recording.steps || [])
        }
      }
    })
    getAISettings().then(setAISettings)
  }, [])

  // Listen for state changes and new steps
  useEffect(() => {
    const handler = (message: { type: string; payload?: unknown }) => {
      if (message.type === "RECORDING_STATE_CHANGED") {
        const payload = message.payload as { status: RecordingStatus; recording?: SOPRecording }
        setStatus(payload.status)
        if (payload.recording) {
          setRecording(payload.recording)
          setSteps(payload.recording.steps || [])
        }
      } else if (message.type === "STEP_ADDED") {
        const step = message.payload as SOPStep
        setSteps((prev) => [...prev, step])
      }
    }

    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const handleStart = useCallback(() => {
    chrome.runtime.sendMessage({ type: "START_RECORDING" })
  }, [])

  const handleStop = useCallback(() => {
    chrome.runtime.sendMessage({ type: "STOP_RECORDING" })
  }, [])

  const handlePause = useCallback(() => {
    chrome.runtime.sendMessage({ type: "PAUSE_RECORDING" })
  }, [])

  const handleResume = useCallback(() => {
    chrome.runtime.sendMessage({ type: "RESUME_RECORDING" })
  }, [])

  const handleUpdateStep = useCallback((stepId: string, updates: Partial<Pick<SOPStep, "title" | "description">>) => {
    chrome.runtime.sendMessage({ type: "UPDATE_STEP", payload: { stepId, updates } })
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    )
  }, [])

  const handleDeleteStep = useCallback((stepId: string) => {
    chrome.runtime.sendMessage({ type: "DELETE_STEP", payload: { stepId } })
    setSteps((prev) => prev.filter((s) => s.id !== stepId))
  }, [])

  const handleExport = useCallback(async () => {
    if (!recording) return
    setIsExporting(true)
    try {
      await exportRecording({ ...recording, steps })
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }, [recording, steps])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h1 className="text-base font-bold">SOP Recorder</h1>
      </div>

      {/* Controls */}
      <RecordingControls
        status={status}
        onStart={handleStart}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
      />

      {/* Steps */}
      <div className="flex-1 overflow-y-auto">
        <StepList
          steps={steps}
          onUpdateStep={handleUpdateStep}
          onDeleteStep={handleDeleteStep}
        />
      </div>

      {/* Export */}
      <ExportPanel
        recording={recording ? { ...recording, steps } : null}
        onExport={handleExport}
        isExporting={isExporting}
        aiEnabled={aiSettings.enabled}
      />

      {/* Settings */}
      <SettingsPanel onSettingsChange={setAISettings} />
    </div>
  )
}

export default SidePanel
