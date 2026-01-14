# Token layer model

## Layers
1) `_core` primitives (shared foundation)
2) BU semantic tokens (meaningful roles)
3) BU overrides (rare; explicit)

## Why this works
- Primitives change less often and are reusable.
- Semantics express intent and can differ per BU without duplicating entire primitive sets.
- Overrides exist for exceptions without turning everything into one-off values.

## Practical examples

### Primitive
`tokens/_core/palette.json`
- `color.primary.500` = `#2196F3`

### Semantic (BU)
`tokens/bu-a/tokens.json`
- `color.text.link` -> `{color.primary.600}`
- `button.primary.bg` -> `{color.primary.500}`

### Override (BU)
Only when needed:
- `button.primary.bg` -> `#1F7FE5` (literal) with explanation.

## Editing policy
- Editing semantics is the normal day-to-day workflow.
- Editing `_core` is allowed, but gated (Core Mode + preview + version guidance).
