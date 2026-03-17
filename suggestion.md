# Reverse-Engineering Claude Chrome & Building Your Own SOP Recorder

Absolutely yes — and someone has already done the hard part of dissecting it. Here's the full breakdown of how it works under the hood and how to build your own.

---

## 🔬 Claude Chrome Extension Internals (Dissected)

The extension's source is just JavaScript — you can read it yourself. But **sshh12** already did a thorough reverse engineering and published it:

> 📄 **[Claude for Chrome Extension Internals (v1.0.56)](https://gist.github.com/sshh12/e352c053627ccbe1636781f73d6d715b)** — GitHub Gist

### How to Read the Source Yourself

```bash
# Method 1: Find the installed extension folder
# macOS:
ls ~/Library/Application\ Support/Google/Chrome/Default/Extensions/

# Method 2: Download CRX and extract
# Go to https://crxextractor.com or https://robwu.nl/crxviewer/
# Paste the Chrome Web Store URL → download → rename .crx to .zip → extract

# Method 3: Install "Chrome Extension Source Viewer" extension
# → Right-click any extension → "View source"
```

The code is minified but readable with any JS beautifier.

---

### Architecture: 3 Layers

```
┌──────────────────────────────────────────────────────┐
│                    SIDE PANEL UI                      │
│            (React app in side_panel.html)             │
└────────────────────┬─────────────────────────────────┘
                     │ chrome.runtime messages
┌────────────────────▼─────────────────────────────────┐
│               BACKGROUND SERVICE WORKER               │
│  • Routes messages between content script & API       │
│  • Manages chrome.debugger (CDP) sessions             │
│  • Handles nativeMessaging to local apps              │
│  • Calls Anthropic API with tool_use loop             │
└────────────────────┬─────────────────────────────────┘
                     │ chrome.debugger (CDP)
┌────────────────────▼─────────────────────────────────┐
│                 CONTENT SCRIPT                        │
│  • Builds accessibility tree (read_page)              │
│  • Maintains window.__claudeElementMap (WeakRef)      │
│  • Handles HIDE_FOR_TOOL_USE / SHOW_AFTER_TOOL_USE    │
│  • Injects element ref IDs (ref_1, ref_2, ...)        │
└──────────────────────────────────────────────────────┘
```

### The Key Internal Tools

| Tool | What It Does | How It Works |
|---|---|---|
| `read_page` | Reads accessibility tree | Extracts `aria-label`, `placeholder`, `title`, `alt`, `<label>`, text content. Assigns persistent `ref_1`, `ref_2`... IDs via `window.__claudeElementMap` (WeakRef) |
| `screenshot` | Captures visible tab | `chrome.debugger` → `Page.captureScreenshot`. Sends `HIDE_FOR_TOOL_USE` first to hide Claude's overlay, then `SHOW_AFTER_TOOL_USE` after |
| `click` | Clicks elements | CDP `Input.dispatchMouseEvent` with coordinate mapping (stores scaling context) |
| `type` | Types text | CDP `Input.dispatchKeyEvent` |
| `scroll` | Scrolls page | `Input.dispatchMouseEvent` with `mouseWheel`, delta = scrollAmount × 100px. **Auto-takes a follow-up screenshot** |
| `navigate` | Goes to URL | Standard `chrome.tabs.update` or CDP `Page.navigate` |
| `find` | NL element search | Claude-exclusive — uses AI to find elements by natural language description |
| `get_page_text` | Extracts page text | Pulls all visible text content from DOM |
| `gif_creator` | Records session GIF | Captures frame sequence during browser operations, exports as animated GIF |
| `shortcuts_execute` | Runs saved workflow | Replays a recorded "Teach Claude" shortcut |
| `shortcuts_list` | Lists workflows | Returns all saved workflow shortcuts |
| `update_plan` | Shows step plan | Displays numbered plan in sidebar for user approval |
| `javascript_tool` | Runs JS | Executes arbitrary JavaScript via CDP `Runtime.evaluate` |

### The "Record Workflow" Mechanism

When you hit record:
1. Content script starts **listening to DOM events** (clicks, inputs, navigation)
2. At each interaction, it captures:
   - **What element** was interacted with (via accessibility tree ref IDs)
   - **What action** was performed (click, type, scroll)
   - **What value** was entered (for inputs)
   - **Screenshot** of the page state
3. These get compiled into a **shortcut** — essentially a sequence of tool calls
4. On replay, Claude executes the same tool calls in order

**The critical insight**: The recording is stored as a **tool call sequence**, not as a human-readable document. That's why there's no "export as SOP" — it was never designed for that.

---

## 🛠️ Building Your Own: The Architecture

Here's how to build a custom solution that does what Claude Chrome does, **plus** exports SOPs with annotated screenshots to local markdown files.

### Option A: Fork Workmap + Add AI (Fastest Path)

**[Workmap](https://github.com/Ajkolaganti/workmap)** already does 80% of what you want. It's open source and records clicks, inputs, navigation with screenshots, exporting as Markdown.

```bash
git clone https://github.com/Ajkolaganti/workmap.git
cd workmap
# Load as unpacked extension in Chrome
```

**What to add:**
1. **Claude API integration** — after recording, send the raw step data + screenshots to Claude API to generate polished SOP prose
2. **Annotation layer** — use Canvas API or Sharp/Jimp to draw arrows, circles, highlights on screenshots before export
3. **nativeMessaging host** — to save files directly to the local filesystem (not just downloads)

### Option B: Build From Scratch with Plasmo + rrweb + MCP (Most Powerful)

```
┌─────────────────────────────────────────────────────────┐
│              YOUR CUSTOM CHROME EXTENSION                │
│                   (Built with Plasmo)                    │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Content      │  │ Background   │  │ Side Panel     │  │
│  │ Script       │  │ Worker       │  │ (React UI)     │  │
│  │              │  │              │  │                │  │
│  │ • rrweb      │  │ • CDP via    │  │ • Record btn   │  │
│  │   recorder   │  │   debugger   │  │ • Step list    │  │
│  │ • Event      │  │ • Screenshot │  │ • Export btn   │  │
│  │   listener   │  │   capture    │  │ • AI enhance   │  │
│  │ • A11y tree  │  │ • Native     │  │   toggle       │  │
│  │   builder    │  │   Messaging  │  │                │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
          ▼                 ▼                   ▼
   ┌──────────────────────────────────────────────────┐
   │              MCP SERVER (Node.js)                 │
   │                                                   │
   │  Tools:                                           │
   │  • record_start / record_stop                     │
   │  • export_sop_markdown(steps, screenshots, path)  │
   │  • annotate_screenshot(img, annotations)          │
   │  • ai_enhance_sop(raw_steps) → polished markdown  │
   │                                                   │
   │  Saves to local filesystem:                       │
   │  ./sops/                                          │
   │    ├── my-workflow-sop.md                          │
   │    └── screenshots/                               │
   │        ├── step-01.png                            │
   │        ├── step-02-annotated.png                  │
   │        └── ...                                    │
   └──────────────────────────────────────────────────┘
```

### Scaffolding the Project

```bash
# 1. Create the Chrome extension with Plasmo
npm create plasmo@latest sop-recorder -- --with-src
cd sop-recorder
npm install rrweb @anthropic-ai/sdk

# 2. Create the MCP server
mkdir mcp-sop-server && cd mcp-sop-server
npm init -y
npm install @modelcontextprotocol/sdk zod sharp
npm install -D typescript @types/node
```

### Key Code Pieces to Steal from Claude Chrome

Based on the reverse engineering, here's what to replicate:

#### 1. Accessibility Tree Builder (like Claude's `read_page`)

```typescript
// content-script.ts — replicate Claude's element mapping
function buildAccessibilityTree(root: Element = document.body) {
  const elements: ElementInfo[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let refId = 0;
  
  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement;
    const info: ElementInfo = {
      ref: `ref_${++refId}`,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role') || el.tagName.toLowerCase(),
      name: el.getAttribute('aria-label') 
         || el.getAttribute('placeholder')
         || el.getAttribute('title')
         || el.getAttribute('alt')
         || el.closest('label')?.textContent?.trim()
         || el.textContent?.trim()?.slice(0, 50) || '',
      rect: el.getBoundingClientRect(),
    };
    // Store with WeakRef like Claude does
    window.__sopElementMap?.set(info.ref, new WeakRef(el));
    elements.push(info);
  }
  return elements;
}
```

#### 2. Screenshot Capture (like Claude's `screenshot`)

```typescript
// background.ts — CDP-based screenshot
async function captureScreenshot(tabId: number): Promise<string> {
  // Attach debugger if not already
  await chrome.debugger.attach({ tabId }, '1.3');
  
  // Hide any overlay (like Claude does with HIDE_FOR_TOOL_USE)
  await chrome.tabs.sendMessage(tabId, { type: 'HIDE_OVERLAY' });
  
  const result = await chrome.debugger.sendCommand(
    { tabId },
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true }
  );
  
  await chrome.tabs.sendMessage(tabId, { type: 'SHOW_OVERLAY' });
  
  return result.data; // base64 PNG
}
```

#### 3. Event Recording (the core "Teach" mechanism)

```typescript
// content-script.ts — record user actions
interface RecordedStep {
  timestamp: number;
  action: 'click' | 'type' | 'navigate' | 'scroll';
  target: {
    ref: string;
    selector: string;
    name: string;       // accessible name
    tagName: string;
  };
  value?: string;       // for type actions
  url?: string;         // for navigate
  screenshot?: string;  // base64 PNG captured after action
  pageTitle: string;
}

function startRecording() {
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const screenshot = await requestScreenshot(); // message to background
    
    steps.push({
      timestamp: Date.now(),
      action: 'click',
      target: {
        ref: getRefId(target),
        selector: generateSelector(target),
        name: getAccessibleName(target),
        tagName: target.tagName,
      },
      screenshot,
      pageTitle: document.title,
    });
  }, true);
  
  // Similar listeners for input, beforeunload (navigation), scroll
}
```

#### 4. SOP Markdown Generator (the NEW part Claude doesn't have)

```typescript
// mcp-sop-server/src/tools/export-sop.ts
function generateSOPMarkdown(
  steps: RecordedStep[], 
  title: string,
  outputDir: string
): string {
  let md = `# SOP: ${title}\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Steps:** ${steps.length}\n\n---\n\n`;
  md += `## Prerequisites\n\n- Browser access to the application\n- Valid credentials\n\n---\n\n`;
  md += `## Procedure\n\n`;
  
  steps.forEach((step, i) => {
    const num = i + 1;
    // Save screenshot to file
    const imgPath = `screenshots/step-${String(num).padStart(2, '0')}.png`;
    fs.writeFileSync(
      path.join(outputDir, imgPath),
      Buffer.from(step.screenshot, 'base64')
    );
    
    md += `### Step ${num}: ${describeAction(step)}\n\n`;
    md += `![Step ${num}](./${imgPath})\n\n`;
    md += `${generateInstruction(step)}\n\n`;
  });
  
  return md;
}

// Use Claude API to enhance raw steps into polished prose
async function aiEnhanceSOP(rawMarkdown: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Rewrite this raw workflow recording as a polished, 
      professional SOP document suitable for non-technical end users. 
      Keep all screenshot references. Add warnings, tips, and 
      expected results for each step.\n\n${rawMarkdown}`
    }]
  });
  return response.content[0].text;
}
```

#### 5. MCP Server (so Claude Code / Cursor can use it)

```typescript
// mcp-sop-server/src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "sop-recorder",
  version: "1.0.0",
});

server.tool(
  "record_workflow",
  "Start/stop recording a browser workflow",
  { action: z.enum(["start", "stop"]) },
  async ({ action }) => { /* send message to extension via nativeMessaging */ }
);

server.tool(
  "export_sop",
  "Export recorded workflow as markdown SOP with screenshots",
  {
    title: z.string(),
    outputPath: z.string(),
    aiEnhance: z.boolean().default(true),
  },
  async ({ title, outputPath, aiEnhance }) => {
    let md = generateSOPMarkdown(recordedSteps, title, outputPath);
    if (aiEnhance) md = await aiEnhanceSOP(md);
    fs.writeFileSync(path.join(outputPath, 'sop.md'), md);
    return { content: [{ type: "text", text: `SOP saved to ${outputPath}/sop.md` }] };
  }
);

server.tool(
  "annotate_step",
  "Add annotation to a step's screenshot",
  {
    stepNumber: z.number(),
    annotations: z.array(z.object({
      type: z.enum(["arrow", "circle", "box", "text"]),
      x: z.number(), y: z.number(),
      label: z.string().optional(),
      color: z.string().default("red"),
    }))
  },
  async ({ stepNumber, annotations }) => { /* use Sharp to draw on image */ }
);
```

---

## 🧱 Open Source Building Blocks

| Component | Tool | Role |
|---|---|---|
| **Extension framework** | [Plasmo](https://github.com/PlasmoHQ/plasmo) | React-based Chrome extension scaffolding with HMR |
| **Session recording** | [rrweb](https://github.com/rrweb-io/rrweb) | Records DOM mutations, clicks, scrolls, inputs |
| **Step recording** | [Workmap](https://github.com/Ajkolaganti/workmap) | Already exports Markdown + screenshots (fork this!) |
| **MCP SDK** | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Build MCP server in TypeScript |
| **Image annotation** | [Sharp](https://sharp.pixelplumbing.com/) or Canvas API | Draw arrows, circles, text on screenshots |
| **AI enhancement** | [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-node) | Turn raw steps into polished SOP prose |
| **Browser API** | [Steel Browser](https://github.com/steel-dev/steel-browser) | Page-to-markdown, screenshots, PDFs |
| **Reverse engineering ref** | [sshh12's Gist](https://gist.github.com/sshh12/e352c053627ccbe1636781f73d6d715b) | Claude Chrome internals documentation |

---

## 🚀 Recommended Path: Fastest to Ship

**Don't build from scratch.** Fork Workmap and add 3 things:

```bash
# 1. Fork & clone
git clone https://github.com/Ajkolaganti/workmap.git sop-recorder
cd sop-recorder

# 2. Add Claude API for AI-enhanced SOP text
npm install @anthropic-ai/sdk

# 3. Add Sharp for screenshot annotation
npm install sharp

# 4. Add nativeMessaging host for direct filesystem saves
# (instead of relying on chrome.downloads)
```

**What Workmap already gives you:**
- ✅ Records every click, input, navigation
- ✅ Captures screenshots at each step
- ✅ Exports as Markdown, JSON, Word, PDF
- ✅ Open source (MIT-like)

**What you add:**
- 🆕 Claude API call to rewrite raw steps as polished SOP prose
- 🆕 Screenshot annotation (arrows, highlights, numbered callouts)
- 🆕 nativeMessaging host to save directly to project folders
- 🆕 MCP server wrapper so Claude Code/Cursor can trigger recording + export
- 🆕 Accessibility tree capture (steal the pattern from Claude Chrome)

This gives you a tool where a user clicks "Record", performs their workflow, clicks "Stop", and gets a polished, annotated SOP markdown file with embedded screenshots saved to their local filesystem — exactly what Claude Chrome's "Teach" feature *should* do but doesn't.


