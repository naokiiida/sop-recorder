# Research: Claude Chrome "Teach" Feature — Skills/Shortcuts Architecture

> Date: 2026-03-18
> Source: Reverse engineering of Claude Chrome Extension v1.0.62 (minified JS analysis), MCP tool schema inspection, project-learnings.md

---

## 1. How Claude Chrome "Teach" Records

### Recording Format

The "Teach Claude" feature (internally called "Record Workflow") captures browser interactions as an **array of step objects** stored in React component state. Each step has the following structure:

```typescript
interface WorkflowStep {
  action: "click" | "type" | "navigate";
  selector?: string;           // CSS selector for target element
  value?: string;              // typed text (for "type" actions)
  screenshot?: string;         // base64 screenshot data
  description: string;         // human-readable step description
  url: string;                 // page URL at time of action
  tabId?: number;              // Chrome tab ID
  timestamp: number;           // Unix timestamp
  element?: {                  // element metadata (for clicks)
    tag: string;
    attributes: Record<string, string>;
    boundingRect: { x: number; y: number; width: number; height: number };
  };
  speechTranscript?: string;   // voice narration (optional)
}
```

**Three action types are captured:**
1. **`click`** — captures element selector, bounding rect, screenshot, element tag/attributes, and auto-generates descriptions like "Click on {elementDescription} element"
2. **`type`** — captures typed text, input field selector/name, screenshot. Descriptions include the typed value (truncated at 30 chars) and field name.
3. **`navigate`** — captures URL, page title. Auto-generated on tab changes or explicit navigation.

### Recording Mechanism

The recording hook `n$` (deobfuscated name) manages state with:
- `isRecording` / `isPaused` / `steps[]` / `startTime`
- An `ELEMENT_SELECTOR` message protocol: the sidepanel sends messages to content scripts on active tabs to install click/type listeners
- `CANCEL_ELEMENT_SELECTOR` messages are sent when recording pauses, stops, or tabs change
- Screenshots are captured via `chrome.tabs.captureVisibleTab` (or CDP-based capture) with a slight delay for DOM settling

### Description Auto-Generation

Click descriptions are generated from element properties:
- Uses element tag, text content, aria labels, attributes
- Examples: `Click on "Submit" button`, `Type "hello@email.com" in email field`
- Typing descriptions include field name extraction from `name`, `id`, `aria-label`, or `placeholder` attributes

### Voice Narration (Optional)

- Users can enable microphone for voice-over during recording
- Speech segments are captured alongside steps with timestamps
- The speech transcript is attached to the closest step by timestamp alignment

### Where Recordings Are Stored

**Recordings are NOT persisted to storage during capture.** They exist only in React component state (`useState`). When recording stops, the steps array is passed to `onComplete` callback. The recording has two outcomes:

1. **Sent as a message to Claude** — The steps are formatted and sent via `createMessage` to the Claude conversation, where Claude generates a summary/prompt from them.
2. **Saved as a Shortcut/Prompt** — The user can then save Claude's generated summary as a reusable "shortcut" (prompt).

**Shortcuts/Prompts are persisted** in `chrome.storage.local` under the key `SAVED_PROMPTS` as a JSON array.

### Shortcut Data Model

```typescript
interface SavedPrompt {
  id: string;                    // format: "prompt_{timestamp}_{random9chars}"
  prompt: string;                // the actual prompt text (natural language)
  command: string;               // slash command name (e.g., "fill-form")
  url?: string;                  // optional URL scope
  createdAt: number;             // Unix timestamp
  usageCount: number;            // usage counter
  lastUsedAt?: number;           // last used timestamp

  // Scheduling fields (optional)
  repeatType?: "none" | "once" | "weekly" | "monthly" | "annually";
  specificTime?: string;         // "HH:MM" format
  specificDate?: string;         // "YYYY-MM-DD"
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthAndDay?: string;          // "MM-DD"
  model?: string;                // model to use for scheduled execution
  nextRun?: number;              // computed next execution time
}
```

