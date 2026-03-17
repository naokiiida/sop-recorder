/**
 * Debounce utility for event capture (e.g., scroll events at 500ms).
 */

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: unknown[]) => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, ms)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return debounced
}
