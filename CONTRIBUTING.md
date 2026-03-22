# Contributing to nuknow

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Development Environment

### Setup

See [README.md — Development](README.md#development) for prerequisites and setup commands (`git clone`, `pnpm install`, `pnpm dev`).

Load the extension from `.output/chrome-mv3-dev` in `chrome://extensions` (Developer mode).

## Code Style

- **ESLint** (flat config) + **Prettier** enforce consistent style automatically.
- Run `pnpm lint` to check, `pnpm lint:fix` to auto-fix.
- CI runs lint and format checks on every PR — your code must pass before merging.

## Architecture Rules

### Core-Shell Separation

- **`src/core/`** modules must be pure TypeScript — no Chrome API imports, no browser globals.
- Chrome APIs are accessed through **adapter interfaces** defined in `src/core/ports/`. Implementations live in `src/adapters/`.
- This separation ensures core logic is testable without browser mocking and reusable outside Chrome.

### UI Rules

- UI components use **Lit** web components with **light DOM** (for PicoCSS compatibility).
- Styling uses **PicoCSS** as the base with project-level `--sop-*` CSS custom properties.
- No React, no heavy frameworks.
- Icons come from [Lucide](https://lucide.dev/) as inline SVGs — never emoji.

## Pull Request Process

### Branch Naming

Use descriptive branch names:

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `refactor/short-description` — code improvements
- `docs/short-description` — documentation changes

### Commit Messages

Follow conventional commit style:

```
type(scope): short description

Longer explanation if needed.
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`

### Before Submitting

1. Run `pnpm lint` — must pass with no errors.
2. Run `pnpm typecheck` — must pass with no errors.
3. Run `pnpm test:unit` — all tests must pass.
4. Run `pnpm build` — production build must succeed.
5. If your change affects user flows, run `pnpm test:e2e`.

### Review

- CI must pass before merge.
- Keep PRs focused — one feature or fix per PR.

## Testing Requirements

### Unit Tests (Vitest)

- Core modules in `src/core/` must have corresponding unit tests.
- Tests live in `tests/unit/` mirroring the source structure.
- Run with `pnpm test:unit`.

### E2E Tests (Playwright)

- Critical user flows (recording, editing, exporting) are covered by E2E tests.
- Tests live in `tests/e2e/`.
- Run with `pnpm build && pnpm test:e2e`.

## Reporting Issues

Use the [issue templates](https://github.com/naokiiida/sop-recorder/issues/new/choose) to report bugs or request features.
