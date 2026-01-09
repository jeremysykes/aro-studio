# Non-negotiables

## Behavior

- Do not rewrite or reformat large files unless requested.
- Do not rename folders or move files without approval.
- Do not introduce new token categories or token schemas beyond what exists.
- Do not add heavyweight frameworks unless justified and approved.

## Review checkpoints (mandatory)

Cursor must stop and ask for review after:

1. Monorepo tooling and folder structure
2. Electron app boots to a blank shell
3. Token discovery and file IO works end-to-end
4. Token table renders from real token files
5. Editing and saving works with validation and clear feedback

## Platform agnostic rule

All business logic must live in `packages/core`.
UI must be in `packages/ui`.
Apps must be thin shells that wire UI to core.
