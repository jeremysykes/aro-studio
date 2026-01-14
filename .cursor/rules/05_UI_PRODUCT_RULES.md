# UI product rules

## Visual + interaction goal
Adobe-like “pro tool” UI with minimal UI engineering overhead:
- Use Adobe React Spectrum components by default
- Consistent, accessible keyboard/focus behavior
- Dense layouts (panels, split views), low decoration, high clarity

## Hard UI constraints
- Prefer Spectrum components over custom components.
- Do not introduce Tailwind, Radix, shadcn, Headless UI, or bespoke wrapper kits.
- Only create shared UI wrappers in packages/ui when there is clear duplication across apps.

## Theme
- Use Spectrum Provider.
- Theme toggle must switch between Spectrum default Light and Dark themes.
- Do not implement custom theming for MVP beyond the Spectrum toggle.

## Layout conventions (Token Editor)
- Left: business units list
- Center: token table
- Right: inspector for selected token
- Top: toolbar (search, validate, save)

## UX rules
- Every destructive action must be explicit.
- Save must clearly report success or error.
- Validation errors must be human-readable.

## Accessibility
- Keyboard navigation must work.
- Focus states must be visible.
- Ensure readable contrast in both Spectrum Light and Dark.
