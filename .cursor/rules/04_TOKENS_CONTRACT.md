# Tokens contract

## Source of truth

`tokens/<bu-name>/tokens.json`

This folder structure and file naming is fixed and must not be changed.

---

## Design Tokens Community Group standard

All tokens must conform to the **Design Tokens Community Group (DTCG)** format:
https://design-tokens.github.io/community-group/format/

This includes:

- `$value`
- `$type`
- `$description` (optional but preserved)
- `$extensions` (must be preserved if present)

The system must treat these as the canonical schema.

No alternative token schema may be introduced.

---

## Contract requirements

The token editor must:

- Preserve all unknown fields (forward compatibility)
- Preserve `$extensions`
- Preserve token ordering where possible
- Never drop metadata when saving
- Support round-trip editing without data loss

The editor must not normalize or rewrite tokens unless explicitly instructed by the user.

---

## Validation stance

Start permissive but DTCG-aware:

Validation must ensure:

- Valid JSON
- Valid DTCG token structure
- `$value` exists
- `$type` exists
- Nested token groups are allowed

Invalid tokens must be reported to the user with human-readable errors.
The system must not silently correct or delete invalid tokens.

---

## Diff summaries

Saving must return:

- added count
- changed count
- removed count
- file path

Deep diffs are not required for MVP.
