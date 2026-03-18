# Domain Research: SOP Recorder

> **Project**: SOP Recorder — Chrome extension for recording browser-based SOPs with screenshots
> **Date**: 2026-03-18
> **Research Type**: Domain Analysis for Product Planning

---

## 1. SOP Documentation Standards

### What Makes a Good SOP

A well-structured SOP contains these essential components:

| Component | Purpose |
|-----------|---------|
| **Title & Purpose** | Why the procedure exists and the outcomes it achieves |
| **Scope** | Where and when the SOP applies |
| **Roles & Responsibilities** | Who executes each task |
| **Procedure Steps** | Step-by-step instructions with numbered actions |
| **Visual Aids** | Screenshots, flowcharts, diagrams for clarity |
| **Version Control** | Revision history, approval signatures, review dates |
| **Review Cycle** | When and by whom the document is reviewed (typically every 6-12 months) |

### Industry Standards

**ISO 9001 (Quality Management)**:
- Requires documented processes for any activity affecting product/service quality
- Emphasizes a process-based approach to reduce variability
- SOPs must facilitate training, onboarding, and performance evaluation
- Annual document review is the minimum recommended cadence

**FDA / GxP (Pharmaceuticals & Medical Devices)**:
- SOP deficiencies are one of the top 5 findings in FDA audits
- Formal written SOPs are required by both FDA and EMA
- Almost every deficiency in FDA 483s and Warning Letters traces back to SOP issues
- Must include verification steps, required approvals, and documentation checkpoints

**ISO 13485 (Medical Devices)**:
- Mandates SOPs for quality management processes
- Requires traceability between procedures and regulatory requirements

### SOP Formats in Practice

Three common formats exist in industry:

1. **Simple/Linear** — Numbered step lists with screenshots (most common for IT runbooks)
2. **Hierarchical** — Nested steps with decision points and branching (FDA/pharma)
3. **Flowchart-based** — Visual decision trees alongside procedural text (manufacturing)

### Implications for SOP Recorder

- The extension's **Markdown + screenshots** output aligns with the Simple/Linear format, which is the most widely used for browser-based workflows
- Adding **metadata fields** (purpose, scope, roles, version) to exports would elevate output to professional-grade SOPs
- A **review date / expiry reminder** feature would address the ISO 9001 review cycle requirement
- **Step numbering with sub-steps** is expected by professionals; flat lists are insufficient for complex procedures

---

## 2. Chrome Extension Ecosystem

### Manifest V3 Adoption Status

MV3 migration is now complete and mandatory:

| Milestone | Date |
|-----------|------|
| MV2 disabled by default for all Chrome users | March 31, 2025 |
| MV2 disabled everywhere (Chrome 138) | July 24, 2025 |
| MV2 support fully removed (Chrome 139) | August 2025 |
| `ExtensionManifestV2Availability` policy discontinued | June 2025 |

As of 2026, nine out of ten new extensions are being uploaded as MV3. Firefox continues to support both MV2 and MV3 concurrently.

### Framework Comparison: Plasmo vs WXT vs Raw MV3

| Factor | Plasmo | WXT | Raw MV3 |
|--------|--------|-----|---------|
| **UI Framework** | React-first | Framework-agnostic (React, Vue, Svelte, Solid) | Any |
| **Build Size** | ~800 KB | ~400 KB (43% smaller) | Minimal |
| **HMR Support** | Good | Excellent (even for service workers) | Manual |
| **Multi-browser** | Chrome-focused | Chrome, Firefox, Safari, Edge | Manual porting |
| **Maintenance Status** | Declining — team focused on commercial products (Itero, BPP) | Active community, growing adoption | N/A |
| **GitHub Stars** | 12.3k | Growing rapidly | N/A |
| **TypeScript** | Good | Excellent | Manual setup |

**Critical Finding**: Plasmo appears to be in maintenance mode as of early 2026. Active feature development has slowed significantly as the team focuses on commercial products. WXT is now the recommended framework for new projects.

**Risk Assessment for SOP Recorder**: The project currently uses Plasmo. While it works today, the declining maintenance poses a medium-term risk. Migration to WXT should be considered for v2 but is not urgent for MVP since Plasmo's core functionality remains stable.

### Enterprise Distribution

**New in 2026**: Google launched "organization publishing" (February 19, 2026) allowing developers to privately deploy extensions to external organizations via an approval link system. This removes the previous barrier where private publishing was limited to the developer's own domain.