### Export/Import

The extension has `exportPrompts()` and `importPrompts()` methods on the prompt storage class:
- **Export**: Returns `JSON.stringify(prompts, null, 2)` — plain JSON array
- **Import**: Parses JSON, assigns new IDs (`prompt_{timestamp}_{random}`), and appends to existing prompts
- Import supports a `replaceAll` flag to overwrite existing prompts

---

## 2. How Recordings Become Skills/Shortcuts

### The Recording-to-Shortcut Pipeline

```
User clicks "Record Workflow" (via / menu or "Teach Claude" button)
    ↓
WorkflowModeSelectionModal appears (voice-over on/off)
    ↓
User performs actions in browser → steps[] accumulated
    ↓
User stops recording → steps sent to Claude as conversation message
    ↓
Claude generates a natural language summary/prompt describing the workflow
    ↓
User clicks "Save as Shortcut" on Claude's response
    ↓
EH (Shortcut Editor) modal opens with:
  - pre-filled prompt text (Claude's summary)
  - command name field (user-editable)
  - optional URL scope
  - optional scheduling
    ↓
Saved to chrome.storage.local as SavedPrompt
```

**Key insight**: The "recording" is ephemeral. What gets saved is NOT the raw step sequence, but Claude's natural language interpretation of it. The shortcut is a **prompt**, not a macro.

### Invocation System

Shortcuts are invoked via the **slash command menu** in the chat input:
- Typing `/` opens a dropdown listing all saved prompts sorted by `usageCount`
- Selecting a shortcut inserts `[[shortcut:{id}:{command}]]` token into the message
- Before sending, `[[shortcut:...]]` tokens are resolved: the token is replaced with the prompt's `prompt` text
- The shortcut's `usageCount` is incremented on use

### Shortcut Chip System

Shortcuts can also be inserted as "chips" in the editor (ProseMirror-based):
- A `shortcutChip` node type exists in the editor schema
- Chips display the command name inline and expand to prompt content on send

### Naming/Organization

- Commands are user-defined strings (e.g., "fill-timesheet", "check-orders")
- Sorted by usage count (most-used first), then by creation date
- Searchable via fuzzy search (Fuse.js v7.0.0)
- No folders or categories — flat list

### Editing After Creation

Yes, shortcuts can be fully edited:
- `onEditShortcut` handler opens the same `EH` modal with pre-filled values
- Users can modify prompt text, command name, URL scope, and schedule
- `updatePrompt(id, changes)` persists modifications
- Analytics event: `claude_chrome.chat.shortcut_updated`

### Scoping

- Shortcuts can optionally have a `url` field
- When set, the shortcut is context-aware but NOT restricted to that URL
- URL appears as metadata in the shortcut editor
- Shortcuts are global to the extension (not per-domain or per-tab)

---

## 3. Invocation from Claude Code

### Architecture: Native Messaging Bridge

Claude Code communicates with the Chrome extension via **Chrome Native Messaging** (`chrome.runtime.connectNative`). The bridge works as follows:

```
Claude Code CLI
    ↓ (stdio)
Native Messaging Host ("com.anthropic.claude_code_browser_extension")
    ↓ (Chrome Native Messaging protocol)
Chrome Extension Service Worker
    ↓ (internal message passing)
Content Scripts / Side Panel
```

**Two native messaging hosts are registered:**
1. `com.anthropic.claude_code_browser_extension` — for Claude Code
2. `com.anthropic.claude_browser_extension` — for Claude Desktop

The service worker:
1. Attempts `chrome.runtime.connectNative()` for each host
2. Sends `{ type: "ping" }` and waits for `{ type: "pong" }`
3. On connection, listens for `tool_request` messages
4. Executes tools via the same internal `a()` function used by the sidepanel
5. Returns `tool_response` with result or error

