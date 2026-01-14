# Editing _core primitives safely

Core edits are allowed because real tools must support it, but it’s easy to break everything.

## Guardrails
- Core edits require **Core Mode** toggle.
- Always show:
  - impacted references count (approx is fine in MVP)
  - diff preview
- Require explicit save confirmation.

## Recommended workflow
1) Edit core token(s)
2) Run validation
3) Preview diffs per BU
4) Bump versions for impacted BUs
5) Write an ADR if structural

## What counts as structural
- renames
- moving token paths
- changing `$type`
- changing reference strategy (e.g., from hex literals to references)
