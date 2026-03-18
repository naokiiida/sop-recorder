# Competitive Analysis: Browser Extensions with Tab Video Recording

**Research Date:** 2026-03-18

---

## 1. Extensions with Browser Tab Video Recording

### 1.1 Screenity (Open Source Reference)

- **Website:** https://screenity.io
- **Source:** https://github.com/alyssaxuu/screenity
- **License:** GPLv3 (v3.0.0+)
- **Chrome Web Store:** Available free, no sign-in required

**Recording Capabilities:**
- Tab, specific area, full desktop, any application window, or camera-only
- Microphone and internal (tab) audio capture
- Push-to-talk mode
- No time limits, no watermarks

**Export Formats:**
- MP4, WebM, GIF
- Direct upload to Google Drive with shareable link generation

**Annotation Features During Recording:**
- Draw anywhere on screen (freehand)
- Text, arrows, shapes overlay
- Cursor highlighting and spotlight mode
- Blur for sensitive content
- AI-powered camera backgrounds (Pro)

**Editing:**
- Built-in trim, crop, audio adjustment
- Multi-scene editing, templates, captions (Pro)
- Smooth zoom effects

**Privacy:** No data collection, no sign-in, fully local processing in self-hosted mode.

---

### 1.2 Loom (Atlassian)

- **Website:** https://www.loom.com
- **Type:** Freemium SaaS, Chrome extension + desktop app

**Recording Modes:**
- Full Screen (entire desktop)
- Current Tab (browser tab only)
- Window
- Camera only (no screen)
- Screen + Camera (picture-in-picture webcam overlay)

**Key Features:**
- Cloud-hosted video with instant shareable links
- View tracking and notifications
- Viewer comments and reactions
- Auto-generated transcripts and captions
- AI-generated summaries

**Limitations (Chrome Extension vs Desktop App):**
- Chrome extension lacks: drawing tools, virtual backgrounds, HD recording
- Desktop app required for advanced features

**Notion Integration:** Can embed Loom videos in Notion pages via link paste (auto-embed).

---

### 1.3 Vidyard

- **Website:** https://www.vidyard.com
- **Type:** Freemium, Chrome/Edge extension + desktop app

**Recording Options:**
- Screen only, Camera only, Screen + Camera
- Entire screen, specific window, or browser tab
- Max resolution: 1080p

**Key Features:**
- AI script generation (for personalized outreach videos)
- Automatic video title generation
- On-screen drawing tools
- Video trimming and stitching
- Animated thumbnail selection
- View tracking with notifications
- Speaker notes on screen

**Primary Use Case:** Sales and marketing video outreach. Less focused on documentation/SOPs.

---

### 1.4 Other Notable Video Recorders

| Extension | Key Differentiator |
|-----------|-------------------|
| **Zight** | Screen recorder with cloud hosting, GIF creation |
| **CocoShot** | Lightweight screen recorder |
| **BetterBugs** | Bug reporting with screen recording |

---

## 2. Extensions Combining Video Recording WITH SOP Generation

This is the critical competitive space. Several tools now combine these capabilities:

### 2.1 Kommodo -- Closest Direct Competitor

- **Website:** https://kommodo.ai
- **Type:** Free Chrome extension + web platform

**How It Works:**
1. Record screen (tab, window, or full desktop) with narration
2. AI automatically converts recording into step-by-step SOP
3. Each SOP step includes: numbered instructions, written text from narration, auto-captured screenshots

**Key Features:**
- Unlimited screen recording, no watermarks, no time limits
- AI transcription during recording
- Interactive guide generation from recordings
- Built-in video editor (trim, cut, annotations)
- Real-time analytics on video/guide consumption
- Google Calendar integration (auto-record scheduled meetings)

**Export/Integration:** Shareable links, embeddable guides. No explicit Notion integration found.

---

### 2.2 Clueso -- Polished Video + Written Guide

- **Website:** https://www.clueso.io
- **Type:** Chrome extension + AI platform

