---
stepsCompleted: [session-setup, technique-execution, idea-organization]
inputDocuments: [docs/project-learnings.md]
session_topic: 'SOP Recorder MVP — Differentiators, Minimum Feature Set, and Strategic Decisions'
session_goals: 'Identify differentiators, define minimum MVP scope, solve screenshot annotation, decide on video recording, plan distribution and monetization'
selected_approach: 'multi-technique'
techniques_used: [SCAMPER, Reverse Brainstorming, Six Thinking Hats]
ideas_generated: [see sections below]
context_file: 'docs/project-learnings.md'
---

# Brainstorming Session: SOP Recorder MVP

**Date:** 2026-03-18
**Project:** SOP Recorder — Chrome extension for recording browser workflows as SOPs
**Duration:** Full session (3 techniques applied)

---

## Technique 1: SCAMPER Analysis

SCAMPER forces structured creative thinking by asking seven questions about the product concept.

### S — Substitute
- **Substitute SaaS backend with local-only storage.** Every competitor (Scribe, Tango) sends data to their servers. SOP Recorder substitutes this with `chrome.storage.local` and ZIP export. This is the single strongest differentiator.
- **Substitute proprietary AI with BYOK.** Instead of locking users into one AI provider, let them plug in any OpenAI-compatible endpoint (OpenAI, Groq, local Ollama, Azure). This removes vendor lock-in AND privacy concerns.
- **Substitute video with annotated screenshot sequences.** Video is expensive (storage, offscreen document complexity, blob lifecycle bugs). A well-annotated screenshot sequence is often more useful for SOPs than video anyway — people scan SOPs, they don't watch them.

### C — Combine
- **Combine recording + editing in a single flow.** Most tools separate "record" from "edit." SOP Recorder can show the step list live during recording, allowing inline title edits and step deletion before you finish.
- **Combine screenshot capture with simple CSS-based annotation.** Instead of a canvas drawing library, combine the screenshot with a CSS overlay (red border on clicked element, numbered badge) rendered at capture time via the content script.
- **Combine Markdown export with a self-contained HTML viewer.** Export a single HTML file that embeds screenshots as base64 and provides a step-by-step viewer — no dependencies needed.

### A — Adapt
- **Adapt the "changelog" pattern from developer tools.** Each step is a diff: "before" context + "action taken" + "result." This maps naturally to SOP documentation.
- **Adapt Workmap's open-source approach.** Workmap covers ~80% of core functionality. Adapt their proven patterns (click/input/nav capture, Markdown export) but with a cleaner UX and AI enhancement layer.

### M — Modify / Magnify
- **Magnify the "edit before export" experience.** Make the step editor the hero feature — drag-to-reorder, inline description editing, screenshot cropping, step merging. This is where Scribe's free tier is deliberately crippled.
- **Modify screenshot timing to be smarter.** Instead of a fixed 200ms delay, detect DOM mutations and capture after the page settles. This produces more accurate screenshots.

### P — Put to Other Uses
- **QA bug reproduction.** A recorded SOP doubles as a bug reproduction sequence. Export as a bug report template with steps-to-reproduce, expected vs. actual.
- **Onboarding checklists.** SOPs can serve as interactive onboarding checklists for new employees learning internal tools.
- **Compliance documentation.** For regulated industries, SOPs with screenshots serve as audit trail evidence.

### E — Eliminate
- **Eliminate video recording from MVP entirely.** The project learnings document already flags this as high-complexity/low-value. Video adds offscreen document lifecycle management, blob URL lifetime issues, and large file handling — all for a feature most SOP users don't need.
- **Eliminate real-time AI processing.** AI enhancement should be a post-recording, opt-in step. No streaming, no progress bars needed for MVP. Just "Enhance with AI" button that rewrites step descriptions.
- **Eliminate account/login.** No accounts. No sync. No onboarding flow. Install and start recording.

