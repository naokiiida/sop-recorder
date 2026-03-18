# PRD Validation Report — SOP Recorder

**Validator:** Claude Opus 4.6 (1M context)
**Date:** 2026-03-18
**PRD Version:** 2.0
**Status:** PASS WITH FINDINGS (6 issues found, 0 blockers)

---

## Executive Summary

The SOP Recorder PRD v2.0 is a **high-quality, implementation-ready document** that demonstrates exceptional research integration, clear scope boundaries, and well-reasoned technical decisions. It covers all major sections expected of a professional PRD and makes defensible choices backed by 17 research documents.

**Overall Score: 92/100**

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Completeness | 95/100 | PASS |
| Consistency | 90/100 | PASS — minor inconsistencies found |
| Measurability | 93/100 | PASS |
| Traceability | 90/100 | PASS — minor gaps |
| Scope Clarity | 97/100 | PASS — exemplary |
| Technical Feasibility | 88/100 | PASS — with findings |
| Research Alignment | 94/100 | PASS |

---

## 1. Completeness Validation

### Sections Present

| Required Section | Present? | Quality |
|-----------------|----------|---------|
| Executive Summary / Vision | Yes | Excellent — clear three-verb MVP definition |
| Problem Statement | Yes | Strong — quantified pain points with dollar figures |
| Target Users & Personas | Yes | Three well-defined personas with decision factors |
| User Journeys | Yes | Three journeys covering critical path, editing, and recovery |
| Architecture Principles | Yes | Core-shell adapter pattern, local-first, record-rich/export-thin |
| Functional Requirements | Yes | 32 FRs with IDs, priorities, and notes |
| Non-Functional Requirements | Yes | Comprehensive: performance, reliability, security, accessibility, compatibility |
| Success Metrics | Yes | Launch metrics, quality metrics, and North Star metric defined |
| Technical Stack & Decisions | Yes | Detailed decision matrix with alternatives considered |
| Data Model | Yes | Full TypeScript interface with export format mapping |
| Scope Boundary | Yes | Explicit in-scope and out-of-scope lists |
| Release Strategy | Yes | v1.0 through v3.0 roadmap with monetization plan |
| Testing Requirements | Yes | CI/CD pipeline, baseline test suite, coverage targets |
| Competitive Reference | Yes | Feature comparison matrix in Appendix A |
| Glossary | Yes | Appendix B covers all domain-specific terms |

### Gaps Identified

**GAP-1: No explicit error handling / edge case section.** The PRD describes the happy path well but does not enumerate failure modes beyond service worker restart. What happens when:
- `captureVisibleTab()` fails (rate limiting, tab not focused)?
- IndexedDB quota is exceeded?
- Content script injection fails (protected pages like `chrome://`, `chrome-extension://`)?
- User has multiple Chrome profiles?

**Severity:** Low. These are implementation-level concerns that a developer can address, but documenting expected behavior for edge cases would strengthen the PRD.

**GAP-2: No internationalization / localization section.** The PRD mentions Japanese language support as a v2 secondary persona need and "English only in v1" in the scope boundary, but there is no i18n architecture guidance (string externalization, RTL considerations, date formatting). Given the user preference context mentioning Japanese market readiness, a brief note on i18n-ready architecture would be valuable.

**Severity:** Low. WXT has built-in i18n support, and this is explicitly deferred to v2.

---

## 2. Consistency Validation

### Internal Consistency Checks

**FINDING-1: Lit bundle size inconsistency.**

The PRD states two different sizes for Lit:
- Section 4.2: "Lit Web Components (light DOM mode, not Shadow DOM)" — no size mentioned
- Section 8.2: "Lit Web Components | Lightweight (~7 KB)"
- Section 8.3: "Avoids React's ~40 KB baseline"

The research documents (`research-minimal-frontend.md` and `research-latest-lib-versions.md`) consistently report Lit as **~5.8 KB gzipped** (or ~16.5 KB minified). The PRD's "~7 KB" does not specify whether this is minified or gzipped. This is a minor imprecision.

**Recommendation:** Clarify to "~6 KB gzipped / ~16 KB minified" for consistency with research findings.

**Severity:** Cosmetic.

**FINDING-2: PicoCSS size inconsistency.**

