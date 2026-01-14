# Release & versioning

## Semver rules
- App packages follow SemVer.
- Token sets follow SemVer **per BU** via `tokens/<bu>/version.json`.

## Token version bump guidance (per BU)
- PATCH: fix typos, metadata changes, non-visible changes
- MINOR: additive tokens, additive scales, new semantic tokens that don't break existing mappings
- MAJOR: rename/remove tokens, change meanings, change types, change reference structure in a breaking way

## Core token changes
Core token edits can affect all BUs.
When core tokens change:
- require a diff/preview step
- recommend bumping every impacted BU version
- write an ADR if the change is structural (renames, retyping, hierarchy changes)

