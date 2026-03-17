/**
 * Export recording as Markdown + screenshots + video in a ZIP file.
 */

import JSZip from "jszip"
import type { SOPRecording, SOPStep } from "./types"

const ACTION_LABELS: Record<string, string> = {
  click: "クリック",
  type: "入力",
  scroll: "スクロール",
  navigate: "ナビゲーション",
  tab_switch: "タブ切替"
}

function stepTitle(step: SOPStep): string {
  if (step.title) return step.title
  const label = ACTION_LABELS[step.action] || step.action
  const name = step.target?.accessibleName
  if (name) return `「${name.slice(0, 60)}」を${label}`
  if (step.action === "navigate") {
    try {
      return `${new URL(step.url).hostname} へ${label}`
    } catch {
      return label
    }
  }
  return label
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, "0")}`
}

/** Generate Markdown content from recording */
export function generateMarkdown(recording: SOPRecording): string {
  const lines: string[] = []

  lines.push(`# ${recording.title}`)
  lines.push("")
  lines.push(`> 録画日時: ${new Date(recording.startTime).toLocaleString()}`)
  if (recording.endTime) {
    const duration = Math.floor((recording.endTime - recording.startTime) / 1000)
    lines.push(`> 所要時間: ${Math.floor(duration / 60)}分${duration % 60}秒`)
  }
  lines.push(`> ステップ数: ${recording.steps.length}`)
  lines.push("")

  if (recording.videoBlobUrl) {
    lines.push("## 録画動画")
    lines.push("")
    lines.push("[recording.webm](recording.webm)")
    lines.push("")
  }

  lines.push("## 手順")
  lines.push("")

  for (const step of recording.steps) {
    const title = stepTitle(step)
    lines.push(`### ${step.order}. ${title}`)
    lines.push("")
    lines.push(`- アクション: ${ACTION_LABELS[step.action] || step.action}`)
    lines.push(`- URL: ${step.url}`)
    lines.push(`- 経過時間: ${formatTime(step.timeSinceStart)}`)

    if (step.target) {
      lines.push(`- 対象要素: \`${step.target.selector}\``)
      if (step.target.accessibleName) {
        lines.push(`- アクセシブル名: ${step.target.accessibleName}`)
      }
    }

    if (step.action === "type" && step.value) {
      lines.push(`- 入力値: \`${step.value}\``)
    }

    if (step.description) {
      lines.push("")
      lines.push(step.description)
    }

    if (step.screenshotDataUrl) {
      lines.push("")
      lines.push(`![Step ${step.order}](screenshots/step-${step.order}.png)`)
    }

    lines.push("")
  }

  return lines.join("\n")
}

/** Export recording as a ZIP file with Markdown + screenshots + video */
export async function exportRecording(recording: SOPRecording): Promise<void> {
  const zip = new JSZip()

  // Add Markdown
  const markdown = generateMarkdown(recording)
  zip.file("sop.md", markdown)

  // Add screenshots
  const screenshotsFolder = zip.folder("screenshots")!
  for (const step of recording.steps) {
    if (step.screenshotDataUrl) {
      // Convert data URL to binary
      const base64 = step.screenshotDataUrl.split(",")[1]
      if (base64) {
        screenshotsFolder.file(`step-${step.order}.png`, base64, { base64: true })
      }
    }
  }

  // Add video if available
  if (recording.videoBlobUrl) {
    try {
      const response = await fetch(recording.videoBlobUrl)
      const videoBlob = await response.blob()
      zip.file("recording.webm", videoBlob)
    } catch (err) {
      console.warn("Failed to include video in export:", err)
    }
  }

  // Generate ZIP and trigger download
  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)
  const filename = `sop-${new Date().toISOString().slice(0, 10)}.zip`

  chrome.downloads.download({
    url,
    filename,
    saveAs: true
  })
}