Enterprise deployment options:
- **Chrome Web Store (Public)** — Standard distribution, review process required
- **Chrome Web Store (Unlisted)** — Direct link only, still hosted by Google
- **Organization Publishing (New)** — Private deployment to approved external organizations
- **Force-install via Policy** — IT admins can silently install via Group Policy / MDM
- **Self-hosted (.crx)** — Possible but Chrome warns users aggressively; not recommended

### Implications for SOP Recorder

- Plasmo is viable for MVP but WXT migration should be planned for post-launch
- The new organization publishing feature is a significant opportunity for B2B distribution
- Enterprise customers expect policy-manageable extensions (force-install, allowlist compatibility)
- Extension size matters for enterprise deployment — keeping the bundle lean is important

---

## 3. Browser Automation & Recording

### DOM Event Capture Patterns

Best practices from the competitive landscape and open-source projects:

**Event Listening Strategy**:
- Capture at the document level using event delegation (`addEventListener` on `document` with `capture: true`)
- Filter with `e.isTrusted` to exclude synthetic events
- Debounce high-frequency events (input, scroll) at 300-500ms
- Deduplicate clicks on the same target within 500ms
- Filter drag movements (>50px) from click events

**Element Identification (Selector Generation)**:
Priority chain used by production tools:
1. `id` attribute
2. `data-testid` / `data-cy` (testing selectors)
3. `aria-label` / `aria-labelledby`
4. `name` attribute (for form elements)
5. CSS class + tag combination
6. `nth-of-type` fallback

**Accessible Name Extraction**:
Following WAI-ARIA spec:
1. `aria-label`
2. `aria-labelledby` (resolved)
3. `<label for="...">` association
4. `textContent` (trimmed, max length)
5. `title` attribute
6. `placeholder` (for inputs)

### Screenshot Capture Strategies

| Method | Pros | Cons |
|--------|------|------|
| **`chrome.tabs.captureVisibleTab()`** | Simple, reliable, MV3-native | Viewport only, no full-page |
| **CDP `Page.captureScreenshot`** (via `chrome.debugger`) | Full-page, element-specific, clip regions | Requires `debugger` permission, triggers warning bar |
| **`tabCapture` + OffscreenDocument** | Video recording, stream-based | Complex lifecycle, blob URL expiry issues |
| **Canvas-based (`html2canvas`)** | No special permissions | Inaccurate rendering, cross-origin issues, slow |

**MV3-specific considerations**:
- `chrome.tabCapture` now works from service workers (Chrome 116+): obtain stream ID in service worker, pass to offscreen document for recording
- Stream IDs are single-use and expire within seconds if unused
- All media work must happen inside offscreen documents (service workers lack DOM access and can be suspended)
- The offscreen document has limited `chrome.*` API access

### CDP vs Extension APIs

| Capability | Extension APIs | CDP (via chrome.debugger) |
|------------|---------------|---------------------------|
| Viewport screenshot | `tabs.captureVisibleTab()` | `Page.captureScreenshot` |
| Full-page screenshot | Not available | `Page.captureScreenshot({captureBeyondViewport: true})` |
| Element screenshot | Not available | `Page.captureScreenshot` with clip |
| Shadow DOM access | Limited | Full access |
| iframe content | Restricted by same-origin | Full access |
| User perception | Transparent | Shows "Extension is debugging" bar |

**Recommendation**: For SOP Recorder MVP, `chrome.tabs.captureVisibleTab()` is the right choice — simple, reliable, no warning bar. CDP-based full-page screenshots can be a v2 feature for power users willing to accept the debugger bar.

### Screenshot Timing

A 200-300ms delay after event capture allows DOM updates to settle before screenshot. This is a practical compromise used by most recording tools. Claude in Chrome uses a `HIDE_FOR_TOOL_USE` / `SHOW_AFTER_TOOL_USE` messaging pattern to hide its own overlay before capturing.

---

## 4. Process Documentation Tools Domain

### Market Landscape

The process documentation market has consolidated around several tiers:

**Tier 1: Automated Capture Tools (Direct Competitors)**

| Tool | Model | Key Feature | Privacy Model |
|------|-------|-------------|---------------|
| **Scribe** | Freemium SaaS | AI-powered documentation, desktop + browser capture, PII redaction | Cloud-first, HIPAA available |
| **Tango** | Freemium SaaS | Interactive in-app walkthroughs, real-time guidance | Cloud-first |
| **Guidde** | SaaS | Video-based documentation with AI narration | Cloud |
| **ScreenSnap** | SaaS | Browser-based capture with step generation | Cloud |
| **Glitter AI** | SaaS | AI-enhanced step documentation | Cloud |
| **MagicHow** | Free | Visual step-by-step guide automation | Cloud |

