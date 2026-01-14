# Docs and progress

The goal is to keep decisions stable so the project doesn't thrash.

## Where decisions live
- `docs/DECISIONS.md` – major decisions (tech stack, architecture, tokens model)
- `docs/ADR/` – Architecture Decision Records (one per decision)
- `docs/TOKENS/` – token model, naming, layering, DTCG conventions

## Required updates when changing direction
If you change any of these, write an ADR:
- token layer model
- file/folder structure under `/tokens`
- UI system choice (e.g., Spectrum vs something else)
- data model / persistence format
- app packaging / deployment approach

## “No silent drift”
Cursor must not:
- change rules docs
- “refactor everything” without a stated goal + a checkpoint
- introduce new frameworks (tailwind/radix/shadcn/etc.) unless explicitly approved

