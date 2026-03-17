import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { debounce } from "~lib/debounce"

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("calls function after delay", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledOnce()
  })

  it("resets timer on subsequent calls", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    vi.advanceTimersByTime(300)
    debounced() // Reset timer
    vi.advanceTimersByTime(300)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledOnce()
  })

  it("passes arguments to function", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced("a", "b")
    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledWith("a", "b")
  })

  it("cancel prevents execution", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()
  })

  it("deduplicates rapid calls within window", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    debounced()
    debounced()
    debounced()
    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledOnce()
  })
})
