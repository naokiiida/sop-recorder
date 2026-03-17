/** Action types that can be captured */
export type ActionType = "click" | "type" | "scroll" | "navigate" | "tab_switch"

/** Target element information */
export interface TargetInfo {
  selector: string
  xpath: string
  tagName: string
  accessibleName: string
  attributes: Record<string, string>
  boundingRect: {
    x: number
    y: number
    width: number
    height: number
    top: number
    right: number
    bottom: number
    left: number
  }
}

/** A single recorded step */
export interface SOPStep {
  id: string
  order: number
  action: ActionType
  timestamp: number
  timeSinceStart: number
  url: string
  pageTitle: string
  target?: TargetInfo
  /** Typed value for "type" actions (masked for password fields) */
  value?: string
  scrollDelta?: { x: number; y: number }
  viewport: { width: number; height: number }
  devicePixelRatio: number
  screenshotDataUrl: string
  /** User-editable title */
  title?: string
  /** User-editable description */
  description?: string
}

/** Recording state machine states */
export type RecordingStatus = "idle" | "recording" | "paused" | "stopped"

/** Full recording session */
export interface SOPRecording {
  id: string
  title: string
  startTime: number
  endTime?: number
  steps: SOPStep[]
  status: RecordingStatus
  /** webm blob URL for tab video+audio recording */
  videoBlobUrl?: string
}

// ─── Messages ────────────────────────────────────

export type MessageType =
  | "START_RECORDING"
  | "STOP_RECORDING"
  | "PAUSE_RECORDING"
  | "RESUME_RECORDING"
  | "CAPTURE_EVENT"
  | "SCREENSHOT_TAKEN"
  | "RECORDING_STATE_CHANGED"
  | "STEP_ADDED"
  | "START_MEDIA_CAPTURE"
  | "STOP_MEDIA_CAPTURE"
  | "MEDIA_CHUNK"
  | "MEDIA_CAPTURE_READY"
  | "UPDATE_STEP"
  | "DELETE_STEP"
  | "EXPORT_RECORDING"
  | "AI_ENHANCE"

export interface BaseMessage {
  type: MessageType
}

export interface StartRecordingMessage extends BaseMessage {
  type: "START_RECORDING"
}

export interface StopRecordingMessage extends BaseMessage {
  type: "STOP_RECORDING"
}

export interface PauseRecordingMessage extends BaseMessage {
  type: "PAUSE_RECORDING"
}

export interface ResumeRecordingMessage extends BaseMessage {
  type: "RESUME_RECORDING"
}

export interface CaptureEventMessage extends BaseMessage {
  type: "CAPTURE_EVENT"
  payload: {
    action: ActionType
    url: string
    pageTitle: string
    target?: TargetInfo
    value?: string
    scrollDelta?: { x: number; y: number }
    viewport: { width: number; height: number }
    devicePixelRatio: number
    timestamp: number
  }
}

export interface RecordingStateChangedMessage extends BaseMessage {
  type: "RECORDING_STATE_CHANGED"
  payload: {
    status: RecordingStatus
    recording?: SOPRecording
  }
}

export interface StepAddedMessage extends BaseMessage {
  type: "STEP_ADDED"
  payload: SOPStep
}

export interface UpdateStepMessage extends BaseMessage {
  type: "UPDATE_STEP"
  payload: {
    stepId: string
    updates: Partial<Pick<SOPStep, "title" | "description">>
  }
}

export interface DeleteStepMessage extends BaseMessage {
  type: "DELETE_STEP"
  payload: { stepId: string }
}

export interface MediaChunkMessage extends BaseMessage {
  type: "MEDIA_CHUNK"
  payload: { chunk: ArrayBuffer }
}

export type Message =
  | StartRecordingMessage
  | StopRecordingMessage
  | PauseRecordingMessage
  | ResumeRecordingMessage
  | CaptureEventMessage
  | RecordingStateChangedMessage
  | StepAddedMessage
  | UpdateStepMessage
  | DeleteStepMessage
  | MediaChunkMessage

// ─── AI Settings ─────────────────────────────────

export interface AISettings {
  apiUrl: string
  apiKey: string
  model: string
  enabled: boolean
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  enabled: false
}