### R — Reverse / Rearrange
- **Reverse the workflow: start from the export.** Design the Markdown/HTML output first, then work backward to determine what data needs to be captured. This prevents over-engineering the capture layer.
- **Rearrange the AI integration point.** Instead of AI during recording, apply AI at export time. The user records raw steps, then at export, they can optionally run AI enhancement to polish descriptions, add context, and standardize formatting.

---

## Technique 2: Reverse Brainstorming

*"How could we make the worst possible SOP recorder?"* — then invert each answer.

### How to Make It Terrible → Inversion = Design Principle

| Terrible Version | Inversion (Design Principle) |
|---|---|
| Require cloud account and login before first use | **Zero-config start.** Install → click record → done. No accounts ever. |
| Upload all screenshots to a server | **Everything stays local.** Screenshots are base64 in storage, exported as files in a ZIP. Nothing leaves the browser. |
| Capture every mouse movement and scroll event | **Capture only meaningful actions.** Clicks, typed inputs, and navigations. Debounce and deduplicate aggressively. |
| Make the export format proprietary | **Markdown-first export.** Universal, version-controllable, readable in any editor. |
| Require the user to manually take screenshots | **Automatic screenshot on every action.** The 200ms post-event delay is smart — captures the result of the action, not the moment of click. |
| Show a complicated settings page on first launch | **Sensible defaults, zero required config.** AI settings are optional. Recording works out of the box. |
| Lock editing behind a paywall | **All editing is free, always.** Step reordering, title editing, deletion, description editing — these are core, not premium. |
| Break when the service worker restarts | **Persist recording state.** Use `chrome.storage.session` for in-progress recordings so service worker restarts don't lose data. |
| Capture passwords and sensitive data | **Mask all password fields.** Already implemented. Extend to credit card fields and other sensitive inputs. |
| Generate 500MB video files | **No video in MVP.** Screenshot sequences are lightweight, portable, and more useful for documentation. |

### Key Insight from Reverse Brainstorming
The strongest theme is **simplicity and trust**. Every competitor adds complexity (accounts, cloud, paywalls, heavy features). The inverse — radical simplicity and local-first privacy — is the clearest differentiator.

---

## Technique 3: Six Thinking Hats

Examining each brainstorming question through six perspectives.

### Question 1: What makes this MVP different?

| Hat | Perspective |
|---|---|
| **White (Facts)** | Scribe has 5M+ users but paywalls editing. Tango was acquired by Datadog. Workmap is open-source but unmaintained. No local-first SOP recorder exists in Chrome Web Store. |
| **Red (Feelings)** | Users feel anxiety about sensitive workflow data going to third-party servers. They feel frustrated by "upgrade to edit" paywalls. They want to feel in control. |
| **Black (Risks)** | Risk: "local-first" means no collaboration features, which large teams expect. Risk: BYOK AI is friction — most users won't configure it. Risk: without a server, there's no usage analytics for product decisions. |
| **Yellow (Benefits)** | Local-first = instant trust. No account = instant adoption. BYOK = power users love it. Open-source potential = community contributions. |
| **Green (Creative)** | Offer a "privacy badge" in the extension popup showing "0 bytes sent to external servers." Make the BYOK setup a 30-second guided flow with pre-filled templates for popular providers (OpenAI, Groq, Ollama). |
| **Blue (Process)** | Differentiator priority: (1) Local-first privacy, (2) Free full editing, (3) BYOK AI, (4) Markdown-native export, (5) Zero-config start. |

### Question 2: Absolute minimum feature set?

| Hat | Perspective |
|---|---|
| **White (Facts)** | Workmap ships with: click/input/nav recording, screenshots, Markdown export. That's the proven minimum. |
| **Red (Feelings)** | A user should feel "this just works" within 60 seconds of installing. |
| **Black (Risks)** | Cutting too much risks being dismissed as "just another screenshot tool." Must have step editing to feel like an SOP tool, not a screen capture utility. |
| **Yellow (Benefits)** | Lean MVP means faster shipping, fewer bugs, easier testing. |
| **Green (Creative)** | Ship with a built-in "demo mode" that auto-records a sample SOP from a tutorial page, showing the user what the tool does without reading docs. |
| **Blue (Process)** | **MVP = Record + Edit + Export.** Nothing else. |