**How It Works:**
1. Record screen via Chrome extension
2. AI generates BOTH a polished video AND a step-by-step written article from the same recording
3. Outputs include: rewritten scripts, AI voiceovers, zoom effects, blurred confidential details, custom branding

**Key Features:**
- Dual output: professional video + annotated screenshot guide
- AI voiceover replacement
- Automatic sensitive data blur
- Export: rich text, Markdown, HTML
- Can host in Zendesk, Intercom, Notion, and other knowledge bases

**SOP Capability:** Basic SOPs in minutes, complex procedures in 1-2 hours vs days with traditional methods.

---

### 2.3 Trupeer AI -- Video-First Documentation

- **Website:** https://www.trupeer.ai
- **Type:** Chrome extension + AI platform

**How It Works:**
1. Record tab, window, or desktop via Chrome extension
2. AI captures speech and actions intelligently
3. Auto-generates transcript, which you edit like a document
4. Export as video SOP + written guide

**Key Features:**
- 50+ language support for AI voiceovers and translation
- Wallpapers, music, zoom effects
- Filler word and pause removal from transcript
- Publish to LMS, Slack, email, or embed in portals

---

### 2.4 GembaDocs -- Manufacturing/Lean-Focused

- **Website:** https://gembadocs.com
- **Type:** Chrome extension + mobile app + web platform

**How It Works:**
1. Record screen or window, add narration
2. Say "next" to segment steps for AI
3. AI cleans up text, timestamps each step linked to video
4. Generates printable SOP alongside video SOP

**Key Features:**
- Voice command step segmentation
- Auto-translation for global teams
- Mobile video SOP recording (portrait mode)
- Each step timestamped and linked to video segment
- Printable SOP output

**Target Market:** Manufacturing, shop floor, lean operations.

---

### 2.5 SweetProcess -- Process Management Platform

- **Website:** https://www.sweetprocess.com
- **Type:** Chrome extension + full SaaS platform

**How It Works:**
1. Click "Capture Procedure" to start recording
2. Extension auto-records actions, clicks, keystrokes with screenshots
3. Review captured steps, edit, rearrange, add media
4. SweetAI suggests clear instructions for each step

**Key Features:**
- Auto-screenshot capture at key actions
- Drag-and-drop step reordering
- SweetAI for instruction refinement
- Upload additional pictures, videos, tables
- Full process management platform (not just capture)

---

### 2.6 Scribe -- Screenshot-Only SOP (No Video Recording)

- **Website:** https://scribe.com
- **Type:** Chrome extension + desktop app

**Important Distinction:** Scribe does NOT record video. It captures screenshots and click events to generate step-by-step guides. No `tabCapture` or `desktopCapture` permissions in its manifest.

**How It Works:**
1. Turn on capture
2. Navigate and click through your workflow
3. Scribe auto-captures annotated screenshots with text instructions
4. Export to PDF, HTML, Markdown, or embed in Notion/Confluence/SharePoint

**Key Features:**
- Auto-redaction for sensitive information
- Embed directly in 1000+ tools including Notion
- Team library with auto-sync when guides update
- Saves teams ~20+ hours/month vs video tutorials

**Permissions (from manifest analysis):** `tabs`, `cookies`, `storage`, `scripting`, `sidePanel`, `alarms`. No recording permissions.

---

### 2.7 Tango -- Step-by-Step Workflow Capture

- **Website:** https://www.tango.ai
- **Status:** Actively operating (as of March 2026), NOT acquired or discontinued
- **Type:** Chrome extension + web platform

**How It Works:**
1. Record desktop or web-based workflows
2. Tango auto-captures screenshots and adds instructions per step
3. Share via web links, PDF exports, or embeds

**Integrations:** Notion, Confluence, GSuite, Zendesk, Guru, Microsoft, and more. Supports iframe embedding.

**AI Features:** Released AI-powered automation for browser-based workflows in April 2025.

**Scale:** 3+ million process guides created, used by Salesforce, Gusto, Rockwell Automation.

---

### 2.8 Float -- Lightweight Workflow Recorder

