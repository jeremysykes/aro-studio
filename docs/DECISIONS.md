# Decisions

Log major decisions so the project doesn't loop.

Format:
- YYYY-MM-DD — Decision
  - Context:
  - Decision:
  - Why:
  - Rejected:
  - Notes:

## 2026-01-14 — UI system
- Context: Minimize UI engineering overhead while keeping an Adobe-like pro-tool experience.
- Decision: Use Adobe React Spectrum for pre-styled, accessible UI components.
- Why: Professional defaults, strong accessibility, predictable interaction model.
- Rejected: Tailwind+Radix+shadcn style kits (too much component plumbing and over-abstraction).

## 2026-01-14 — Token Editor stack & contracts (MVP)
- Context: Align Token Editor with MVP constraints (Electron desktop, Spectrum UI, DTCG tokens) and avoid further churn while adding loader/Core Mode/diff flows.
- Decision:
  - Stack: Electron + React + TypeScript; TanStack Table for state/row model; React Spectrum/React Aria for all controls (TextField, Picker, Switch, Button, Dialog, Tabs, etc.). Table markup uses semantic `<table>` or ARIA grid patterns; no imaginary Spectrum DataGrid.
  - Theming: Spectrum Provider drives light/dark themes; remove class-based Tailwind dark toggle.
  - Tokens: DTCG-compliant `$value`, `$type`, optional `$description`, optional `$extensions`; nested objects are token groups. Preserve unknown keys/metadata.
  - References: `{path.to.token}` kept as literal strings; resolve only for preview + validation; never rewritten.
  - Representations: keep `coreDocsByFile` (per core json), `buDoc` (BU tokens.json), and `mergedView` (core overlaid by BU) for UI/validation only. Edits apply to the owning doc, not mergedView.
  - Source maps: `sourceMaps[path] = { layer: 'core' | 'bu', file: 'tokens/_core/<file>.json' | 'tokens/bu-x/tokens.json' }`; saves write back only to originating file; no merged writeback.
  - Validation (MVP): errors for missing `$value` or `$type` on leaf tokens; type sanity per `$type` (color/dimension/number/boolean/string) allowing reference strings; detect missing/self/circular references across mergedView; preserve `$schema` and all metadata.
  - Tailwind/headless removal: Once Spectrum replacements land, Token Editor UI must not rely on headless/shadcn/Tailwind for controls; any temporary layout Tailwind must be tracked and removed before table milestone closes.
- Why: Locks behavior/UI stack to MVP constraints, protects DTCG fidelity, and keeps save routing deterministic across multi-file core.
- Rejected: Using Spectrum "Table" as a data grid (insufficient for TanStack features); writing merged docs back to every file; normalizing/removing unknown metadata; reference rewriting.

## 2026-01-14 — Monaco Editor find widget positioning workaround
- Context: The Monaco Editor find widget (Cmd+F) flickered repeatedly when positioned at its default location near the right edge/scrollbar.
- Decision: Apply CSS override `right: 40px` to `.monaco-editor .find-widget` to shift it away from the conflict zone.
- Why: After exhausting official Monaco configuration options (`fixedOverflowWidgets`, `overflowWidgetsDomNode`, `automaticLayout`, body overflow removal), the flickering persisted. Root cause appears to be z-index/stacking context conflicts with adjacent UI elements. CSS offset was the only effective resolution.
- Rejected: Native Monaco positioning (not available); further stacking context restructuring (too invasive for marginal benefit).
- Notes: Revisit if Monaco adds native find widget positioning options in future releases.
