# Security and privacy

## Token data

Treat token files as potentially sensitive.

- Do not transmit tokens externally by default.
- No telemetry by default in MVP.

## Secrets

- No secrets in repo.
- No API keys in config.
- If syncing is added later, credentials must use OS keychain or secure storage.

## Electron security

- Disable remote module if applicable.
- Use context isolation.
- Prefer preload bridge APIs.
- No arbitrary file access outside allowed directories without explicit user action.
