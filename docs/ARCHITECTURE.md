# Architecture

## Monorepo structure
- apps/*: product shells (Electron now, web later)
- packages/core: business logic, token contracts, validation, IO abstractions
- packages/ui: UI composition helpers and shared app chrome (Spectrum-first)

## Platform boundaries
- Electron main process: filesystem, OS integration
- Renderer: UI only
- Core: portable and platform-agnostic

## Locked stack
- Electron + React + TypeScript
- Adobe React Spectrum (pre-styled UI + accessibility)
- TanStack Table (token grid only)
- Zod (runtime validation)
