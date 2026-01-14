# Decisions

Log major decisions so the project doesn't loop.

Format:
- YYYY-MM-DD — Decision
  - Context:
  - Decision:
  - Why:
  - Rejected:
  - Notes:

## 2026-01-14 — UI system
- Context: Minimize UI engineering overhead while keeping an Adobe-like pro-tool experience.
- Decision: Use Adobe React Spectrum for pre-styled, accessible UI components.
- Why: Professional defaults, strong accessibility, predictable interaction model.
- Rejected: Tailwind+Radix+shadcn style kits (too much component plumbing and over-abstraction).
