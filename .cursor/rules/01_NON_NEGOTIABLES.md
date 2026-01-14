# Non-negotiables

## Behavior
- Follow this ruleset exactly. Do not edit rule files unless explicitly instructed.
- Do not introduce new frameworks or alternate stacks.
- Keep scope tight: ship Token Editor MVP before expanding.

## Locked stack
- Electron + React + TypeScript
- Adobe React Spectrum for UI (pre-styled, accessible)
- TanStack Table for the token grid only
- Zod for runtime validation in core

## Architecture gates (must remain true)
- Monorepo: apps/* (shells), packages/core (business logic), packages/ui (shared UI wrappers only when needed).
- Renderer must not access filesystem directly.
- Electron main is the only layer allowed to touch the filesystem.
- Core must stay portable (no Electron/Node-only imports inside packages/core).

## Token integrity
- Tokens are canonical, DTCG-aligned, and must remain lossless:
  - No schema drift
  - No silent normalization
  - No dropping metadata
  - No rewriting references

## MVP gates
Token Editor must be able to:
- Open a chosen folder and discover tokens/
- List business units (exclude folders starting with "_")
- Load/edit/save tokens.json
- Show validation results in human-readable form
- Respect read-only areas (e.g. tokens/_core) until explicitly enabled