**Tier 2: Desktop-First / Privacy-Focused**

| Tool | Model | Key Feature | Privacy Model |
|------|-------|-------------|---------------|
| **FlowShare** | Commercial | Offline-first, local storage, step capture | Local-first (Windows only) |
| **Folge** | One-time purchase | Desktop app, annotation tools, multi-format export | Fully offline |
| **Workmap** | Open source | Chrome extension, Markdown export, ~80% SOP Recorder feature parity | Local |

**Tier 3: Digital Adoption Platforms (DAPs)**

| Tool | Model | Key Feature |
|------|-------|-------------|
| **Whatfix** | Enterprise SaaS | In-app guidance, tooltips, automation |
| **WalkMe** | Enterprise SaaS | Digital adoption at scale |
| **Pendo** | Enterprise SaaS | Product analytics + in-app guides |

**Tier 4: Knowledge Management (Integration Targets)**

| Tool | SOP Relevance |
|------|---------------|
| **Confluence** | Wiki-based SOPs, widely used in enterprise IT |
| **SharePoint** | Document management with versioning, Microsoft ecosystem |
| **Notion** | Flexible docs/databases, popular with startups and SMBs |
| **Guru** | Knowledge management with verification workflows |
| **Tettra** | Internal knowledge base with Slack integration |

### Market Positioning Insight

The market splits along two axes:

- **Format vs. Flow**: Scribe optimizes for a *library of verified documents* (compliance, training). Tango optimizes for *in-app coaching* (digital adoption, real-time guidance).
- **Cloud vs. Local**: Nearly all tools are cloud-first SaaS. The local-first / privacy-conscious segment is underserved, with only FlowShare (Windows-only desktop app) and Folge (desktop app) offering offline operation.

### Integration Points

Enterprise SOP workflows typically involve:
1. **Capture** (browser extension / desktop app)
2. **Edit & Annotate** (in-tool or export to editor)
3. **Review & Approve** (Confluence, SharePoint, or dedicated QMS)
4. **Distribute** (knowledge base, LMS, or wiki)
5. **Track & Update** (version control, review reminders)

Key integration opportunities for SOP Recorder:
- **Export formats**: Markdown, HTML, PDF, DOCX
- **Direct publish**: Confluence API, Notion API, SharePoint
- **Clipboard**: Copy-paste formatted content with embedded images
- **File system**: Local save via `chrome.downloads` or nativeMessaging

### Implications for SOP Recorder

- **Unique positioning**: Local-first, open-source, privacy-focused Chrome extension for SOP capture. No direct competitor occupies this exact niche.
- **FlowShare** is the closest privacy-first competitor but is Windows-only desktop software — not a browser extension.
- **Workmap** (open source Chrome extension) covers ~80% of core features but lacks AI enhancement, annotation, and professional SOP formatting.
- The biggest gap in the market is a **local-first browser extension** that produces **compliance-grade output** — this is the opportunity.

---

## 5. Privacy & Data Handling

### The Screenshot PII Problem

Screenshots captured during SOP recording may contain:
- **Personal data**: Names, email addresses, phone numbers visible on screen
- **Financial data**: Account numbers, transaction amounts, pricing
- **Health data**: Patient records, medical information (HIPAA/PHI)
- **Authentication data**: Session tokens in URLs, partially visible passwords
- **Business confidential**: Internal dashboards, unreleased product information
- **Third-party data**: Customer information visible in CRM/support tools

### GDPR Implications

| GDPR Principle | Impact on SOP Recorder |
|----------------|----------------------|
| **Data Minimization** | Capture only what's necessary; avoid recording unnecessary PII |
| **Purpose Limitation** | Screenshots must be used only for documentation purposes |
| **Storage Limitation** | Data should not be retained longer than necessary |
| **Right to Erasure** | Users must be able to delete all captured data |
| **Data Protection by Design** | Privacy must be built into the architecture, not bolted on |
| **Lawful Basis** | Organizations need legitimate interest or consent for capturing employee screens |

### SOC 2 Trust Services Criteria