- **Website:** Available on Chrome Web Store
- **Type:** Chrome extension

**How It Works:**
1. Open target URL, click "Record Workflow"
2. Records browser and captures every click
3. Auto-generates step-by-step workflow
4. Share via link or embed in Google Docs, WordPress

---

## 3. Notion-Connected Recording Extensions

### 3.1 Official Notion Web Clipper
- Clips web pages to Notion databases
- Tag, assign, add notes
- **NO recording features whatsoever**

### 3.2 "Save to Notion" (Third-Party)
- Save articles, emails, tweets, YouTube videos, LinkedIn posts
- Screenshot capture and image upload to Notion
- Text highlighting and extraction
- **NO video/screen recording features**

### 3.3 "Copy To Notion"
- Advanced web clipping
- **NO recording features**

### 3.4 Extensions with Notion Export/Embed Support

| Tool | Notion Integration Method |
|------|--------------------------|
| **Scribe** | Direct embed via iframe, Markdown export |
| **Tango** | Embed via iframe, shareable web links |
| **Clueso** | Export as Markdown/HTML, embed in Notion |
| **Loom** | Auto-embed via link paste |
| **Kommodo** | Shareable links (no direct Notion integration) |
| **Trupeer** | No explicit Notion integration found |
| **GembaDocs** | No explicit Notion integration found |

**Key Finding:** No extension exists that directly records workflows and saves structured SOP data to Notion databases with properties. All integrations are either link embeds or manual export/paste.

---

## 4. Technical Approaches to Tab Recording

### 4.1 `chrome.tabCapture` API (Preferred for Extensions)

**How it works:**
1. Service worker calls `chrome.tabCapture.getMediaStreamId()` after user gesture
2. Returns a stream ID (permission token, not media)
3. Stream ID passed to offscreen document
4. Offscreen document redeems via `navigator.mediaDevices.getUserMedia()`:
   ```javascript
   const stream = await navigator.mediaDevices.getUserMedia({
     audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
     video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }
   });
   ```

**Advantages:**
- No user picker dialog (just one click on extension icon)
- Captures tab audio natively
- Works with offscreen documents for background recording
- Available since Chrome 116 in service workers

**Limitations:**
- Chromium-only (Chrome, Edge, Brave)
- Audio in captured tab is muted to user (like `suppressLocalAudioPlayback`)
- Requires `tabCapture` permission in manifest

---

### 4.2 `getDisplayMedia()` API

**How it works:**
- Standard web platform API
- Shows browser dialog for user to select tab/window/screen

**Advantages:**
- User explicitly chooses what to share (transparency)
- Can capture any window or entire screen
- Works in content scripts

**Disadvantages:**
- Requires 3-4 clicks before recording starts (vs 1 for tabCapture)
- Dialog may appear on wrong monitor with multiple displays
- Recording stops when user navigates away (in content scripts)
- Cannot use from popups (focus loss closes popup)

---

### 4.3 Offscreen Document Pattern

**Why needed:** MV3 service workers cannot:
- Access the DOM
- Use `getUserMedia()` or `MediaRecorder`
- Maintain long-lived connections (may be suspended by Chrome)

**Architecture (3-component model):**

| Component | Role |
|-----------|------|
| **Popup** | User gesture (start/stop buttons) |
| **Background Service Worker** | Orchestration, state management, file saving |
| **Offscreen Document** | Live A/V capture, mixing, MediaRecorder |

**Flow:**
1. User clicks Start in popup
2. Background SW requests stream ID via `tabCapture.getMediaStreamId()`
3. Stream ID sent to offscreen document via messaging
4. Offscreen document captures stream, creates MediaRecorder
5. Recording chunks accumulate in offscreen document (safe from SW suspension)
6. On stop: Blob created, URL sent to background for download

**Offscreen document creation:**
- Reasons: `DISPLAY_MEDIA` or `USER_MEDIA`
- Stays alive while needed
- Hidden from user

---

### 4.4 Audio Capture and Mixing