- Section 4.2: "PicoCSS classless (~3-4 KB gzipped)"
- Section 8.2: "PicoCSS | Classless CSS framework (~10 KB)"
- Section 8.3: "~10 KB"

The research (`research-minimal-frontend.md`) states PicoCSS full is ~10 KB gzipped but classless version is **~4 KB gzipped**. The PRD correctly references classless in Section 4.2 but uses the full version size in Section 8.2/8.3.

**Recommendation:** Consistently state "PicoCSS classless (~4 KB gzipped)" throughout, since Section 4.2 and the research confirm classless is the chosen variant.

**Severity:** Cosmetic.

**FINDING-3: WXT version inconsistency.**

- Section 8.2: "WXT (v0.20.x)"
- `research-latest-lib-versions.md`: WXT 0.20.19
- `research-wxt-framework.md`: WXT 0.20.20

The PRD uses "v0.20.x" which is appropriately flexible. No issue here, but the inputDocuments frontmatter lists `research-wxt-framework.md` which reports 0.20.20 as latest. The PRD should target 0.20.19+ since that is the version that adds Vite 8 support.

**Severity:** None — the "v0.20.x" notation is correctly flexible.

### Cross-Section Consistency

| Check | Result |
|-------|--------|
| FR-1.7 screenshot format matches NFR 6.1 performance targets | PASS — both say JPEG quality 85 |
| FR-1.16 IndexedDB storage matches Section 8.3 decision | PASS — consistent |
| FR-2.6 drag-and-drop matches user preference for native HTML5 DnD | **PARTIAL** — FR-2.6 says "Should" priority and notes "Enhanced UX" but does not specify native HTML5 DnD API vs. library. User context specifies native HTML5 DnD. |
| Section 8.2 tech stack matches Section 4.2 architecture principles | PASS — Lit + PicoCSS + WXT consistent |
| Permission list in 8.5 matches NFR 6.3 | PASS — identical set |
| Success metrics (Section 7) vs. NFR targets (Section 6) | PASS — aligned |
| Scope boundary (Section 10) vs. FR lists (Section 5) | PASS — all FRs accounted for |

**FINDING-4: FR-2.6 drag-and-drop implementation not specified.**

The user explicitly stated that FR-2.6 drag-and-drop should use the **native HTML5 DnD API** (no library). The PRD lists FR-2.6 as "Reorder steps via drag-and-drop | Should | Enhanced UX" but does not specify the implementation approach. The research (`research-minimal-frontend.md`) recommends "Use the native HTML Drag and Drop API or a lightweight library like SortableJS (~5 KB gzip)" and the recommended stack table suggests "SortableJS (if needed)."

**Recommendation:** Add a note to FR-2.6: "Use native HTML5 Drag and Drop API (no external library)." Update Section 8.3 to remove the SortableJS mention or note it as explicitly rejected per user preference.

**Severity:** Medium — this is a user preference that should be documented in the PRD to prevent the developer from choosing SortableJS.

---

## 3. Measurability Validation

### Success Metrics Assessment

| Metric | Specific? | Measurable? | Time-Bound? | Verdict |
|--------|-----------|-------------|-------------|---------|
| CWS installs: 500 | Yes | Yes (CWS dashboard) | Yes (90 days) | PASS |
| Weekly active users: 100 | Yes | Partial (proxy via CWS) | Yes (90 days) | PASS — appropriately acknowledges telemetry-free limitation |
| CWS rating: >= 4.0 | Yes | Yes | Yes | PASS |
| GitHub stars: 200 | Yes | Yes | Yes | PASS |
| GitHub bugs < 20 critical/high | Yes | Yes | Yes | PASS |
| Unit test coverage >= 80% | Yes | Yes (Vitest) | N/A (ongoing) | PASS |
| E2E critical path covered | Partially specific | Yes (Playwright) | N/A | PASS |
| Bundle size < 2 MB | Yes | Yes (size-limit) | N/A | PASS |
| Zero-crash > 99% | Yes | Partially (tests + manual) | N/A | PASS |
| North Star: SOPs exported/week | Specific | **Not measurable** (no telemetry) | N/A | **FLAG** |

**FINDING-5: North Star metric is unmeasurable.**

Section 7.3 defines the North Star metric as "Number of SOPs exported per week" but Section 6.3 / Section 4.4 explicitly forbid telemetry. This metric cannot be measured without some form of data collection. The PRD acknowledges this tension for weekly active users (proxy via CWS) but does not address it for the North Star.