| Criterion | Relevance |
|-----------|-----------|
| **Security** | How is captured data protected at rest and in transit? |
| **Availability** | Local-first architecture avoids cloud availability concerns |
| **Processing Integrity** | Data must not be altered during capture/export |
| **Confidentiality** | Screenshots may contain confidential business data |
| **Privacy** | PII handling throughout lifecycle: collection, use, retention, disclosure, disposal |

### Local-First Architecture Advantages

A local-first design provides significant compliance benefits:

| Advantage | Detail |
|-----------|--------|
| **No data transmission** | Screenshots never leave the user's device unless explicitly exported |
| **No server-side storage** | Eliminates cloud breach risk entirely |
| **No cross-border data transfer** | Avoids GDPR Article 44-49 international transfer restrictions |
| **User controls data lifecycle** | Deletion is immediate and verifiable |
| **No vendor lock-in** | Data is in standard formats (PNG, Markdown) on local filesystem |
| **Simplified compliance** | No need for Data Processing Agreements (DPAs) with cloud providers |
| **Reduced audit scope** | SOC 2 / ISO 27001 audit scope is dramatically smaller |

### Privacy-Enhancing Features to Consider

1. **Password masking** (already implemented): Values masked as `--------`
2. **PII auto-redaction**: Detect and blur email addresses, phone numbers, SSNs in screenshots before storage
3. **Selective capture**: Let users pause recording before entering sensitive data
4. **Screenshot review before save**: Preview and delete/redact before finalizing
5. **No analytics / telemetry**: Zero data collection about user behavior
6. **Encryption at rest**: Encrypt stored recordings in `chrome.storage.local`
7. **Auto-expiry**: Optional TTL for stored recordings

### AI Integration Privacy Considerations

When AI enhancement is added (BYOK model):
- Data is sent to the user's chosen API endpoint — **user assumes responsibility**
- The extension should clearly warn users before sending screenshot data to any API
- Offer text-only AI enhancement (send step descriptions, not images) as a privacy-conscious option
- Document which AI providers have no-training guarantees (Groq, Fireworks per project research)

### Implications for SOP Recorder

- **Local-first is the single strongest differentiator** against cloud-first competitors
- Marketing should emphasize: "Your screenshots never leave your device"
- Password masking is already implemented — extend to broader PII detection
- The BYOK AI approach is privacy-responsible but needs clear user consent flows
- For enterprise sales, a simple privacy architecture document showing "no cloud, no servers, no data collection" dramatically simplifies procurement

---

## 6. Regulatory & Compliance Requirements by Industry

### Industries That Mandate SOP Documentation

#### Healthcare & Pharmaceuticals

| Regulation | Requirement |
|------------|-------------|
| **FDA 21 CFR Part 211** | Current Good Manufacturing Practice (cGMP) — requires written procedures for production and process controls |
| **FDA 21 CFR Part 820** | Quality System Regulation for medical devices — mandates documented procedures |
| **HIPAA** | Requires documented procedures for handling protected health information |
| **EU GxP / EMA** | Good Practice guidelines require formal SOPs for all quality-affecting processes |
| **ISO 13485** | Medical device QMS — mandates documented procedures with traceability |

Key characteristics:
- SOPs must be **formally approved** with signatures and dates
- **Training records** proving employees understand SOPs are mandatory
- **Change control** processes required for SOP updates
- **Audit trail** of who changed what and when
- Review cycle: **every 6-12 months** minimum

#### Finance & Banking

| Regulation | Requirement |
|------------|-------------|
| **SOX (Sarbanes-Oxley)** | Internal controls documentation for financial reporting processes |
| **PCI DSS** | Documented procedures for handling payment card data |
| **Basel III** | Risk management procedures must be documented |
| **AML/KYC** | Anti-money laundering procedures require documented SOPs |

Key characteristics:
- Focus on **internal controls** and **segregation of duties**
- **Audit evidence** requirements — procedures must be demonstrably followed
- **Data retention** requirements (typically 5-7 years for financial records)

#### Manufacturing

| Standard | Requirement |
|----------|-------------|
| **ISO 9001** | Quality management system with documented procedures |
| **ISO 14001** | Environmental management SOPs |
| **ISO 45001** | Occupational health and safety procedures |
| **HACCP** | Food safety critical control points documented as SOPs |
| **IATF 16949** | Automotive quality management with detailed work instructions |

Key characteristics:
- **Visual work instructions** (with photos/diagrams) are standard practice
- **Multi-language** support often required for shop floor workers
- **Revision control** with clear supersession of old versions

