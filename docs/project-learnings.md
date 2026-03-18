# SOP Recorder — Project Learnings & Knowledge Base

> Extracted from previous Claude Code sessions, source code analysis, and research notes.
> Date: 2026-03-18

---

## 1. Product Vision

**SOP Recorder** is a Chrome extension that records browser interactions and produces Standard Operating Procedures (SOPs) — step-by-step documentation with annotated screenshots and optional video.

**Core Problem**: Existing tools (Scribe, Tango, etc.) are SaaS with paywalls, privacy concerns, and no local-first option. Claude Chrome's "Teach" feature records tool call sequences but has no "export as SOP" capability.

**Target User**: Knowledge workers who need to document repeatable browser-based workflows for training, compliance, or handoff.

---

## 2. Previous Architecture (Plasmo + Chrome MV3)

### Stack
- **Plasmo** (Chrome extension framework with React, HMR)
- **TypeScript 5.7** (strict mode)
- **React 18.3** (side panel UI)
- **Tailwind CSS 3.4** + PostCSS
- **Vitest** (unit tests) + **Playwright** (E2E, configured but unused)
- **jszip** (ZIP export), **uuid** (step IDs)
- **pnpm** (package manager)

### Component Architecture
```
Content Script (event-capture.ts)
  └→ chrome.runtime.sendMessage("CAPTURE_EVENT") → Background Service Worker
                                                        ↓
                                                  RecordingStateMachine ↔ Messages
                                                        ↓
                                                  MediaCapture (Offscreen Document)
                                                        ↓
                                                  chrome.runtime.broadcast
                                                        ↓
                                                  Side Panel (React UI)
```

### Key Design Patterns
| Pattern | Implementation | Assessment |
|---------|---------------|------------|
| State Machine | Singleton `RecordingStateMachine` with observer pattern | Solid — transition validation prevents invalid states |
| Event Debouncing | 500ms debounce for input/scroll events | Good — prevents message spam |
| Click Deduplication | Same-target clicks within 500ms ignored | Good — prevents double-capture |
| Drag Filtering | >50px movement filtered from clicks | Good edge case handling |
| Trusted Events Only | `e.isTrusted` check | Security-conscious |
| Password Masking | Values masked as `••••••••` | Critical for privacy |
| Selector Generation | ID → data-testid → aria-label → tag+attrs → nth-of-type | Well-prioritized fallback chain |
| Accessible Name | aria-label → aria-labelledby → label[for] → textContent | Follows WAI-ARIA spec |
| Screenshot Timing | 200ms delay after event for DOM settle | Practical compromise |
| Media Capture | Offscreen document with MediaRecorder (VP9/VP8+Opus) | MV3-compliant pattern |

### Permissions Used
```
activeTab, tabs, scripting, storage, offscreen, sidePanel,
tabCapture, alarms, downloads, unlimitedStorage, webNavigation
```

---

## 3. What Worked Well

1. **RecordingStateMachine** — Clean state management with listener-based reactivity
2. **Content script ↔ background message protocol** — Well-typed discriminated union messages
3. **Selector generation** with sensible priority fallbacks
4. **Accessible name extraction** following ARIA spec
5. **Build validation tests** — Clever tests that verify manifest permissions match actual API usage in source code
6. **Debounce utility** — Well-tested with cancel support
7. **Markdown export** — Clean format with Japanese labels, metadata, step numbering
8. **Service worker keepalive** — 25-minute alarm to prevent MV3 service worker termination

---

## 4. Known Issues & Gotchas

### Critical
1. **Media blob URL lifetime** — Video blob URL created in background becomes invalid if service worker context is invalidated before export
2. **No recording persistence** — Recordings are memory-only; lost if user forgets to export
3. **Offscreen document crash** — `stopMediaCapture()` can hang if offscreen dies; 10s timeout provides partial mitigation

### Moderate
4. **Content script injection timing** — Extension reload during recording may fail to re-inject
5. **Message ordering** — Rapid steps could arrive out-of-order (no sequence numbers)
6. **Dynamic content script filenames** — Plasmo hashes filenames; background reads from manifest at runtime