**Tab Audio:** Captured via `tabCapture` stream (audio track included automatically).

**Microphone Audio:** Captured separately via `getUserMedia({ audio: true })`.

**Mixing (Web Audio API):**
```javascript
function mixAudio(tabStream, micStream) {
  const ctx = new AudioContext();
  const dst = ctx.createMediaStreamDestination();
  ctx.createMediaStreamSource(tabStream).connect(dst);
  ctx.createMediaStreamSource(micStream).connect(dst);
  return new MediaStream([
    ...tabStream.getVideoTracks(),
    ...dst.stream.getAudioTracks()
  ]);
}
```

---

### 4.5 MV3 Service Worker Lifecycle Challenges

| Challenge | Solution |
|-----------|----------|
| SW suspends during idle | Keep recording in offscreen document, not SW |
| SW can't hold MediaStreams | Only pass stream IDs, never raw streams |
| SW can't use DOM APIs | Offscreen document provides DOM context |
| Communication interruption | Use message-based state changes, not polling |
| SW wakes only for events | Use `chrome.alarms` or port-based keepalive if needed |

**MediaRecorder codec:**
```javascript
recorder = new MediaRecorder(stream, {
  mimeType: 'video/webm; codecs=vp8,opus'
});
```

**Important:** Do NOT call `URL.revokeObjectURL(blobUrl)` immediately after creating download -- causes file corruption.

---

## 5. Screenity Deep Dive (Open Source Reference)

### 5.1 Architecture Overview

**Tech Stack:** JavaScript (83.9%), SCSS (7.1%), CSS (5.9%), TypeScript (2.5%)
**Build:** Webpack + Babel
**Manifest:** V3 (version 4.3.3)
**License:** GPLv3

**Source Structure (`src/pages/`):**

| Directory | Purpose |
|-----------|---------|
| `Background/` | Service worker: orchestration, auth, drive, recording management |
| `RecorderOffscreen/` | Offscreen document for MediaRecorder (RecorderOffscreen.jsx) |
| `AudioOffscreen/` | Separate offscreen for audio processing |
| `Content/` | Content script for on-page UI and annotations |
| `Recorder/` | Recording UI and controls |
| `Camera/` | Webcam capture component |
| `Editor/` | Built-in video editor |
| `EditorWebCodecs/` | WebCodecs-based editor (newer, faster) |
| `Region/` | Area selection for region recording |
| `Download/` | Download management page |
| `Permissions/` | Permission request flows |
| `Setup/` | First-run setup |
| `Sandbox/` | Sandboxed iframe for editor |
| `CloudRecorder/` | Cloud recording feature |
| `Backup/` | Recording backup system |
| `Waveform/` | Audio waveform visualization |
| `Playground/` | Testing/development page |

**Background Service Worker Sub-modules:**
- `alarms/` - Timer management
- `auth/` - Google OAuth
- `backup/` - Recording backup
- `drive/` - Google Drive upload
- `listeners/` - Event handlers
- `messaging/` - Inter-component communication
- `modules/` - Core logic modules
- `offscreen/` - Offscreen document management
- `recording/` - Recording lifecycle
- `tabManagement/` - Tab tracking
- `utils/` - Shared utilities

### 5.2 Key Manifest Permissions

```
Required: tabCapture, scripting, activeTab, storage, unlimitedStorage,
          downloads, identity, tabs, system.display
Optional: desktopCapture, offscreen, alarms
Host:     <all_urls>
OAuth2:   Google Drive (drive.file scope)
```

### 5.3 Recording Start/Stop Flow

1. User triggers via popup or keyboard shortcut (Alt+Shift+G)
2. Background SW gets stream ID via `chrome.tabCapture`
3. Creates offscreen document (`RecorderOffscreen`)
4. Passes stream ID to offscreen document
5. Offscreen document captures stream and starts `MediaRecorder`
6. On stop (Alt+Shift+X or UI): MediaRecorder stops, Blob created
7. User can download locally or upload to Google Drive

### 5.4 What We Can Learn from Screenity