### Available MCP Tools (from Claude Code)

Based on schema inspection and code analysis, these tools are available:

| Tool | Description |
|------|-------------|
| `tabs_context_mcp` | Get tab group context, list tabs |
| `tabs_create_mcp` | Create new tab |
| `navigate` | Navigate to URL or back/forward |
| `read_page` | Get accessibility tree of page |
| `get_page_text` | Extract article text content |
| `find` | Natural language element search |
| `computer` | Mouse/keyboard actions, screenshots |
| `form_input` | Fill form fields |
| `javascript_tool` | Execute JavaScript on page |
| `shortcuts_list` | **List all saved shortcuts/workflows** |
| `shortcuts_execute` | **Execute a shortcut by ID or command** |
| `gif_creator` | Create GIF from screenshots |
| `upload_image` | Upload image to page |
| `resize_window` | Resize browser window |
| `read_console_messages` | Read browser console |
| `read_network_requests` | Read network activity |
| `update_plan` | Present action plan to user |
| `switch_browser` | Switch between browsers |

### `shortcuts_list` Tool

```typescript
// Parameters:
{
  tabId: number  // Required. Tab ID (get from tabs_context_mcp first)
}
// Returns: List of shortcuts with id, command, description, isWorkflow flag
```

### `shortcuts_execute` Tool

```typescript
// Parameters:
{
  tabId: number,          // Required. Tab ID
  shortcutId?: string,    // Shortcut ID to execute
  command?: string         // Or command name (without leading /)
}
// Behavior: Opens a new sidepanel window and runs the shortcut
// Returns immediately (does not wait for completion)
```

### Key Architectural Detail

The tool execution path from Claude Code:

```
Claude Code sends: { type: "tool_request", method: "execute_tool", params: { tool: "shortcuts_execute", args: { tabId, shortcutId, command }, client_id, session_scope } }
    ↓
Service worker receives via native messaging onMessage
    ↓
Dispatches to internal tool executor a({ toolName, args, tabId, tabGroupId, clientId, source: "native-messaging", sessionScope })
    ↓
Tool executor runs the same code path as sidepanel-initiated tool calls
    ↓
Result sent back: { type: "tool_response", result: { content } }
```

### Permission System

The extension has a permission mode system (`permissionMode`) that governs whether tool actions require user approval:
- Permission prompts appear in the sidepanel for sensitive actions
- `skip_all_permission_checks` mode exists but has a warning banner
- Permission denied sends a strong message back: "The user has explicitly declined this action. Do not attempt to use other tools or workarounds."

---

## 4. React Grab & Dev-Oriented Element Selection

### React Grab (react-grab.com)

Based on available knowledge (no live web access performed):

**React Grab** is a browser extension/tool that enables "point at element in browser, get component info in dev tools." Core concept:
- Hover over any element on a rendered React page
- Tool identifies the React component tree path, props, and source file
- Click to jump to the source code in your editor

**How it connects dev tools to browser elements:**
- Uses React DevTools internals (`__REACT_DEVTOOLS_GLOBAL_HOOK__`) to traverse the fiber tree
- Maps DOM elements back to their React component owners
- Uses source maps to resolve component file paths
- Communicates with IDE via local WebSocket server or VS Code extension API

### Element Identification Patterns Relevant to SOP Recorder

**Claude Chrome's approach** (from source analysis):
1. **Accessibility tree builder** (`accessibility-tree.js`): Injected into all pages, builds a tree representation using `WeakRef` element map (`ref_1`, `ref_2`, etc.)
2. **Element references**: Each interactive element gets a stable `ref_id` used across tool calls
3. **Selector generation**: Falls back through ID > data-testid > aria-label > tag+attrs > nth-of-type
4. **Natural language find**: The `find` tool accepts queries like "search bar" and returns matching elements with ref IDs