### Design Gaps
7. **No streaming AI** — Full completion response only, no progress indicator
8. **Settings not validated** — Invalid API URL/key only caught at request time
9. **E2E tests** — Playwright configured but no test files written

---

## 5. AI Integration Approach

### Previous Design: BYOK + OpenAI-Compatible
- Users provide their own API key + endpoint URL
- Generic `/v1/chat/completions` endpoint (works with OpenAI, Azure, Groq, local LLMs)
- Temperature 0.3 for deterministic output
- System prompt in Japanese for SOP formatting
- `enhanceSteps()` function prepared but **UI integration was incomplete**

### Key Insight
> "We don't need to limit to Claude SDK and API. If we go OpenAI-API format compatible we can use many models and evaluate them, and allow user to BYOK and url."
> — ideas.md

### AI Service Privacy Research (Completed)
Best privacy (no training on data): **Groq, Fireworks, Soniox**
Worst privacy: **AssemblyAI** (opt-out may not be possible)
Transcription can be manual (user has Spokenly app).

---

## 6. Competitive Landscape & References

### Analyzed Extensions
| Extension | Key Insight |
|-----------|------------|
| **Scribe** | Server-side validation for paywall; client-side flag bypass insufficient |
| **Claude in Chrome** | Records tool call sequences, not human-readable SOPs; uses CDP for screenshots/clicks |
| **Workmap** (open source) | Records clicks/inputs/nav with screenshots, exports Markdown — covers ~80% of SOP Recorder's core |
| **Screenity** | Screen recording reference (github.com/alyssaxuu/screenity) |
| **GlitterAI** | Analyzed in browser-extensions repo |
| **GuideChimp** | Analyzed in browser-extensions repo |

### Reference Code Repository
`/Users/naokiiida/Documents/4_clone/0_browser-extensions/` — Contains extracted/decompiled extensions for analysis.

### Architecture Inspiration: Claude Chrome Internals
- 3-layer architecture: Side Panel UI → Background Service Worker → Content Script
- Accessibility tree builder with `WeakRef` element map (`ref_1`, `ref_2`, ...)
- CDP-based screenshot with overlay hide/show pattern
- `HIDE_FOR_TOOL_USE` / `SHOW_AFTER_TOOL_USE` messaging for clean captures

---

## 7. MVP Scope Recommendations (from previous sessions)

### Core MVP (must-have)
- Record clicks, inputs, navigation with screenshots
- Step list with editable titles/descriptions
- Export as Markdown + ZIP with embedded screenshots

### Should-have
- Keyboard shortcut toggle (Alt+Shift+R)
- Pause/resume recording
- Step deletion and reordering

### Nice-to-have (defer for v2)
- Video recording (complex offscreen document lifecycle)
- AI enhancement of step descriptions
- Screenshot annotation (arrows, highlights)
- MCP server integration
- nativeMessaging host for direct filesystem saves

### Fastest Path to Ship
Previous research concluded: **Fork Workmap** and add AI enhancement + annotation was the fastest path. However, building from scratch with Plasmo was chosen for more control.

---

## 8. Technical Decisions for Next Iteration

### Keep
- Plasmo framework (good MV3 support, React integration)
- TypeScript strict mode
- Vitest for testing
- pnpm for package management
- State machine pattern for recording lifecycle
- Debounce + deduplication for event capture
- Selector generation priority chain
- Password masking

### Reconsider
- Video recording scope — defer to v2, adds significant complexity (offscreen document, blob lifecycle, large file handling)
- AI integration scope — start with export-only, add AI enhancement as opt-in feature later
- Recording persistence — add chrome.storage.local backup to prevent data loss
- Message ordering — add sequence numbers for step ordering

### New Considerations
- Lean MVP means: **record → edit → export**. That's it.
- Transcription is handled externally (Spokenly app)
- Focus on reliability over features
