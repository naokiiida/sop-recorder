# Privacy Policy — nuknow

**Last updated:** 2026-03-22

## Overview

nuknow is a Chrome extension that records browser interactions and produces documented Standard Operating Procedures (SOPs) with annotated screenshots. It is designed with privacy as a core principle.

## Data Collection

**We do not collect, transmit, or store any user data on external servers.**

Specifically:

- **No network requests:** The extension makes zero network requests. It does not communicate with any server, API, or third-party service.
- **No telemetry or analytics:** No usage data, crash reports, or behavioral analytics are collected.
- **No user accounts:** The extension does not require or support user accounts, sign-in, or authentication.
- **No remote storage:** No data is stored on remote servers, cloud services, or external databases.

## Data Storage

All data created by the extension is stored **locally on your device** using:

- **chrome.storage.local** — Extension-scoped storage for recording metadata and settings.
- **IndexedDB** — Browser-local database for screenshot blobs and larger data.

This data is scoped to the extension and is automatically cleared when the extension is uninstalled.

## Data Sharing

Data leaves your device **only** through explicit user-initiated actions:

- **File download:** When you choose to export a recording, the extension uses the Chrome Downloads API to save a file (Markdown or ZIP) to your local filesystem.
- **Clipboard copy:** When you choose to copy Markdown to your clipboard.

No data is shared automatically, in the background, or without your direct action.

## Permissions

The extension requests the following Chrome permissions, all used exclusively for local recording functionality:

| Permission | Purpose |
|---|---|
| `activeTab` | Access the current tab for screenshot capture |
| `tabs` | Detect tab navigation during recording |
| `scripting` | Inject content script for DOM event capture |
| `storage` | Store recordings locally |
| `sidePanel` | Display the extension UI |
| `alarms` | Schedule periodic storage cleanup |
| `downloads` | Export recordings as files |

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above.

## Contact

For questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/naokiiida/sop-recorder).