**Other patterns in the space:**
- **Playwright selectors**: `getByRole()`, `getByText()`, `getByTestId()` — role-based, resilient
- **Cypress selectors**: `data-cy` attributes, chained queries
- **Testing Library**: Accessibility-first queries (`getByLabelText`, `getByPlaceholderText`)

### MCP Servers for Element Selection

The Claude Chrome extension itself IS the MCP server for element selection. The `find` tool provides natural language element discovery, and `read_page` provides the full accessibility tree. There is no separate MCP server needed — the extension bridges the gap between "point at element" and "interact with it programmatically."

---

## 5. Strategic Implications for SOP Recorder

### 5.1 Should We Support a "Replay" Format?

**Yes, with caveats.** The analysis reveals two distinct use cases:

| Use Case | Format | Tool |
|----------|--------|------|
| **Documentation** (SOPs) | Markdown + screenshots | SOP Recorder (our product) |
| **Automation** (replay) | Prompt-based / tool call sequence | Claude Chrome shortcuts |
| **Testing** (assertions) | Playwright/Cypress scripts | Testing frameworks |

**Recommendation**: Our primary output is documentation. However, we should design our internal step format to be **convertible** to automation formats. The step data we already capture (action, selector, value, screenshot, URL) is a superset of what Claude Chrome captures.

### 5.2 Could Our Steps Convert to Claude Shortcuts?

**Yes, and this is a high-value integration.** The conversion path:

```
SOP Recorder steps[]
    ↓ (AI summarization)
Natural language prompt describing the workflow
    ↓ (save via chrome.storage API or import)
Claude Chrome SavedPrompt { prompt, command, url }
```

The key insight from the Claude Chrome analysis: **shortcuts are just prompts, not macros**. Claude re-interprets the natural language description each time and uses its browser tools to execute. This means:

- We don't need to generate exact tool call sequences
- We need to generate clear, unambiguous natural language descriptions
- The prompt should reference elements by accessible names or visible text, not CSS selectors
- URL context helps Claude know where to start

**Implementation approach:**
1. After recording, offer "Export as Claude Shortcut"
2. Use AI to generate a prompt from our steps
3. Format as `SavedPrompt` JSON
4. Either:
   a. Write directly to `chrome.storage.local` (requires same extension or shared storage)
   b. Export as JSON file for manual import via Claude Chrome's import feature
   c. Use a shared `chrome.storage.local` key convention

### 5.3 What Would "Invoke SOP from Claude Code" Look Like?

Two approaches:

**Approach A: Via Claude Chrome Bridge**
```
User: "Run the SOP for submitting timesheets"
Claude Code → shortcuts_execute(tabId, command: "submit-timesheet")
    → Claude Chrome opens sidepanel, runs the prompt
    → Claude Chrome's agent executes browser actions
```
This works TODAY if the SOP is saved as a Claude Chrome shortcut.

**Approach B: Direct MCP Tool Execution**
```
User: "Run the SOP for submitting timesheets"
Claude Code reads SOP markdown file
Claude Code → navigate(url), find("timesheet form"), computer(click), form_input(...)
    → Executes step by step using Claude Chrome MCP tools
```
This is more flexible but requires Claude Code to interpret the SOP and translate to tool calls in real-time.

**Approach C: Hybrid (Recommended)**
- Store SOPs with both human-readable markdown AND a structured step format
- Offer export to Claude shortcut for one-click automation
- For Claude Code invocation, the AI reads the structured steps and uses MCP tools directly

### 5.4 Overlap with Testing Frameworks

| Aspect | SOP Recorder | Playwright/Cypress | Claude Chrome |
|--------|-------------|-------------------|---------------|
| **Input** | Human browser actions | Code/scripts | Human demo or prompt |
| **Output** | Documentation | Test assertions | Prompt-based automation |
| **Selectors** | CSS/aria/visual | Role/test-id/CSS | Accessibility tree refs |
| **Replay** | No (doc only) | Yes (deterministic) | Yes (AI-interpreted) |
| **Resilience** | N/A | Brittle to UI changes | Adapts via AI |
| **Screenshots** | Core feature | Optional | Used for context |