**MVP Feature Checklist:**
- [ ] Start/stop/pause recording via side panel button + keyboard shortcut (Alt+Shift+R)
- [ ] Capture click, input, and navigation events
- [ ] Auto-screenshot after each captured event
- [ ] Side panel showing live step list during recording
- [ ] Edit step title and description inline
- [ ] Delete steps
- [ ] Reorder steps (drag or up/down buttons)
- [ ] Export as Markdown + screenshots ZIP
- [ ] Password/sensitive field masking
- [ ] Recording state persistence (survive service worker restart)

**Explicitly NOT in MVP:**
- Video recording
- AI enhancement
- Screenshot annotation (beyond automatic element highlighting)
- Import/merge recordings
- Collaboration/sharing
- Cloud sync
- MCP server integration

### Question 3: Screenshot annotation without complex libraries?

| Hat | Perspective |
|---|---|
| **White (Facts)** | Canvas APIs exist but add complexity. CSS can render overlays. The content script already has access to element positions. `html2canvas` is heavy (~40KB). Chrome's `chrome.tabs.captureVisibleTab()` captures the viewport as-is. |
| **Red (Feelings)** | Users want to see WHERE they clicked at a glance. A red circle or highlight box is enough. |
| **Black (Risks)** | CSS overlays captured in screenshots may interfere with page layout. Timing is tricky — show overlay, capture, hide overlay. |
| **Green (Creative)** | **Multiple approaches, increasing complexity:** |

**Approach A: Post-capture SVG overlay (RECOMMENDED for MVP)**
- Capture screenshot normally (no DOM modification)
- Store click coordinates relative to viewport
- At export time, composite a simple SVG overlay onto the screenshot using `OffscreenCanvas` or a minimal `<canvas>` element
- SVG overlay = red circle at click point + step number badge
- No external libraries needed. ~50 lines of code.

**Approach B: CSS injection at capture time**
- Inject a CSS class onto the clicked element: `outline: 3px solid red; outline-offset: 2px;`
- Wait 50ms for render
- Capture screenshot via `captureVisibleTab()`
- Remove the CSS class
- Pro: highlights the actual element, not just a point
- Con: may cause layout shift on some elements

**Approach C: Numbered step badges only**
- Skip click highlighting entirely
- Add a small numbered badge (CSS `::after` pseudo-element or injected div) near the click target
- Capture screenshot
- Remove badge
- Minimal but still useful for SOPs

**Recommendation:** Start with Approach A (post-capture SVG overlay) as it's non-intrusive and can be implemented entirely at export time. Add Approach B as an enhancement later.

### Question 4: Video recording — defer or simplify?

| Hat | Perspective |
|---|---|
| **White (Facts)** | Video requires: offscreen document, MediaRecorder API, VP9/VP8 codec, blob lifecycle management, large file export. Known bugs: blob URL invalidation on service worker restart, offscreen document crashes, 10s timeout for stop. |
| **Black (Risks)** | Video is the #1 source of complexity and bugs in the previous iteration. It touches the most fragile MV3 APIs. Shipping video with bugs is worse than not shipping it at all. |
| **Yellow (Benefits)** | Some users genuinely want video. Screenity proves there's demand. |
| **Green (Creative)** | **Compromise: offer a "link to screen recording" field.** Users can record with Screenity/OBS/native OS recorder and paste the video link into the SOP. SOP Recorder handles the steps + screenshots; video is external. |
| **Blue (Process)** | **Decision: DEFER video to v2.** Not simplified — deferred entirely. |

**Rationale:**
1. Video adds 40%+ of codebase complexity for a feature most SOP users skip
2. Every known critical bug in the previous iteration involves video/media capture
3. Excellent free screen recorders already exist (Screenity, OS-native)
4. The "link external video" compromise costs nothing to implement

