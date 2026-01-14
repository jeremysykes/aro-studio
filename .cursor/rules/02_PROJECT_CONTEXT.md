# Project context (Aro Studio)

Aro Studio is a suite of desktop-first tools for managing enterprise design tokens across multiple business units (BU-A…BU-D) with minimal UI overhead, strong accessibility, and a professional “design software” feel.

## MVP focus
- Build **Token Editor** first.
- Support **multi-BU** token editing with a predictable layer model:
  - **_core** primitives (shared foundation)
  - **BU semantic** tokens (brand/product intent)
  - Optional **BU overrides** (rare; explicit)

## Token storage (local repo)
Tokens live in this repo under:

- `tokens/_core/` – primitives + shared foundations (palette, typography, spacing, etc.)
- `tokens/bu-a/` – BU semantic tokens + BU version
- `tokens/bu-b/`
- `tokens/bu-c/`
- `tokens/bu-d/`

Each BU folder contains:
- `tokens.json` – BU token set (DTCG-compliant)
- `version.json` – BU token package version metadata

`tokens/_core/` may contain multiple files (e.g., `palette.json`, `spacing.json`, `typography.json`, etc.) and/or a consolidated `tokens.json`.
All token JSON files must be **Design Tokens Community Group (DTCG) format**.

## External reference repo (POC)
This project sits alongside the POC repo locally:
- `../multi-bu-design-system-poc/` (for research only)
Cursor may read it via filesystem, but **must not modify it** unless explicitly instructed.

## UI direction
- Prefer a **pre-styled, accessible system** to minimize UI implementation effort.
- Aim for “Adobe-like” interaction quality.
- Primary UI stack target: **React Spectrum + React Aria** (Electron renderer).

## Non-goals (for MVP)
- Full Figma sync, package publishing, proofs, AI flows (later apps).
- Over-engineered custom components when platform components suffice.

