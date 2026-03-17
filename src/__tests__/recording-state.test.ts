import { describe, it, expect, beforeEach, vi } from "vitest"
import { RecordingStateMachine } from "~background/recording-state"
import type { SOPStep } from "~lib/types"

function makeStep(overrides: Partial<SOPStep> = {}): SOPStep {
  return {
    id: crypto.randomUUID(),
    order: 0,
    action: "click",
    timestamp: Date.now(),
    timeSinceStart: 0,
    url: "https://example.com",
    pageTitle: "Example",
    viewport: { width: 1920, height: 1080 },
    devicePixelRatio: 1,
    screenshotDataUrl: "",
    ...overrides
  }
}

describe("RecordingStateMachine", () => {
  let sm: RecordingStateMachine

  beforeEach(() => {
    sm = new RecordingStateMachine()
  })

  it("starts in idle state", () => {
    expect(sm.status).toBe("idle")
    expect(sm.recording).toBeNull()
  })

  it("transitions idle → recording", () => {
    sm.transition("recording")
    expect(sm.status).toBe("recording")
    expect(sm.recording).not.toBeNull()
    expect(sm.recording!.status).toBe("recording")
  })

  it("transitions recording → paused → recording", () => {
    sm.transition("recording")
    sm.transition("paused")
    expect(sm.status).toBe("paused")
    sm.transition("recording")
    expect(sm.status).toBe("recording")
  })

  it("transitions recording → stopped", () => {
    sm.transition("recording")
    sm.transition("stopped")
    expect(sm.status).toBe("stopped")
    expect(sm.recording!.endTime).toBeDefined()
  })

  it("transitions stopped → idle", () => {
    sm.transition("recording")
    sm.transition("stopped")
    sm.transition("idle")
    expect(sm.status).toBe("idle")
  })

  it("rejects invalid transitions", () => {
    expect(() => sm.transition("stopped")).toThrow("Invalid transition")
    expect(() => sm.transition("paused")).toThrow("Invalid transition")
  })

  it("rejects idle → paused", () => {
    expect(() => sm.transition("paused")).toThrow()
  })

  it("rejects stopped → recording directly", () => {
    sm.transition("recording")
    sm.transition("stopped")
    expect(() => sm.transition("recording")).toThrow()
  })

  it("adds steps during recording", () => {
    sm.transition("recording")
    const step = makeStep()
    sm.addStep(step)
    expect(sm.recording!.steps).toHaveLength(1)
    expect(sm.recording!.steps[0].order).toBe(1)
  })

  it("throws when adding step while not recording", () => {
    expect(() => sm.addStep(makeStep())).toThrow("not recording")
  })

  it("updates step fields", () => {
    sm.transition("recording")
    const step = makeStep()
    sm.addStep(step)
    sm.updateStep(step.id, { title: "Edited" })
    expect(sm.recording!.steps[0].title).toBe("Edited")
  })

  it("deletes step and re-orders", () => {
    sm.transition("recording")
    const s1 = makeStep()
    const s2 = makeStep()
    sm.addStep(s1)
    sm.addStep(s2)
    expect(sm.recording!.steps).toHaveLength(2)

    sm.deleteStep(s1.id)
    expect(sm.recording!.steps).toHaveLength(1)
    expect(sm.recording!.steps[0].id).toBe(s2.id)
    expect(sm.recording!.steps[0].order).toBe(1)
  })

  it("notifies listeners on transition", () => {
    const listener = vi.fn()
    sm.onChange(listener)
    sm.transition("recording")
    expect(listener).toHaveBeenCalledWith("recording", expect.any(Object))
  })

  it("unsubscribe works", () => {
    const listener = vi.fn()
    const unsub = sm.onChange(listener)
    unsub()
    sm.transition("recording")
    expect(listener).not.toHaveBeenCalled()
  })

  it("reset returns to idle", () => {
    sm.transition("recording")
    sm.addStep(makeStep())
    sm.reset()
    expect(sm.status).toBe("idle")
    expect(sm.recording).toBeNull()
  })
})