**Recommendation:** Either (a) change the North Star to something measurable without telemetry (e.g., CWS weekly active users as proxy for value delivery), or (b) acknowledge that this is an aspirational metric measured indirectly through CWS download trends and user reviews, or (c) implement optional, opt-in, anonymous usage pings (counter-to-philosophy but honest).

**Severity:** Low — the North Star is directionally correct, just not measurable as defined.

### Performance Targets Assessment

All 20 performance metrics in Section 6.1 have:
- Specific numeric targets with units
- Clear "Must-Have" vs. "Nice-to-Have" tiers
- Measurement methods (tools specified)
- Rationale for each target

This is exemplary. The tiered approach (must-have vs. nice-to-have) provides clear implementation guidance.

---

## 4. Traceability Validation

### Requirements to Personas/Journeys Traceability

| Requirement | Traces to Persona? | Traces to Journey? |
|-------------|--------------------|--------------------|
| FR-1 (Recording) | Sarah (IT Lead) | Journey 1 (Steps 4-7) |
| FR-2 (Editing) | Sarah (IT Lead) | Journey 1 (Step 8), Journey 2 |
| FR-3 (Export) | Sarah, Kenji, Alex | Journey 1 (Steps 9-10) |
| FR-4 (Management) | Sarah | Journey 2 (Steps 1-2) |
| FR-5 (Side Panel) | All personas | All journeys |
| FR-6 (Annotation) | Sarah | Journey 1 (implicit) |
| FR-1.11 (Password masking) | Kenji (Compliance) | Not in journeys |
| FR-1.12 (State persistence) | Alex (Developer) | Journey 3 |
| FR-1.9 (Multiple selectors) | Alex (Developer) | Not in journeys |

**Gap:** FR-1.9 (multiple selectors) and FR-1.14/1.15 (bounding box, viewport) are future-proofing requirements for tour/test export that don't directly trace to any MVP user journey. They trace to the v2 roadmap (tour export, test generation) but not to the personas' current needs.

This is acceptable — the "Record Rich, Export Thin" principle (Section 4.3) explicitly justifies capturing more data than the MVP export requires. The traceability is to the architectural principle, not a specific user story.

### Research to PRD Decision Traceability

| PRD Decision | Research Source | Alignment |
|--------------|----------------|-----------|
| WXT over Plasmo | `technical-research.md` Section 1, `research-wxt-framework.md` | ALIGNED — Plasmo maintenance mode confirmed |
| Lit over React | `research-minimal-frontend.md` | ALIGNED — user preference + CSP safety + bundle size |
| PicoCSS over Tailwind | `research-minimal-frontend.md` Section 2 | ALIGNED — Shadow DOM conflict avoidance, semantic HTML |
| Light DOM mode for Lit | `research-minimal-frontend.md` Section 1 | ALIGNED — user preference confirmed |
| JPEG 85 for screenshots | `research-extension-performance.md` Section 2.4 | ALIGNED — recommended as "sweet spot" |
| IndexedDB for blobs | `research-extension-performance.md` Section 5.3 | ALIGNED — 33% savings |
| `captureVisibleTab()` | `technical-research.md` Section 2.1, `domain-research.md` Section 3 | ALIGNED — simplest, no warning bar |
| No video in MVP | `brainstorming-session.md` (SCAMPER E, Six Hats Q4) | ALIGNED — unanimous deferral |
| No rrweb in MVP | `research-rrweb-data-model.md` Section 7 | ALIGNED — 40-50 KB overhead, custom model produces better selectors |
| Datastar rejected | `research-minimal-frontend.md` Section 3, `research-latest-lib-versions.md` | ALIGNED — SSE-oriented, not production-ready (RC.8) |
| Alpine.js rejected | `research-minimal-frontend.md` Section 3 | ALIGNED — CSP risks with MV3 eval restrictions |
| Vite 8 support | `research-latest-lib-versions.md` Section 1 | ALIGNED — WXT 0.20.19 supports Vite 8 |
| Vitest 4.x for testing | `research-latest-lib-versions.md` Section 4 | ALIGNED — Vite 8 support confirmed |
| Playwright for E2E | `research-extension-testing.md` Section 3 | ALIGNED — only viable option for extension E2E |
| Adapter pattern for core | `technical-research.md` Section 7, `research-claude-teach-skills.md` Section 5 | ALIGNED — enables MCP/Claude Code reuse |

