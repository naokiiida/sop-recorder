import { describe, it, expect } from "vitest"
import { generateMarkdown } from "~lib/export-markdown"
import type { SOPRecording, SOPStep } from "~lib/types"

function makeRecording(steps: Partial<SOPStep>[] = []): SOPRecording {
  return {
    id: "rec-1",
    title: "Test Recording",
    startTime: 1700000000000,
    endTime: 1700000060000,
    status: "stopped",
    steps: steps.map((s, i) => ({
      id: `step-${i + 1}`,
      order: i + 1,
      action: "click" as const,
      timestamp: 1700000000000 + i * 5000,
      timeSinceStart: i * 5000,
      url: "https://example.com",
      pageTitle: "Example",
      viewport: { width: 1920, height: 1080 },
      devicePixelRatio: 1,
      screenshotDataUrl: "data:image/png;base64,ABC123",
      ...s
    }))
  }
}

describe("generateMarkdown", () => {
  it("generates markdown with title and metadata", () => {
    const md = generateMarkdown(makeRecording())
    expect(md).toContain("# Test Recording")
    expect(md).toContain("ステップ数: 0")
  })

  it("includes step details", () => {
    const md = generateMarkdown(
      makeRecording([
        {
          action: "click",
          target: {
            selector: "#btn",
            xpath: "/html/body/button[1]",
            tagName: "button",
            accessibleName: "Submit",
            attributes: {},
            boundingRect: { x: 0, y: 0, width: 100, height: 40, top: 0, right: 100, bottom: 40, left: 0 }
          }
        }
      ])
    )
    expect(md).toContain("### 1.")
    expect(md).toContain("Submit")
    expect(md).toContain("クリック")
    expect(md).toContain("`#btn`")
  })

  it("includes screenshot references", () => {
    const md = generateMarkdown(
      makeRecording([{ screenshotDataUrl: "data:image/png;base64,ABC" }])
    )
    expect(md).toContain("![Step 1](screenshots/step-1.png)")
  })

  it("includes video reference when available", () => {
    const recording = makeRecording()
    recording.videoBlobUrl = "blob:http://example.com/video"
    const md = generateMarkdown(recording)
    expect(md).toContain("[recording.webm](recording.webm)")
  })

  it("includes type action value", () => {
    const md = generateMarkdown(
      makeRecording([{ action: "type", value: "hello@test.com" }])
    )
    expect(md).toContain("`hello@test.com`")
  })

  it("includes user-edited description", () => {
    const md = generateMarkdown(
      makeRecording([{ description: "カスタム説明テキスト" }])
    )
    expect(md).toContain("カスタム説明テキスト")
  })

  it("handles navigate action with URL", () => {
    const md = generateMarkdown(
      makeRecording([{ action: "navigate", url: "https://app.example.com/dashboard" }])
    )
    expect(md).toContain("app.example.com")
    expect(md).toContain("ナビゲーション")
  })
})
