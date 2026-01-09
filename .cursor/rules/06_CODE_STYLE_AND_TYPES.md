# Code style and types

## TypeScript rules

- No `any`.
- Avoid casting.
- Prefer explicit type guards and Zod inference where needed.
- Keep IO boundaries typed.

## Imports

- Use explicit imports.
- Avoid circular dependencies.
- Keep `packages/core` free of UI imports.

## Logging

Use `log` imported from `console` when logging in code examples.

## Formatting

- Consistent naming
- Avoid oversized files
- Keep components small and composable
