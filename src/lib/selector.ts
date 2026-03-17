/**
 * CSS Selector generator — creates a unique, stable selector for a DOM element.
 * Priority: #id → [data-testid] → [aria-label] → tag+attributes → :nth-of-type
 */

/** Generate a unique CSS selector for the given element */
export function generateSelector(el: Element): string {
  // 1. ID (if unique)
  if (el.id && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
    return `#${CSS.escape(el.id)}`
  }

  // 2. data-testid
  const testId = el.getAttribute("data-testid")
  if (testId) {
    const sel = `[data-testid="${CSS.escape(testId)}"]`
    if (isUnique(sel)) return sel
  }

  // 3. aria-label
  const ariaLabel = el.getAttribute("aria-label")
  if (ariaLabel) {
    const sel = `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`
    if (isUnique(sel)) return sel
  }

  // 4. Build from tag + distinguishing attributes
  const attrSelector = buildAttributeSelector(el)
  if (attrSelector && isUnique(attrSelector)) return attrSelector

  // 5. Fallback: nth-of-type path
  return buildNthPath(el)
}

/** Generate an XPath for the element */
export function generateXPath(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousElementSibling
    while (sibling) {
      if (sibling.tagName === current.tagName) index++
      sibling = sibling.previousElementSibling
    }
    const tag = current.tagName.toLowerCase()
    parts.unshift(`${tag}[${index}]`)
    current = current.parentElement
  }

  return `/${parts.join("/")}`
}

// ─── Helpers ─────────────────────────────────────

function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1
  } catch {
    return false
  }
}

const USEFUL_ATTRS = ["name", "type", "role", "placeholder", "href", "title", "alt"]

function buildAttributeSelector(el: Element): string | null {
  const tag = el.tagName.toLowerCase()
  const attrs: string[] = []

  for (const attr of USEFUL_ATTRS) {
    const val = el.getAttribute(attr)
    if (val) {
      attrs.push(`[${attr}="${CSS.escape(val)}"]`)
    }
  }

  if (attrs.length === 0) return null

  // Try tag + single attr first, then combinations
  for (const attr of attrs) {
    const sel = `${tag}${attr}`
    if (isUnique(sel)) return sel
  }

  // Try tag + all attrs
  const sel = `${tag}${attrs.join("")}`
  if (isUnique(sel)) return sel

  return null
}

function buildNthPath(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current !== document.documentElement) {
    const tag = current.tagName.toLowerCase()
    const parent = current.parentElement

    if (!parent) {
      parts.unshift(tag)
      break
    }

    const siblings = Array.from(parent.children).filter(
      (c) => c.tagName === current!.tagName
    )

    if (siblings.length === 1) {
      parts.unshift(tag)
    } else {
      const index = siblings.indexOf(current) + 1
      parts.unshift(`${tag}:nth-of-type(${index})`)
    }

    current = parent
  }

  return parts.join(" > ")
}