All major technical decisions trace cleanly to research findings. No decision contradicts its research basis.

---

## 5. Scope Clarity Validation

**Score: 97/100 — Exemplary.**

The PRD provides one of the clearest scope boundaries I have seen:

1. **Explicit in-scope checklist** (Section 10) with 19 items
2. **Explicit out-of-scope list** (Section 10) with 19 items
3. **Rationale for every deferral** (Section 5.2) — each deferred feature has a "Rationale for Deferral" explaining why
4. **"Never" items** — collaboration, cloud sync, and user accounts are explicitly marked as "Never (v1)" with philosophy-based rationale
5. **Release roadmap** (Section 11) showing when deferred items are planned
6. **Data model future-proofing** (Section 8.4) — the export format mapping table shows which fields are needed for each future export, proving the data model is ready

The three-verb definition ("Record, Edit, Export") in Section 1.3 is an effective scope anchor that makes boundary decisions intuitive.

**Only gap:** The distinction between "Should" and "Must" priorities in the FR tables could be sharper. FR-2.6 (drag-and-drop) is "Should" — does this mean it ships in v1.0 if time permits, or is it deferred to v1.1? The priority definitions are not documented.

---

## 6. Technical Feasibility Validation

### Technology Compatibility Matrix

| Component | Version | Compatible With | Verified? |
|-----------|---------|----------------|-----------|
| WXT | 0.20.19+ | Vite 8 | Yes (`research-latest-lib-versions.md`) |
| Vite | 8.0.x | WXT 0.20.19+ | Yes |
| Lit | 3.3.2 | Vite 8 (agnostic) | Yes |
| Vitest | 4.1.0 | Vite 8 | Yes |
| Playwright | 1.58.2 | Chrome extensions | Yes (persistent context + `--load-extension`) |
| PicoCSS | 2.1.1 | Pure CSS, no build deps | Yes |
| TypeScript | 5.x | WXT, Lit | Yes |
| Chrome MV3 | Chrome 120+ | Side Panel, `captureVisibleTab` | Yes |

All technology choices are compatible. No dependency conflicts identified.

### Feasibility Concerns

**FINDING-6: `tabs` permission may not be needed.**

Section 8.5 lists `activeTab` and `tabs` as separate permissions. The `tabs` permission grants access to `tab.url` and `tab.title` on all tabs. However, `activeTab` already provides access to the URL and title of the active tab when the user invokes the extension. If the extension only operates on the active tab (which the PRD implies), `tabs` may be an unnecessary permission escalation.

The research (`research-extension-performance.md` Section 2.2) recommends minimizing permissions. Scribe's manifest analysis shows it does use `tabs`, but SOP Recorder's privacy-first positioning would benefit from requesting fewer permissions.

**Recommendation:** Evaluate whether `activeTab` + `scripting` is sufficient without `tabs`. If `tabs` is needed only for `chrome.tabs.captureVisibleTab()`, note that this API works with `activeTab` permission. The `tabs` permission would be needed if the extension needs to query non-active tabs or read URLs of background tabs.

**Severity:** Medium — affects CWS permission prompt and user trust. Worth investigating during implementation.

### Architecture Feasibility

The core-shell adapter pattern is well-designed and feasible:
- Pure TS core with no Chrome deps is testable and portable
- Adapter interfaces for storage, screenshot, messaging are standard patterns
- The data model's `RecordedStep` interface captures all fields needed for documented future exports
- IndexedDB for blob storage avoids the `chrome.storage.local` 10 MB quota issue

The Lit + PicoCSS + light DOM approach is sound for the side panel use case. Light DOM avoids Shadow DOM CSS isolation issues while still providing Lit's reactive templating benefits.

---

## 7. Research Alignment Validation

### Decisions Reflecting Research

