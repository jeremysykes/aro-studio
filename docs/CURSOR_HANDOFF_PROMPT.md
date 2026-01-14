# Cursor handoff prompt — Refactor to Spectrum + stabilize MVP

You are working in the `aro-studio` monorepo.

## Absolute rules
- Read and follow `.cursor/rules/*.md`. Do not modify rule files unless explicitly instructed.
- Preserve IP/legal files (LICENSE/NOTICE/CONTRIBUTING.md). Do not rewrite them.
- Tokens are DTCG and must be lossless (no schema drift, no silent normalization).

## Current state
- The repo already has theme toggling implemented, but it must be changed to toggle between Adobe React Spectrum default Light and Dark themes.
- The codebase may currently contain UI library usage that is not Spectrum-aligned.
- Your job is to refactor toward the locked stack, then ship the Token Editor MVP.

## Locked stack
- Electron + React + TypeScript
- Adobe React Spectrum for UI
- TanStack Table for the token grid
- Zod for validation
- Avoid Tailwind/Radix/shadcn/Headless UI

## Refactor goals
1) Replace existing UI primitives with Spectrum components where practical:
   - Buttons, inputs, pickers/selects, dialogs, toolbars, layout primitives.
2) Implement Spectrum theme toggle:
   - Use `@adobe/react-spectrum` Provider
   - Toggle between Spectrum Light and Dark (default themes).
3) Keep TanStack Table:
   - Render Spectrum components in header/cells/filters so the table feels native.
4) Maintain architecture boundaries:
   - Renderer cannot access filesystem directly.
   - Electron main implements IO and exposes safe APIs via preload bridge.
   - packages/core stays portable.

## Token Editor MVP deliverables
- Open a folder and locate `tokens/`
- List BUs (exclude folders starting with `_`)
- Load/edit/save `tokens.json` per BU
- Show validation issues (human-readable)
- Read-only viewing for `tokens/_core` for MVP
- Clear status (dirty/saved/error) + Cmd/Ctrl+S save

## Workflow
- Work in small steps and keep changes verifiable.
- After each milestone:
  - Update PROJECT_PROGRESS.md
  - Append any major decision to /docs/DECISIONS.md
  - Update /docs/ASSUMPTIONS.md if needed