1. **Separate offscreen documents for audio vs video** - More resilient architecture
2. **WebCodecs editor** - Modern, performant video editing in-browser
3. **Extensive keyboard shortcuts** (8 commands) - Power user workflow
4. **Cloud recording as separate module** - Clean separation of concerns
5. **Backup system** - Protects against recording loss
6. **Sandbox for editor** - Security isolation for video processing
7. **No sign-in required** - Privacy-first approach lowers adoption barrier

---

## 6. Feature Comparison Matrix

### 6.1 Video Recording Features

| Feature | Screenity | Loom | Vidyard | Kommodo | Clueso | Trupeer |
|---------|-----------|------|---------|---------|--------|---------|
| Tab recording | Yes | Yes | Yes | Yes | Yes | Yes |
| Full screen | Yes | Yes | Yes | Yes | Yes | Yes |
| Camera overlay | Yes | Yes | Yes | Yes | No | No |
| Tab audio | Yes | Yes | Yes | Yes | Yes | Yes |
| Mic audio | Yes | Yes | Yes | Yes | Yes | Yes |
| Annotations | Yes | No* | Yes | Yes | No | No |
| Max resolution | Unlimited | 720p free | 1080p | Unknown | Unknown | Unknown |
| Time limits | None | 5min free | Varies | None | Unknown | Unknown |
| Local recording | Yes | No | No | Unknown | No | No |
| Open source | Yes | No | No | No | No | No |

*Loom desktop app has drawing tools; Chrome extension does not.

### 6.2 SOP/Documentation Generation

| Feature | Scribe | Tango | Kommodo | Clueso | SweetProcess | GembaDocs |
|---------|--------|-------|---------|--------|--------------|-----------|
| Auto-screenshot capture | Yes | Yes | Yes | Yes | Yes | Yes |
| Video recording | **No** | **No** | Yes | Yes | Yes | Yes |
| AI step generation | Yes | Yes | Yes | Yes | Yes | Yes |
| Step-by-step text guide | Yes | Yes | Yes | Yes | Yes | Yes |
| Video + written output | No | No | Yes | Yes | Yes | Yes |
| Auto-redaction | Yes | No | No | Yes | No | No |
| Notion embed | Yes | Yes | Links only | Export | No | No |
| Markdown export | Yes | No | No | Yes | No | No |
| PDF export | Yes | Yes | No | No | No | Yes |
| Team library | Yes | Yes | No | No | Yes | Yes |
| Free tier | Limited | Limited | Yes | Limited | Limited | Limited |

### 6.3 Notion Integration Depth

| Tool | Integration Level | Method |
|------|------------------|--------|
| Scribe | Medium | Embed iframe, Markdown export |
| Tango | Medium | Embed iframe, shareable links |
| Loom | Low | Auto-embed video via link |
| Clueso | Low | Manual Markdown/HTML paste |
| Notion Web Clipper | N/A | Clips pages, no recording |
| Save to Notion | N/A | Saves web content, no recording |
| **Our Opportunity** | **Deep** | **Direct API: create pages, fill properties, attach recordings** |

---

## 7. Market Positioning Analysis

### 7.1 The Two Camps

The market is clearly split into two camps:

**Camp A: Video Recorders** (Screenity, Loom, Vidyard)
- Focus: High-quality video capture and sharing
- Output: Video files or hosted video links
- No structured data extraction
- No step-by-step documentation

**Camp B: SOP Generators** (Scribe, Tango)
- Focus: Auto-capturing clicks and screenshots
- Output: Annotated screenshot guides
- No video recording
- Text-based step instructions

### 7.2 Emerging "Camp C": Video + SOP Hybrid

A newer category is emerging that combines both:

| Tool | Video | SOP | Maturity | Notion |
|------|-------|-----|----------|--------|
| Kommodo | Yes | Yes | Medium | No |
| Clueso | Yes | Yes | Medium | Export only |
| Trupeer | Yes | Yes | Early | No |
| GembaDocs | Yes | Yes | Medium | No |
| SweetProcess | Yes | Yes | Mature | No |

