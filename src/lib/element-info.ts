/**
 * Extract accessible name and useful attributes from a DOM element.
 * Priority: aria-label → aria-labelledby → label[for] → placeholder → title → alt → textContent
 */

import type { TargetInfo } from "./types"
import { generateSelector, generateXPath } from "./selector"

/** Extract full target information from an element */
export function extractTargetInfo(el: Element): TargetInfo {
  const rect = el.getBoundingClientRect()

  return {
    selector: generateSelector(el),
    xpath: generateXPath(el),
    tagName: el.tagName.toLowerCase(),
    accessibleName: getAccessibleName(el),
    attributes: getUsefulAttributes(el),
    boundingRect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left
    }
  }
}

/** Get the accessible name of an element following ARIA name computation (simplified) */
export function getAccessibleName(el: Element): string {
  // 1. aria-label
  const ariaLabel = el.getAttribute("aria-label")
  if (ariaLabel?.trim()) return ariaLabel.trim()

  // 2. aria-labelledby
  const labelledBy = el.getAttribute("aria-labelledby")
  if (labelledBy) {
    const names = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
    if (names.length > 0) return names.join(" ")
  }

  // 3. <label for="...">
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
    if (label?.textContent?.trim()) return label.textContent.trim()
  }

  // 4. Enclosing <label>
  const parentLabel = el.closest("label")
  if (parentLabel) {
    // Get label text excluding the element's own text
    const clone = parentLabel.cloneNode(true) as HTMLElement
    const inputs = clone.querySelectorAll("input, select, textarea")
    inputs.forEach((input) => input.remove())
    const text = clone.textContent?.trim()
    if (text) return text
  }

  // 5. placeholder
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.placeholder?.trim()) return el.placeholder.trim()
  }

  // 6. title
  const title = el.getAttribute("title")
  if (title?.trim()) return title.trim()

  // 7. alt (for images)
  const alt = el.getAttribute("alt")
  if (alt?.trim()) return alt.trim()

  // 8. textContent (truncated)
  const text = el.textContent?.trim()
  if (text) return text.slice(0, 100)

  return ""
}

/** Extract useful attributes for display/debugging */
function getUsefulAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {}
  const interesting = [
    "id", "class", "name", "type", "role", "href",
    "aria-label", "data-testid", "placeholder", "value"
  ]

  for (const name of interesting) {
    const val = el.getAttribute(name)
    if (val) attrs[name] = val
  }

  return attrs
}