#### IT & Technology

| Framework | Requirement |
|-----------|-------------|
| **SOC 2** | Documented security and privacy procedures |
| **ISO 27001** | Information security management SOPs |
| **ITIL** | IT service management runbooks and procedures |
| **NIST CSF** | Cybersecurity procedures and incident response playbooks |

Key characteristics:
- **Runbook format** is preferred (step-by-step with screenshots)
- **Automation integration** — SOPs often reference scripts or tools
- **Living documents** — updated frequently as systems change

### Common Compliance SOP Requirements

Across all regulated industries, compliance SOPs share these attributes:

1. **Document Control**
   - Unique document ID
   - Version number and revision history
   - Effective date and review date
   - Author, reviewer, and approver names with signatures

2. **Content Structure**
   - Purpose and scope statement
   - Definitions of key terms
   - Prerequisites and safety warnings
   - Numbered procedural steps
   - Expected outcomes / verification criteria
   - Exception handling / troubleshooting
   - References to related documents

3. **Training & Acknowledgment**
   - Training records tied to each SOP
   - Read-and-understood acknowledgments
   - Competency assessments

4. **Review & Maintenance**
   - Scheduled review every 6-12 months
   - Triggered review on process changes, incidents, or regulatory updates
   - Retirement / archival process for obsolete SOPs

### Implications for SOP Recorder

- **IT/Technology runbooks** are the most natural fit — browser-based workflows with screenshots match the runbook format exactly
- **Healthcare and pharma** require formal document control (signatures, approvals, change history) that goes beyond simple capture — integration with QMS tools (MasterControl, Veeva) would be needed for this market
- **Manufacturing visual work instructions** validate the screenshot-centric approach
- **Export metadata** should include: document ID, version, date, author — enabling downstream compliance workflows
- The tool does not need to be a full QMS — but its output should be **QMS-ingestible** (structured Markdown/HTML that can be imported into Confluence, SharePoint, or dedicated QMS platforms)

---

## Research Synthesis

### Key Findings

1. **Market Gap Confirmed**: No local-first, open-source, privacy-focused Chrome extension exists for professional SOP capture. FlowShare (Windows desktop) and Folge (desktop) are the closest privacy-first alternatives but are not browser extensions.

2. **Plasmo Risk**: The framework is entering maintenance mode. Plan for WXT migration post-MVP but do not let this block shipping.

3. **Local-First is the Differentiator**: In a market where every competitor is cloud-first SaaS, local-first architecture is both a privacy advantage and a compliance simplifier. This should be the primary marketing message.

4. **IT Runbooks are the Beachhead**: Browser-based IT workflows (SaaS admin, DevOps dashboards, support processes) are the natural first market. These teams value screenshots + steps, need no formal QMS integration, and are technically sophisticated enough to install a Chrome extension.

5. **Compliance-Grade Output is the Upsell**: Adding document metadata (ID, version, date, author, review date) to exports transforms casual documentation into compliance-ready SOPs — minimal engineering effort, significant value increase.

6. **PII in Screenshots is the Elephant in the Room**: Any tool capturing screenshots will inevitably capture PII. Local-first architecture mitigates this significantly, but auto-redaction and user-controlled masking should be on the roadmap.

7. **MV3 Screenshot Strategy is Settled**: `chrome.tabs.captureVisibleTab()` for MVP (simple, reliable, no warning bar). CDP-based full-page screenshots for v2.

### Strategic Recommendations

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| **P0** | Ship MVP with local-first, Markdown + ZIP export | Validates market, establishes privacy positioning |
| **P1** | Add SOP metadata to exports (title, version, date, author, scope) | Elevates output from "screenshots" to "SOPs" |
| **P1** | Screenshot review/delete before export | Privacy control for PII-containing captures |
| **P2** | PII auto-detection and blur in screenshots | Addresses compliance concerns proactively |
| **P2** | Confluence/Notion export integration | Where enterprise SOPs actually live |
| **P3** | WXT migration | Framework sustainability |
| **P3** | BYOK AI step enhancement | Differentiator, but not core value |

### Competitive Moat

The defensible position for SOP Recorder is the intersection of:
- **Local-first** (privacy, compliance simplicity)
- **Open source** (trust, auditability, enterprise procurement)
- **Browser-native** (no desktop app install, cross-platform)
- **Professional output** (compliance-grade SOP format, not just screenshots)

