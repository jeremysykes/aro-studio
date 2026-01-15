# Aro Studio Token Editor — Capabilities Summary

## Overview

A desktop application built with **Electron + React** for editing DTCG (Design Tokens Community Group) compliant design tokens. Uses **Adobe React Spectrum** for UI components and **TanStack Table** with virtualization for displaying token data.

---

## Architecture

### Stack
- **Runtime**: Electron (desktop app with Node.js backend)
- **Frontend**: React 18 + TypeScript
- **UI Library**: Adobe React Spectrum
- **Table**: TanStack Table + TanStack Virtual (virtualized rows)
- **State Management**: Zustand
- **Code Editor**: Monaco Editor (JSON editing)

### Project Structure
```
apps/token-editor/     # Electron app
packages/core/         # Shared business logic (discovery, loading, validation, saving)
tokens/                # Example token files
  _core/               # Primitive tokens (palette, typography, spacing, shape, semantic)
  bu-a/, bu-b/, etc.   # Business unit semantic tokens (reference core via {path})
```

---

## Token Model

### DTCG Format
Tokens follow the Design Tokens Community Group JSON format:
```json
{
  "color": {
    "primary-500": {
      "$value": "#3A5B81",
      "$type": "color",
      "$description": "Primary brand color"
    }
  }
}
```

### Two-Layer System
1. **Core tokens** (`_core/`): Primitives like raw colors, spacing values, typography scales
2. **Business Unit tokens** (`bu-*/`): Semantic tokens that reference core via `{path.to.token}` syntax

### Merging Behavior
- Core files are merged alphabetically, then BU tokens are overlaid
- BU tokens can override core tokens or add new semantic aliases

---

## Features

### 1. Folder Discovery & Loading
- **Folder picker**: Native OS dialog to select a project folder
- **Auto-discovery**: Finds `tokens/` directory, discovers `_core/` and `bu-*` folders
- **Caching**: Remembers last opened folder across sessions
- **Hot reload**: Switch between BUs/core files without restarting

### 2. Token Viewing

#### Table View (default)
- **Virtualized rows**: Only renders visible rows (handles 500+ tokens smoothly)
- **Columns**: Path, Value, $type, $description
- **Layer badge**: Shows "core" or "bu" origin for each token
- **Reference resolution**: Shows resolved value for tokens using `{references}`

#### JSON View
- **Monaco Editor**: Full-featured JSON editor with syntax highlighting
- **Format on paste/type**: Auto-formats JSON
- **Line numbers**: Enabled by default

### 3. Token Editing

#### BU Token Editing
- **Inline editing**: Click any cell to edit value, type, or description
- **Boolean toggle**: Switch component for boolean tokens
- **Auto-save detection**: Tracks dirty state, enables save button

#### Core Token Editing (Gated)
- **Core Mode**: Disabled by default, requires explicit opt-in with confirmation dialog
- **Warning banner**: Shows when core edits are pending
- **Impact awareness**: Core edits affect all BUs

### 4. Validation (Real-time)

Runs automatically on content changes (debounced 150ms):

- **Required properties**: Checks for `$value` and `$type` on leaf tokens
- **Type validation**:
  - `color`: Must match hex or rgba pattern
  - `dimension`: Must include unit (px, rem, em, %)
  - `number`: Must be numeric
  - `boolean`: Must be true/false
  - `string`: Must be string type
- **Reference resolution**: Validates `{path.to.token}` references exist
- **Circular reference detection**: Catches self-referencing chains
- **Validation Panel**: Displays errors/warnings with paths and messages

### 5. Save Workflow

#### Pre-Save Dialog
Triggered when changes exist, shows:
- **Core changes count**: Number of modified core tokens
- **BU changes count**: Number of modified BU tokens
- **Diff preview**: Before/after values for up to 6 changes
- **Impacted references**: Count of tokens referencing changed core paths

#### Version Management
- **Version display**: Shows current `version.json` value (semver x.y.z)
- **Bump patch**: Checkbox to auto-increment patch version on save
- **Core edit enforcement**: Core edits require version bump (cannot skip)

#### Save Behavior
- Writes BU tokens to original `bu-*/tokens.json`
- Writes core tokens back to their respective `_core/*.json` files
- Preserves source mapping (tokens saved to their original files)

### 6. UI/UX Features

- **Theme toggle**: Light/dark mode (dark by default), persisted to localStorage
- **Keyboard shortcuts**: Cmd/Ctrl+S to save
- **Status bar**: Shows unsaved changes indicator and token root path
- **Sidebar navigation**: Picker component to switch between BUs and core files
- **Responsive layout**: Sidebar + main content + validation panel

---

## File System Operations (via Electron IPC)

```typescript
// Available APIs exposed to renderer
pickDirectory()           // Native folder picker
discoverTokenRoot(path)   // Find tokens/ directory
discoverBusinessUnits(dir)// List bu-* folders
discoverCore(dir)         // List _core files
loadTokens(dir, bu)       // Load & merge tokens for a BU
saveTokens(payload)       // Write changes back to files
readJson(path)            // Read any JSON file
writeJson(path, data)     // Write any JSON file
readFile(path)            // Read raw file content
listDir(path)             // List directory contents
```

---

## State Shape (Zustand Store)

```typescript
interface AppState {
  // Navigation
  tokenRoot: string | null;
  selectedBU: string | null;
  selectedCore: string | null;
  selectedCoreFile: string | null;
  businessUnits: BU[];
  coreEntries: CoreEntry[];

  // Documents
  buDoc: TokenDocument | null;
  coreDocsByFile: Record<string, TokenDocument>;
  mergedDoc: TokenDocument | null;
  
  // Display
  flatTokens: FlatTokenRow[];
  sourceMaps: Record<string, SourceMapEntry>;
  buRowsByName: Record<string, FlatTokenRow[]>;
  coreRowsByFile: Record<string, FlatTokenRow[]>;

  // Editing
  tokenContent: string | null;  // JSON string for Monaco
  isDirty: boolean;
  coreDirty: boolean;
  coreModeEnabled: boolean;
  
  // Validation
  validationIssues: ValidationIssue[];
  
  // Versioning
  version: string | null;
  
  // Diffing (for save dialog)
  initialCoreDocsByFile: Record<string, TokenDocument>;
  initialBuDoc: TokenDocument | null;
}
```

---

## Performance Optimizations

1. **Virtualized table**: Only renders visible rows (~20-30 at a time)
2. **Memoized cells**: Input components use local state to prevent cascading re-renders
3. **Lazy diff computation**: Diffs only computed when save dialog opens
4. **Debounced validation**: 150ms delay prevents lag during typing
5. **Optimized row updates**: Single row updates don't recompute entire document tree

---

## Limitations / Not Yet Implemented

- No undo/redo
- No search/filter in table view
- No drag-and-drop reordering
- No bulk editing
- No export to CSS/SCSS/JSON formats
- No color picker UI (values edited as text)
- No token creation wizard (add via JSON view)
- No git integration