### Question 5: Distribution strategy

| Hat | Perspective |
|---|---|
| **White (Facts)** | Chrome Web Store review takes 1-7 days. CWS charges a one-time $5 fee. Direct install requires developer mode. CWS provides auto-updates, trust signals, and discoverability. |
| **Red (Feelings)** | Users trust CWS-listed extensions more. Developer mode feels sketchy to non-technical users. |
| **Black (Risks)** | CWS can reject extensions or change policies. The `unlimitedStorage` permission may require justification. |
| **Green (Creative)** | **Dual distribution:** CWS for public users + GitHub releases (.crx) for developers/privacy-conscious users who prefer self-hosted. |
| **Blue (Process)** | **Ship to CWS first.** It's the primary discovery channel. GitHub releases as secondary. |

**Distribution Plan:**
1. **Phase 1 (MVP):** Chrome Web Store listing with clear privacy messaging ("100% local, zero data collection")
2. **Phase 2:** GitHub repository with build instructions for self-hosted installs
3. **Phase 3:** Consider Firefox add-on (WebExtension API compatibility is high with Plasmo)

### Question 6: Monetization ideas

| Hat | Perspective |
|---|---|
| **White (Facts)** | Scribe: freemium ($29/mo pro). Tango: acquired by Datadog (enterprise). Workmap: open-source, no monetization. |
| **Red (Feelings)** | Users who left Scribe due to paywalls will be hostile to any paywall. Trust is the currency. |
| **Black (Risks)** | Monetizing a local-first tool is inherently hard. No server = no subscription leverage. |
| **Green (Creative)** | Ideas ranked by alignment with local-first values: |

**Aligned with local-first:**
1. **"Buy me a coffee" / GitHub Sponsors** — Voluntary support. Zero friction. Signal of quality.
2. **Premium templates** — Sell SOP template packs (compliance, onboarding, IT procedures) as a one-time purchase.
3. **Pro export formats** — Free: Markdown. Paid one-time unlock: Confluence wiki, Notion, HTML with custom branding.
4. **Enterprise self-hosted bundle** — Package with pre-configured Ollama + custom branding for enterprise deployment.

**Misaligned (avoid):**
- Monthly subscriptions (users fled Scribe for this reason)
- Cloud features as upsell (contradicts local-first promise)
- Ads in the extension (destroys trust)

**Recommendation for MVP:** No monetization. Ship free, build user base, add optional "support the developer" link. Revisit after 1,000 active users.

---

## Consolidated Insights

### The Three Pillars of Differentiation
1. **Privacy by architecture** — Not a privacy policy promise, but a technical guarantee. No server, no accounts, no data transmission.
2. **Full editing, always free** — The feature Scribe paywalls is our core.
3. **BYOK AI as power feature** — Optional, not required. Works with any OpenAI-compatible endpoint.

### MVP Definition (Final)
```
Record → Edit → Export
```
That's the product. Three verbs. Everything else is v2+.

### Risk Register
| Risk | Mitigation |
|---|---|
| Service worker dies mid-recording | Persist state to `chrome.storage.session` on every step capture |
| Screenshots bloat storage | Compress to JPEG at 80% quality; cap at 200 steps per recording |
| User configures bad AI endpoint | Validate with a test request on save; show clear error states |
| CWS rejects due to permissions | Minimize permissions; justify each one in CWS submission; drop `unlimitedStorage` if possible |
| Workmap ships improvements first | Move fast; our UX and AI integration are differentiators Workmap lacks |

### Next Actions
1. Define the PRD based on the "Record + Edit + Export" MVP scope
2. Design the side panel UI (recording view, step list, export flow)
3. Architect the data model (steps, screenshots, recording metadata)
4. Set up the Plasmo project with the decided tech stack
5. Build capture layer first (content script + background), then UI, then export

---

*Session produced using SCAMPER, Reverse Brainstorming, and Six Thinking Hats techniques.*
