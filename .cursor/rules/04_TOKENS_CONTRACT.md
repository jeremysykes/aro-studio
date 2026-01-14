# Tokens contract (DTCG + multi-layer)

This repo stores design tokens in **Design Tokens Community Group (DTCG)** JSON format.

## 1) Canonical model

We treat tokens as a **layered system**:

### A) Core primitives (shared)
Location: `tokens/_core/`

Purpose:
- Shared primitives that define the raw “materials” (e.g., color scales, base spacing, base typography ramps).
- These are *not* “brand meaning” tokens. They are the foundation.

Rules:
- Core tokens **may be edited** in the Token Editor, but only in an explicit **Core Mode**.
- Editing core tokens is high impact: it can affect every BU.
- Core edits should trigger:
  - validation
  - version bump guidance
  - a clear diff/preview step

### B) BU semantic tokens (per business unit)
Location: `tokens/<bu>/tokens.json`

Purpose:
- Tokens with product/brand meaning (e.g., `color.background.canvas`, `color.text.primary`, `button.primary.bg`).
- These should generally reference core primitives via token references.

Rules:
- Semantic tokens should prefer references:
  - `$value: "{color.primary.500}"`
- BU semantic tokens can override references with literal values **only when justified**.

### C) BU version metadata
Location: `tokens/<bu>/version.json`

Minimum fields:
- `name` (string) – BU name (e.g., `"bu-a"`)
- `version` (semver string) – e.g., `"0.1.0"`
- `updatedAt` (ISO string)
- optional: `notes`, `gitSha`, `breaking`

## 2) DTCG formatting rules

### Token object shape
A token is an object with at minimum:
- `$type` (e.g., `"color"`, `"dimension"`, `"fontFamily"`, `"fontWeight"`, etc.)
- `$value` (literal value or reference string like `"{color.primary.500}"`)
- optional: `$description`

Example:
```json
{
  "color": {
    "primary": {
      "500": { "$type": "color", "$value": "#2196F3" }
    }
  }
}
```

### References
- Use reference strings: `"{path.to.token}"`.
- Do not invent ad-hoc interpolation formats.

### Files and schemas
- Each token JSON file should include `$schema` when practical (top-level).
- Splitting tokens across multiple files is allowed **if** the merge order is deterministic and documented.

## 3) Validation expectations
Validator (later app) must be able to:
- Confirm DTCG structure
- Confirm token `$type` and `$value` shape per type
- Resolve references across `_core` + BU tokens
- Detect cycles / missing references
- Enforce naming conventions and reserved namespaces (`_core`, `bu-*`)

## 4) Token Editor behavior requirements (MVP)
- Must load `_core` + selected BU tokens.
- Must support:
  - table view (TanStack Table)
  - inline edits (type-aware)
  - safe color editing (Spectrum color components)
  - diff preview before save
- Must prevent accidental cross-layer edits:
  - Core edits require Core Mode toggle
  - BU edits default mode
- Must never silently coerce token types or drop metadata.