| Research Finding | PRD Integration | Score |
|-----------------|-----------------|-------|
| Plasmo in maintenance mode | WXT chosen as framework | Fully reflected |
| Local-first is #1 differentiator | Core architecture principle, zero network permissions | Fully reflected |
| IT runbooks as beachhead market | Primary persona is IT Support Lead | Fully reflected |
| JPEG quality 85 sweet spot | FR-1.7, NFR 6.1 | Fully reflected |
| Content script must be tiny | NFR: < 50 KB, dynamic imports | Fully reflected |
| rrweb adds 40-50 KB overhead for low value | Custom event listeners chosen | Fully reflected |
| Multiple selector strategies (DevTools Recorder pattern) | FR-1.9, data model | Fully reflected |
| Dual-output convergence trend | "Record once, deploy everywhere" differentiator | Fully reflected |
| No existing local-first SOP recorder | Market positioning confirmed | Fully reflected |
| Scribe paywalls editing | "Full editing, always free" differentiator | Fully reflected |
| MV3 side panel API stable at Chrome 116+ | Chrome 120+ minimum specified | Fully reflected |
| Tailwind + Shadow DOM conflicts | PicoCSS chosen instead | Fully reflected |
| Alpine.js CSP risks in MV3 | Alpine.js rejected | Fully reflected |
| Datastar not production-ready | Datastar rejected | Fully reflected |
| Vite 8 released, WXT supports it | Version targets updated | Fully reflected |

### Research Findings Not Reflected (Acceptable Omissions)

| Research Finding | Status | Assessment |
|-----------------|--------|------------|
| Chrome Built-in AI (Gemini Nano) details | Mentioned in v2 roadmap only | Acceptable — uncertain availability |
| Context7/MCP documentation tools | Not referenced | Acceptable — development tooling, not product feature |
| Screen Studio / Loom video approaches | Video deferred to v2 | Acceptable — consistent with scope |
| Notion organization publishing (Feb 2026) | Not mentioned in distribution | Minor omission — could enhance enterprise positioning |
| `web-ext lint` for manifest validation | Not mentioned in testing section | Minor omission — useful CI addition |

---

## Findings Summary

| ID | Finding | Severity | Category |
|----|---------|----------|----------|
| F-1 | Lit bundle size stated as "~7 KB" without specifying gzipped vs minified | Cosmetic | Consistency |
| F-2 | PicoCSS size inconsistent (3-4 KB vs 10 KB) between sections | Cosmetic | Consistency |
| F-3 | North Star metric (SOPs exported/week) is unmeasurable without telemetry | Low | Measurability |
| F-4 | FR-2.6 does not specify native HTML5 DnD API per user preference | Medium | Consistency / User Preference |
| F-5 | No explicit error handling / edge case section for recording failures | Low | Completeness |
| F-6 | `tabs` permission may be unnecessary; evaluate `activeTab` sufficiency | Medium | Technical Feasibility |

### No Blockers Found

All findings are addressable without structural changes to the PRD. The document is suitable for implementation as-is, with the findings noted for developer awareness.

---

## Recommendations

### Priority 1 (Address Before Implementation)

1. **FR-2.6 DnD specification**: Add note to FR-2.6 specifying "native HTML5 Drag and Drop API, no external library (SortableJS rejected)." This prevents the developer from making a library choice that contradicts user preferences.

2. **`tabs` permission evaluation**: Verify during initial scaffold whether `activeTab` alone is sufficient. If so, remove `tabs` from the permissions list to strengthen the privacy positioning.

### Priority 2 (Address During Implementation)

3. **North Star metric**: Change to "CWS weekly active users" as proxy, or document that the metric is aspirational and measured indirectly.

4. **Error handling guidance**: Add a brief section or notes to relevant FRs covering behavior when `captureVisibleTab()` fails, when protected pages are encountered, and when storage quota is approached.

### Priority 3 (Nice to Have)

5. **Size clarifications**: Standardize Lit as "~6 KB gzipped" and PicoCSS classless as "~4 KB gzipped" throughout.

6. **Add `web-ext lint`** to the CI pipeline alongside the custom manifest validation test.

---

## Conclusion

The SOP Recorder PRD v2.0 is a **well-researched, comprehensive, and implementation-ready document**. It demonstrates strong alignment between market research, technical research, user needs, and architectural decisions. The scope boundaries are exceptionally clear, the technical stack is verified compatible, and the data model is thoughtfully future-proofed for planned export formats.

The six findings identified are all addressable without restructuring and none block implementation. The PRD achieves its goal of being a complete specification that a developer agent can execute against.

**Verdict: APPROVED for implementation.**