No existing tool combines all four.

---

## Sources

- [Creating standard operating procedures for QM - Johner Institute](https://blog.johner-institute.com/quality-management-iso-13485/standard-operating-procedures-quality-management/)
- [Ultimate SOP Guide - Process Street](https://www.process.st/sop/)
- [How to Create & Implement ISO SOPs - GoAudits](https://goaudits.com/blog/iso-sop/)
- [Standard Operating Procedures in 2025 - VisualSP](https://www.visualsp.com/blog/standard-operating-procedures/)
- [How to Write SOPs - Smartsheet](https://www.smartsheet.com/content/standard-operating-procedures-manual)
- [SOP Full Implementation Guide - Tractian](https://tractian.com/en/blog/standard-operating-procedure-sop-full-guide-to-apply-it)
- [MV2 vs MV3: What Changed - Medium](https://medium.com/@idmossab/nifest-v2-vs-manifest-v3-chrome-extensions-what-changed-and-why-2025-was-the-turning-point-53b031b70fc6)
- [Chrome MV3 Transition Timeline - Chrome for Developers](https://developer.chrome.com/blog/mv2-transition/)
- [Best Browser Extension Framework: WXT vs Plasmo - Kite Metric](https://kitemetric.com/blogs/how-to-choose-the-best-browser-extension-framework)
- [2025 State of Browser Extension Frameworks - Redreamality](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Chrome Extension Framework Comparison 2025 - DevKit.best](https://www.devkit.best/blog/mdx/chrome-extension-framework-comparison-2025)
- [Top 5 Chrome Extension Frameworks 2026 - ExtensionBooster](https://extensionbooster.com/blog/best-chrome-extension-frameworks-compared/)
- [WXT vs Plasmo Migration Discussion - GitHub](https://github.com/wxt-dev/wxt/discussions/782)
- [Migrating from Plasmo to WXT - Jetwriter AI](https://jetwriter.ai/blog/migrate-plasmo-to-wxt)
- [Building a Chrome Extension That Records and Replays Web Interactions - Medium](https://djajafer.medium.com/building-a-chrome-extension-that-records-and-replays-web-interactions-11a548271125)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [How to build a Chrome recording extension using tabCapture API - Recall.ai](https://www.recall.ai/blog/how-to-build-a-chrome-recording-extension)
- [chrome.tabCapture API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- [Scribe vs Tango Comparison 2026 - Docsie](https://www.docsie.io/blog/articles/scribe-vs-tango-comparison-2026/)
- [Best Process Documentation Tools 2026 - ScreenSnap](https://www.screensnap.pro/blog/best-process-documentation-tools)
- [Best Tango Alternatives 2026 - Glitter AI](https://www.glitter.io/blog/process-documentation/best-tango-alternatives)
- [18 Best Process Documentation Software 2026 - Digital Project Manager](https://thedigitalprojectmanager.com/tools/best-process-documentation-software/)
- [Scribe vs Tango Enterprise Readiness 2026 - Guidde](https://www.guidde.com/tool-comparison/scribe-vs-tango-enterprise-readiness)
- [SOC 2 Privacy vs GDPR - Linford & Co](https://linfordco.com/blog/gdpr-soc-2/)
- [PII Scanning For SOC 2 Compliance - Soteri](https://soteri.io/blog/pii-scanning-for-soc-2-compliance-a-complete-guide)
- [SOC 2 vs GDPR Explained - Sprinto](https://sprinto.com/blog/soc-2-vs-gdpr/)
- [Compliance in Manufacturing 2025 - Springs](https://springsapps.com/knowledge/compliance-in-manufacturing-the-ultimate-guide-2025)
- [FDA Compliance Requirements Guide - J&J Compliance](https://jjccgroup.org/fda-compliance-requirements-guide/)
- [SOP Guidelines for Life Science Manufacturing - MasterControl](https://www.mastercontrol.com/quality/sop-standard-operating-procedure/guidelines/)
- [What is a Compliance SOP - Glitter AI](https://www.glitter.io/glossary/compliance-sop)
- [Chrome Web Store Enterprise Publishing 2026 - AdwaitX](https://www.adwaitx.com/chrome-web-store-enterprise-publishing/)
- [Enterprise Publishing Options - Chrome for Developers](https://developer.chrome.com/docs/webstore/cws-enterprise)
- [Managing Extensions in Your Enterprise - Google](https://support.google.com/chrome/a/answer/9296680?hl=en)
