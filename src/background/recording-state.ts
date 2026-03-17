/**
 * Recording state machine: idle → recording ⇄ paused → stopped → idle
 */

import type { RecordingStatus, SOPRecording, SOPStep } from "~lib/types"

type TransitionMap = Record<RecordingStatus, RecordingStatus[]>

const VALID_TRANSITIONS: TransitionMap = {
  idle: ["recording"],
  recording: ["paused", "stopped"],
  paused: ["recording", "stopped"],
  stopped: ["idle"]
}

export class RecordingStateMachine {
  private _status: RecordingStatus = "idle"
  private _recording: SOPRecording | null = null
  private _listeners: Array<(status: RecordingStatus, recording: SOPRecording | null) => void> = []

  get status(): RecordingStatus {
    return this._status
  }

  get recording(): SOPRecording | null {
    return this._recording
  }

  /** Subscribe to state changes */
  onChange(listener: (status: RecordingStatus, recording: SOPRecording | null) => void): () => void {
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener)
    }
  }

  /** Transition to a new state, throws if invalid */
  transition(to: RecordingStatus): void {
    const allowed = VALID_TRANSITIONS[this._status]
    if (!allowed.includes(to)) {
      throw new Error(`Invalid transition: ${this._status} → ${to}`)
    }

    this._status = to

    if (to === "recording" && !this._recording) {
      this._recording = {
        id: crypto.randomUUID(),
        title: `Recording ${new Date().toLocaleString()}`,
        startTime: Date.now(),
        steps: [],
        status: "recording"
      }
    }

    if (this._recording) {
      this._recording.status = to
      if (to === "stopped") {
        this._recording.endTime = Date.now()
      }
    }

    this._notify()
  }

  /** Add a step to the current recording */
  addStep(step: SOPStep): void {
    if (this._status !== "recording" || !this._recording) {
      throw new Error("Cannot add step: not recording")
    }
    step.order = this._recording.steps.length + 1
    step.timeSinceStart = step.timestamp - this._recording.startTime
    this._recording.steps.push(step)
  }

  /** Update a step's editable fields */
  updateStep(stepId: string, updates: Partial<Pick<SOPStep, "title" | "description">>): void {
    if (!this._recording) return
    const step = this._recording.steps.find((s) => s.id === stepId)
    if (step) {
      Object.assign(step, updates)
    }
  }

  /** Delete a step and re-order */
  deleteStep(stepId: string): void {
    if (!this._recording) return
    this._recording.steps = this._recording.steps.filter((s) => s.id !== stepId)
    this._recording.steps.forEach((s, i) => {
      s.order = i + 1
    })
  }

  /** Reset to idle for a new recording */
  reset(): void {
    this._status = "idle"
    this._recording = null
    this._notify()
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      listener(this._status, this._recording)
    }
  }
}

/** Singleton instance */
export const recordingState = new RecordingStateMachine()
