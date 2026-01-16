# Aro Studio — Token Editor (MVP)

Aro Studio is a **desktop token editor** for working safely with **multi–business unit design tokens**.

The Token Editor is a local-first Electron app focused on **deterministic editing, validation, and version-safe changes** to Design Tokens Community Group (DTCG)–compliant token sets. It is designed for real production workflows where core tokens are shared, business units diverge intentionally, and mistakes must be surfaced clearly before they ship.

This repository currently contains the **Token Editor MVP**, which is the first product under the broader Aro Studio umbrella.

---

## What this is

- A desktop application for editing design tokens stored on disk
- Built for **multi-BU token systems** with shared core layers
- Enforces **lossless DTCG token handling** (no silent normalization)
- Optimized for **safety, clarity, and determinism**

## What this is not (MVP)

- No cloud sync or collaboration
- No telemetry or external data transmission
- No Figma plugin or design-tool replacement
- No auto-versioning or token “fixing”
- No custom theming beyond Spectrum Light/Dark

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8

### Install dependencies

```bash
pnpm install
```

### Run the Token Editor (development)

```bash
pnpm dev
```

This will:

- Start the Vite dev server for the React renderer
- Launch the Electron Token Editor app
- Enable hot module replacement during development

---

## Using the Token Editor

1. Launch the app and click **Open Tokens Folder**
2. Select a folder containing a `tokens/` directory
3. The sidebar will display:
   - **Core layers** (folders prefixed with `_`, e.g. `_core`) — read-only by default
   - **Business Units** (e.g. `bu-a`, `bu-b`) — editable
4. Select a business unit to edit its `tokens.json`
5. Edit tokens using the table UI or JSON editor
6. Validation issues appear in the right-hand panel
7. Press **Cmd/Ctrl + S** or click **Save** to persist changes

Edits are written only to the owning file. Core tokens are never modified unless explicitly enabled.

---

## Token Model

The editor supports **DTCG-compliant JSON tokens**.

Leaf tokens must include:

- `$value` (required)
- `$type` (recommended)
- `$description` (optional)

Additional metadata and extensions are preserved verbatim.

References (e.g. `{color.primary}`) are treated as literal strings and are never rewritten.

---

## Project Structure

```text
aro-studio/
├── apps/
│   └── token-editor/      # Electron Token Editor application
├── packages/
│   ├── core/              # Token loading, merging, validation, diffing
│   └── ui/                # Shared UI composition helpers (Spectrum-first)
├── tokens/                # Example token fixtures
└── docs/                  # Architecture, decisions, token model
```

---

## Scripts

- `pnpm install` — install dependencies
- `pnpm dev` — run Token Editor in development
- `pnpm lint` — lint all packages
- `pnpm typecheck` — typecheck all packages
- `pnpm build` — build all packages

---

## Status

This project is in **active development**.

The Token Editor is considered **MVP-complete once end-to-end editing, validation, diffing, and save flows are stable**.

Broader Aro Studio tooling (packaging, export, automation) is planned but **out of scope for the MVP**.

---

## License

All rights reserved.

This repository is not open source. See `LICENSE` and `NOTICE` for details.
