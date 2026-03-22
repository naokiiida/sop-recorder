# nuknow

[![CI](https://github.com/naokiiida/sop-recorder/actions/workflows/ci.yml/badge.svg)](https://github.com/naokiiida/sop-recorder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<!-- GitHub topics (set manually in repo settings):
     chrome-extension, sop, documentation, productivity, local-first, open-source -->

**Record browser steps into shareable SOPs — 100% local, no account needed.**

nuknow turns your browser clicks into step-by-step Standard Operating Procedures (SOPs) with annotated screenshots and clear instructions. Everything runs locally on your device — no servers, no tracking, no sign-up.

## Features

- **One-click recording** — Start capturing your workflow with a single click. Every action (clicks, form inputs, navigation) is automatically logged as a numbered step.
- **Annotated screenshots** — Each step includes an automatic screenshot with the target element highlighted, so readers know exactly where to click.
- **Edit and refine** — Reorder steps, edit descriptions, add or remove steps, and annotate screenshots — all within the side panel.
- **Export to Markdown** — Download your SOP as a clean Markdown file with embedded images, ready for docs, wikis, or team knowledge bases. Export as a ZIP bundle for easy sharing.
- **Copy to clipboard** — Instantly copy your SOP as Markdown text to paste into Notion, Confluence, GitHub, or any tool that supports Markdown.
- **Privacy-first** — Zero network requests, zero telemetry, zero data collection. Your data never leaves your device.

## Installation

### Chrome Web Store

<!-- TODO: Replace with actual CWS link after publication -->
Coming soon.

### Manual (Developer)

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/naokiiida/sop-recorder.git
   cd sop-recorder
   pnpm install
   ```

2. Build the extension:

   ```bash
   pnpm build
   ```

3. Open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
4. Select the `.output/chrome-mv3` directory.

## Usage

1. **Start recording** — Press `Alt+Shift+R` or click the nuknow toolbar icon, then click **Start Recording**.
2. **Perform your workflow** — Navigate, click, type. Each action is captured as a step with an annotated screenshot.
3. **Stop recording** — Press `Alt+Shift+R` again or click **Stop** in the side panel.
4. **Edit** — Reorder steps, update descriptions, delete unwanted steps.
5. **Export** — Download as a Markdown + images ZIP, or copy Markdown to your clipboard.

<!-- Screenshots: see store/screenshots.md for planned screenshot specs -->

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) (see `packageManager` in `package.json`)

### Setup

```bash
git clone https://github.com/naokiiida/sop-recorder.git
cd sop-recorder
pnpm install
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start WXT dev server with hot reload |
| `pnpm build` | Production build for Chrome |
| `pnpm test:unit` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | ESLint + Prettier check |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | TypeScript strict mode check |

## Testing

```bash
# Unit tests
pnpm test:unit

# E2E tests (requires a production build)
pnpm build && pnpm test:e2e

# Lint
pnpm lint
```

## Architecture

nuknow follows a **core-shell separation** pattern:

- **`src/core/`** — Pure TypeScript business logic with zero Chrome API dependencies. Recording state machine, step management, selector generation, event filtering, export engines.
- **`src/adapters/`** — Chrome API adapters that implement interfaces defined by core modules. Storage, screenshots, tabs, messaging, downloads.
- **`src/components/`** — Lit web components for the side panel UI. Light DOM for PicoCSS compatibility.
- **`src/entrypoints/`** — WXT entry points: side panel, background service worker, content script.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension Framework | WXT |
| Build Tool | Vite 8 (Rolldown) |
| Language | TypeScript (strict) |
| UI Components | Lit |
| Base Styling | PicoCSS |
| ZIP Export | JSZip |
| Unit Tests | Vitest |
| E2E Tests | Playwright |
| Linting | ESLint + Prettier (flat config) |
| CI | GitHub Actions (Node 22, pnpm) |

### CI Pipeline

GitHub Actions runs on every push to `main` and every PR:

1. Lint & format check (ESLint + Prettier)
2. TypeScript strict type check
3. Unit tests (Vitest with coverage)
4. Production build + bundle size validation (size-limit)
5. E2E tests (Playwright with Chrome extension loaded)

## Privacy & Security

nuknow requests only the minimum permissions needed:

| Permission | Why |
|-----------|-----|
| `activeTab` | Capture screenshots of the active tab |
| `tabs` | Detect navigation events |
| `scripting` | Inject content script for event capture |
| `storage` | Persist recordings locally |
| `sidePanel` | Host the editing UI |
| `alarms` | Keep service worker alive during recording |
| `downloads` | Save exported ZIP/Markdown files |

**No network permissions are requested.** Data leaves your device only through explicit file download.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, code style, and PR process.

## License

[MIT](LICENSE)
