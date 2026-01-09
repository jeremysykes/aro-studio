# Architecture boundaries

## Monorepo

- `apps/*` are product shells (Electron now, web later).
- `packages/core` contains all business logic, validation, IO abstractions.
- `packages/ui` contains shared UI components and app shell layout.

## Electron rule

Electron main process is allowed to touch filesystem.
Renderer process must not access filesystem directly.
Renderer calls core via an interface layer.

## Core portability

`packages/core` must not import Electron, Node-only APIs, or browser-only APIs directly.
If platform-specific behavior is needed, define an adapter interface.

## Suggested adapters

- StorageAdapter (read/write/list)
- TelemetryAdapter (optional)
- ClockAdapter (if needed)