**Key differentiator**: Testing frameworks are deterministic but brittle. Claude Chrome shortcuts are resilient but non-deterministic. Our SOPs are documentation-first but could feed into either.

**Potential integration**: Export SOP steps as Playwright test skeletons:
```typescript
// Generated from SOP: "Submit Timesheet"
test('submit timesheet', async ({ page }) => {
  await page.goto('https://timesheet.company.com');
  await page.getByRole('button', { name: 'New Entry' }).click();
  await page.getByLabel('Hours').fill('8');
  await page.getByRole('button', { name: 'Submit' }).click();
});
```

### 5.5 Recording Format Comparison

| Field | SOP Recorder | Claude Chrome | Playwright Codegen |
|-------|-------------|---------------|-------------------|
| Action type | click/type/navigate/scroll | click/type/navigate | click/fill/goto/press |
| Selector | ID > data-testid > aria > tag | Accessibility tree refs | Role > test-id > text > CSS |
| Screenshot | Per-step, base64 | Per-step, base64 | N/A |
| Description | AI-generated | AI-generated | N/A (code only) |
| Voice narration | Planned | Supported | N/A |
| Video | Planned (v2) | N/A | Trace viewer |
| Persistence | chrome.storage | React state (ephemeral) | File system |
| Export | Markdown/ZIP | JSON (prompts) | TypeScript/Python/Java |

---

## 6. Architecture Recommendations

### 6.1 Dual-Format Output

Design SOP Recorder's internal format to support both documentation and automation:

```typescript
interface SOPRecording {
  metadata: {
    title: string;
    createdAt: string;
    url: string;
    version: string;
  };
  steps: SOPStep[];        // our existing step format
  exports: {
    markdown?: string;     // rendered SOP document
    claudeShortcut?: {     // convertible to SavedPrompt
      prompt: string;
      command: string;
      url: string;
    };
    playwrightTest?: string;  // generated test code
  };
}
```

### 6.2 MCP Server for SOP Recorder (v2+)

Consider building an MCP server that:
- Lists available SOPs: `sop_list`
- Reads SOP content: `sop_read`
- Executes SOP via Claude Chrome tools: `sop_execute`
- Records new SOP: `sop_record`

This would allow Claude Code to manage SOPs without a browser UI.

### 6.3 Priority Ordering

1. **MVP**: Record + Markdown export (current plan)
2. **v1.1**: Export as Claude Chrome shortcut JSON (import via their import feature)
3. **v1.2**: Playwright test skeleton export
4. **v2**: MCP server integration, direct Claude Code invocation

---

## 7. Key Findings Summary

1. **Claude Chrome "Teach" does NOT save raw recordings.** It saves AI-generated natural language prompts. The recording is ephemeral — only the prompt survives.

2. **Shortcuts are stored in `chrome.storage.local`** under `SAVED_PROMPTS` key as a JSON array. They have import/export support.

3. **Claude Code connects via Native Messaging** (`com.anthropic.claude_code_browser_extension`). Tools like `shortcuts_list` and `shortcuts_execute` are fully accessible from Claude Code CLI.

4. **`shortcuts_execute` starts a shortcut but does not wait for completion.** It opens a new sidepanel window and returns immediately.

5. **The shortcut system is prompt-based, not macro-based.** Claude re-interprets the workflow description each time, making it resilient to UI changes but non-deterministic.

6. **Our SOP Recorder captures MORE data than Claude Chrome's recording** (persistent screenshots, structured selectors, metadata). We can export to their format but not vice versa.

7. **The integration path is clear**: Export our structured steps as a natural language prompt formatted for Claude Chrome import. This is a high-value feature that differentiates us from pure documentation tools.
