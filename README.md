# Aro Studio

Aro Studio is a professional toolkit for creating and managing multi-brand design systems. It provides token editing, validation, packaging, and AI-ready outputs in a fast, desktop-grade interface built for modern product teams.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm i
```

### Development

Run the Token Editor in development mode:

```bash
pnpm dev
```

This will:
- Start the Vite dev server for the React renderer
- Launch Electron with the Token Editor app
- Enable hot module replacement

### Using the Token Editor

1. Click "Open Tokens Folder" in the application
2. Select a folder containing a `tokens/` directory (e.g., `aro-studio` root folder)
3. The sidebar will show:
   - **Core**: Read-only folders starting with `_` (e.g., `_core`)
   - **Business Units**: Editable token folders (e.g., `bu-a`, `bu-b`)
4. Select a business unit to edit its `tokens.json` file
5. Make changes in the Monaco editor
6. Validation issues will appear in the right panel
7. Press `Cmd/Ctrl+S` or click "Save" to save changes

### Project Structure

```
aro-studio/
├── apps/
│   └── token-editor/      # Electron Token Editor app
├── packages/
│   ├── core/              # Token discovery, validation, IO abstractions
│   └── ui/                # Reusable UI components
└── tokens/                # Example token fixtures
```

## Scripts

- `pnpm i` - Install all dependencies
- `pnpm dev` - Run Token Editor in development mode
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages
- `pnpm build` - Build all packages

## Token Format

The Token Editor supports Design Tokens Community Group (DTCG) format. Token files must be valid JSON with:
- `$value` property (required for leaf tokens)
- `$type` property (recommended)
- `$description` property (optional)
