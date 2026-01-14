# DTCG conventions used in Aro Studio

We store tokens in DTCG JSON.

## Required fields
Each token object must include:
- `$type`
- `$value`
Optional:
- `$description`

## References
Use reference strings:
- `{path.to.token}`

Example:
```json
{
  "color": {
    "text": {
      "primary": { "$type": "color", "$value": "{color.neutral.900}" }
    }
  }
}
```

## File splitting
Allowed, but must be deterministic:
- `_core` may be split by domain: palette/spacing/typography/etc.
- Token Editor must load and merge in a stable order:
  1) `_core/*`
  2) `bu-x/tokens.json`

If there are collisions, later layers win (BU overrides core).

## Type expectations (common)
- `color` -> hex, rgba, hsla, etc.
- `dimension` -> number + unit (e.g., `"8px"`) unless you standardize another pattern
- typography related types must be consistent across BUs

## No “magic”
Do not:
- invent new fields
- silently convert types
- drop `$description` or metadata
