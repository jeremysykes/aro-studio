# Aro Studio Cursor Rules Kit

These rules govern how changes are planned and executed in this repo.

## Rule precedence
1) These files are the source of truth.
2) Cursor must follow them exactly.
3) Cursor must not modify any rule files unless explicitly instructed by Jeremy.

## Repo intent (one sentence)
Aro Studio is a desktop-first, Adobe-like (Spectrum) design-system automation suite built around DTCG tokens.

## Allowed stack (locked)
- Electron + React + TypeScript
- UI system: Adobe React Spectrum (pre-styled, accessible)
- Token grid: TanStack Table (render Spectrum components inside cells/filters)
- Validation: Zod (in core)
- No Tailwind, no Radix, no shadcn, no Headless UI

## How to work
- Make small, verifiable steps.
- Keep changes minimal and reversible.
- Prefer simple implementations over reusable abstractions unless explicitly requested.
- Never change token meaning or structure “to be helpful”.

## Files in this kit
00_RULES_README.md
01_NON_NEGOTIABLES.md
02_PROJECT_CONTEXT.md
03_ARCHITECTURE_BOUNDARIES.md
04_TOKENS_CONTRACT.md
05_UI_PRODUCT_RULES.md
06_CODE_STYLE_AND_TYPES.md
07_SECURITY_AND_PRIVACY.md
08_TESTING_AND_QUALITY.md
09_DOCS_AND_PROGRESS.md
10_RELEASE_VERSIONING.md
11_IP_LICENSING_STRATEGY.md