### 7.3 The Clear Market Gap

**No tool currently offers ALL of:**
1. Browser tab video recording
2. Automatic structured SOP generation with steps
3. Deep Notion integration (direct API to databases with properties)
4. Video attachment to Notion pages alongside structured step data

**The typical user workflow today is fragmented:**
1. Record video with Loom/Screenity
2. Create SOP with Scribe/Tango
3. Manually paste both into Notion
4. Manually fill in Notion database properties

**Our opportunity: A single extension that:**
- Records the browser tab (video)
- Captures click events and screenshots during recording (SOP steps)
- Creates a Notion page with structured properties (title, category, tags, assignee)
- Embeds the video and step-by-step guide in the page body
- All in one workflow, triggered by one recording session

### 7.4 Workflow Model Comparison

| Approach | Tools | Steps for User |
|----------|-------|----------------|
| Video-first, manual SOP | Loom + manual docs | Record -> Watch -> Write SOP -> Paste to Notion |
| SOP-first, no video | Scribe/Tango | Capture -> Review -> Export -> Paste to Notion |
| Hybrid (existing) | Kommodo/Clueso | Record -> AI generates SOP -> Share link |
| **Our approach** | SOP Recorder | Record -> AI generates SOP -> Auto-saves to Notion with video |

---

## 8. Technical Takeaways for Implementation

### 8.1 Recommended Recording Architecture

Based on the research, the recommended approach for our extension:

1. **Use `chrome.tabCapture.getMediaStreamId()`** - One-click recording, no picker dialog
2. **Offscreen document for MediaRecorder** - Survives service worker suspension
3. **Separate audio mixing** in offscreen document if mic + tab audio needed
4. **WebM output** (`video/webm; codecs=vp8,opus`) for recording, convert to MP4 for export
5. **Content script for click/event capture** - Intercepts user actions for SOP step generation

### 8.2 Required Manifest Permissions

```json
{
  "permissions": [
    "tabCapture",
    "activeTab",
    "scripting",
    "storage",
    "offscreen",
    "tabs"
  ],
  "host_permissions": ["<all_urls>"]
}
```

### 8.3 Key Implementation Risks

| Risk | Mitigation |
|------|------------|
| Service worker suspension during recording | All media in offscreen document |
| Large video files | Chunked upload, compression options |
| Notion API rate limits for video upload | Queue uploads, retry with backoff |
| Tab audio muted during recording | Warn user or provide audio passthrough option |
| Cross-browser compatibility | Chromium-only initially (Chrome, Edge, Brave) |

---

## Sources

- [Screenity GitHub Repository](https://github.com/alyssaxuu/screenity)
- [Screenity Website](https://screenity.io)
- [Loom Chrome Extension Support](https://support.atlassian.com/loom/docs/get-started-with-the-loom-chrome-extension/)
- [Vidyard Browser Extension](https://knowledge.vidyard.com/hc/en-us/articles/360009871294)
- [Kommodo AI](https://kommodo.ai)
- [Clueso](https://www.clueso.io)
- [Trupeer AI](https://www.trupeer.ai)
- [GembaDocs Chrome Extension](https://gembadocs.com/learn/product-update-nov-2025/)
- [SweetProcess Chrome Extension](https://www.sweetprocess.com/sweetprocess-chrome-extension/)
- [Scribe Chrome Web Store](https://chromewebstore.google.com/detail/scribe-ai-documentation-s/okfkdaglfjjjfefdcppliegebpoegaii)
- [Tango Integrations](https://help.tango.ai/en/articles/5952635-does-tango-integrate-with-other-tools)
- [How to Build a Chrome Recording Extension (Recall.ai)](https://www.recall.ai/blog/how-to-build-a-chrome-recording-extension)
- [Chrome tabCapture API Docs](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- [Chrome Screen Capture Guide](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture)
- [Notion Web Clipper](https://www.notion.com/web-clipper)
- [Save to Notion](https://www.savetonotion.so/)
