# Token naming guidelines

## Principles
- Names describe *intent* for semantic tokens.
- Names describe *materials* for primitives.

## Recommended namespaces

### Core primitives
- `color.<scale>.<step>`
- `space.<step>`
- `size.<step>`
- `font.family.<role>`
- `font.weight.<role>`
- `radius.<step>`
- `shadow.<step>`

### Semantic tokens (BU)
- `color.text.*`
- `color.background.*`
- `color.border.*`
- `component.<componentName>.<part>.<state>.<property>`

## Anti-patterns
- Putting BU name into token paths
- Duplicating primitives inside each BU unless required
- Using ambiguous names like `blue1`, `niceGray`, `primaryish`
