# Token Editor Feature Roadmap

> Generated: January 2026  
> Reference: [Current Capabilities](./TOKEN_EDITOR_CAPABILITIES.md)

---

## Current Differentiators

What Aro Studio Token Editor already does well:

- ✅ **Desktop-first** (Electron) — most competitors are web/plugin-based
- ✅ **Two-layer token system** (core/BU) with inheritance — sophisticated multi-brand architecture
- ✅ **Gated Core Mode** with impact analysis — safety rails competitors lack
- ✅ **DTCG compliance** from day one
- ✅ **Diff preview with impacted reference count** — unique save workflow
- ✅ **Virtualized table** — handles scale better than many competitors

---

## Phase 1: Implement Now (Zero Outside Dependencies)

*Self-contained features that enhance the editor without external integrations.*

### 1.1 Search & Filter

**Priority**: 🔴 Critical  
**Effort**: Low

- Global search across path, value, description
- Filter by type (color, dimension, string, etc.)
- Filter by layer (core vs BU)
- Filter by "has reference" vs "literal value"
- Clear filters button

### 1.2 Color Picker UI

**Priority**: 🔴 Critical  
**Effort**: Low

- React Spectrum `<ColorPicker>` component (already in your stack)
- Color swatch preview in value column
- Support hex, rgba, hsla input formats
- Click swatch to open picker

### 1.3 Undo/Redo Stack

**Priority**: 🔴 Critical  
**Effort**: Medium

- Command pattern or Zustand middleware (`zundo`)
- Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z
- Undo count in status bar
- Clear history on save

### 1.4 Token Creation UI

**Priority**: 🟠 High  
**Effort**: Medium

- "Add Token" button in toolbar
- Modal dialog with fields:
  - Path (with dot notation helper)
  - Value
  - Type (auto-suggested from value pattern)
  - Description
- Option to create as reference `{path.to.token}`
- Validation before creation

### 1.5 Reference Autocomplete

**Priority**: 🟠 High  
**Effort**: Medium

- Typing `{` in value field triggers autocomplete
- Dropdown filtered by compatible type
- Shows resolved value preview
- Keyboard navigation (arrow keys, enter to select)

### 1.6 Bulk Edit / Multi-Select

**Priority**: 🟠 High  
**Effort**: Medium

- Checkbox column for row selection
- Select all / deselect all
- Bulk actions:
  - Delete selected
  - Change type
  - Add prefix/suffix to path
  - Find & replace in values

### 1.7 Export Preview

**Priority**: 🟡 Medium  
**Effort**: Medium

- New tab alongside Table/JSON
- Preview formats:
  - CSS custom properties
  - SCSS variables
  - JS/TS object
- Copy to clipboard button
- Format selector dropdown

### 1.8 Token Grouping / Collapse

**Priority**: 🟡 Medium  
**Effort**: Low

- Collapsible groups in table (color.*, spacing.*, typography.*)
- Expand/collapse all toggle
- Remember collapse state per session
- Group count badge

### 1.9 Keyboard Navigation

**Priority**: 🟡 Medium  
**Effort**: Medium

- Arrow keys to move between cells
- Enter to edit, Escape to cancel
- Tab to next editable cell
- Shift+Tab to previous cell
- Home/End for first/last row

### 1.10 Duplicate Token

**Priority**: 🟢 Low  
**Effort**: Low

- Right-click context menu → Duplicate
- Creates copy with `-copy` suffix
- Opens in edit mode immediately

### 1.11 Token Deletion with Safety

**Priority**: 🟢 Low  
**Effort**: Low

- Delete button per row (with confirmation)
- Show warning if token is referenced by others
- List impacted references before confirming

### 1.12 Recent Folders

**Priority**: 🟢 Low  
**Effort**: Low

- Remember last 5 opened folders
- Quick-access dropdown in folder picker
- Clear recent list option

---

## Phase 2: Implement Now (With Outside Dependencies)

*Features requiring external tools, APIs, or services.*

### 2.1 Git Integration

**Dependency**: Git CLI / GitHub/GitLab/Bitbucket API  
**Priority**: 🔴 Critical  
**Effort**: High

- Connect to repository (OAuth or PAT)
- Branch selector in sidebar
- Commit directly from app with message
- Pull/push with conflict detection
- Create branch for experimental changes
- Show uncommitted changes indicator

### 2.2 Figma Variables Import

**Dependency**: Figma REST API  
**Priority**: 🟠 High  
**Effort**: High

- "Import from Figma" button
- OAuth flow for Figma authentication
- Select Figma file and variable collection
- Parse W3C-compatible JSON export
- Conflict resolution UI:
  - Skip existing
  - Overwrite
  - Rename with suffix
- Mode mapping (Figma modes → BU/themes)

### 2.3 Style Dictionary Export

**Dependency**: `style-dictionary` npm package  
**Priority**: 🟠 High  
**Effort**: High

- Built-in Style Dictionary config editor
- One-click export to:
  - CSS
  - SCSS
  - iOS Swift
  - Android XML
  - JavaScript modules
  - TypeScript definitions
- Custom transform support
- Platform-specific preview tabs
- Save config for reuse

### 2.4 Webhook Notifications

**Dependency**: External webhook endpoints  
**Priority**: 🟡 Medium  
**Effort**: Medium

- Configure webhook URL in settings
- Fire on save/version bump
- Payload includes:
  - Changed tokens
  - Version info
  - Timestamp
- Retry logic for failed deliveries

### 2.5 Figma Variables Push (Bidirectional Sync)

**Dependency**: Figma Plugin API  
**Priority**: 🟡 Medium  
**Effort**: Very High

- Push tokens → Figma Variables
- Conflict detection and resolution
- Mode mapping bidirectional
- Incremental sync (only changed tokens)
- Companion Figma plugin required

### 2.6 NPM Package Publishing

**Dependency**: npm registry  
**Priority**: 🟢 Low  
**Effort**: Medium

- Configure package.json for tokens
- Publish tokens as npm package
- Semantic versioning tied to version.json
- Scoped package support (@org/tokens)

---

## Phase 3: Enterprise Level

*Features requiring significant infrastructure, multi-user support, or advanced architecture.*

### 3.1 Role-Based Access Control (RBAC)

**Priority**: 🔴 Critical for Enterprise  
**Effort**: Very High

- User authentication (SSO, OAuth)
- Roles: Viewer, Editor, Admin
- Permissions:
  - Core tokens: Admin only
  - BU tokens: Per-BU permissions
- Approval workflow for core changes
- Audit log of permission changes

### 3.2 Multi-Brand Theming Engine

**Priority**: 🔴 Critical for Enterprise  
**Effort**: Very High

- Theme Groups (e.g., "Color Mode": light/dark)
- Theme Options (e.g., "Brand": brand-a, brand-b)
- Matrix view: tokens × themes
- Preview how tokens resolve across combinations
- Theme inheritance and overrides

### 3.3 Changelog & Audit Trail

**Priority**: 🟠 High  
**Effort**: High

- Automatic changelog generation on save
- Who changed what, when
- Diff history viewer (time-travel)
- Export changelog as markdown
- Filter by date range, user, token path
- Compliance-ready export formats

### 3.4 Documentation Generator

**Priority**: 🟠 High  
**Effort**: High

- Auto-generate token documentation site
- Visual specimens:
  - Color swatches
  - Typography samples
  - Spacing visualizers
- Markdown export for Storybook/Docusaurus
- Custom token properties (status, figma-link, etc.)
- Embeddable documentation widgets

### 3.5 Cross-Project Dependencies

**Priority**: 🟠 High  
**Effort**: High

- Import tokens from external URL/package
- Lock imported tokens (read-only in consumer)
- Update notification when upstream changes
- Semantic versioning for token packages
- Dependency graph visualization

### 3.6 CI/CD Pipeline Integration

**Priority**: 🟠 High  
**Effort**: High

- GitHub Actions workflow templates
- GitLab CI configuration
- Validation as PR check
- Auto-deploy on version bump
- Slack/Teams notifications
- Build status badges

### 3.7 Token Analytics & Usage Tracking

**Priority**: 🟡 Medium  
**Effort**: Very High

- Codebase scanner (grep/AST-based)
- Track token usage across repositories
- "Used in N files" count per token
- Flag unused tokens for cleanup
- Deprecation workflow with migration path
- Usage trends over time

### 3.8 Component Token Mapping

**Priority**: 🟡 Medium  
**Effort**: High

- Map tokens to component variants
- Example: "Button primary uses color.action.primary"
- Generate component-specific token subsets
- Documentation: component ↔ token relationships
- Design-to-dev handoff reports

### 3.9 Real-Time Collaboration

**Priority**: 🟢 Low (nice-to-have)  
**Effort**: Very High

- Multiple cursors (like Figma/Google Docs)
- Presence indicators (who's viewing what)
- Conflict-free editing (CRDTs)
- Comments and annotations on tokens
- @mentions and notifications
- Requires backend infrastructure

### 3.10 Token Linting Rules

**Priority**: 🟢 Low  
**Effort**: Medium

- Custom validation rules
- Naming convention enforcement
- Required description for public tokens
- Color contrast checking (WCAG)
- Configurable severity (error/warning/info)

---

## Prioritization Summary

| Phase | Feature | Effort | Impact | Dependencies |
|-------|---------|--------|--------|--------------|
| **1** | Search & Filter | Low | 🔴 Critical | None |
| **1** | Color Picker | Low | 🔴 Critical | None |
| **1** | Undo/Redo | Medium | 🔴 Critical | None |
| **1** | Token Creation UI | Medium | 🟠 High | None |
| **1** | Reference Autocomplete | Medium | 🟠 High | None |
| **1** | Bulk Edit | Medium | 🟠 High | None |
| **2** | Git Integration | High | 🔴 Critical | Git CLI/API |
| **2** | Figma Import | High | 🟠 High | Figma API |
| **2** | Style Dictionary | High | 🟠 High | npm package |
| **3** | RBAC | Very High | 🔴 Critical | Auth infra |
| **3** | Multi-Brand Theming | Very High | 🔴 Critical | None (arch) |
| **3** | Changelog/Audit | High | 🟠 High | Database |

---

## Recommended Implementation Order

### Sprint 1-2: Core UX Polish
1. Search & Filter
2. Color Picker
3. Undo/Redo

### Sprint 3-4: Token Authoring
4. Token Creation UI
5. Reference Autocomplete
6. Token Deletion with Safety

### Sprint 5-6: Power User Features
7. Bulk Edit
8. Keyboard Navigation
9. Token Grouping

### Sprint 7-8: Export & Integration
10. Export Preview
11. Git Integration
12. Style Dictionary

### Future: Enterprise Foundation
13. Figma Import/Sync
14. RBAC
15. Changelog & Audit Trail

---

## Competitive Reference

| Feature | Aro Studio | Tokens Studio | Supernova |
|---------|------------|---------------|-----------|
| Desktop App | ✅ | ❌ (Figma plugin) | ❌ (Web) |
| DTCG Format | ✅ | ✅ | ✅ |
| Core/BU Layering | ✅ | Partial | ✅ |
| Git Integration | 🔜 | ✅ | ✅ |
| Figma Sync | 🔜 | ✅ | ✅ |
| Style Dictionary | 🔜 | ✅ | ✅ |
| RBAC | 🔜 | ✅ Pro | ✅ |
| Real-Time Collab | 🔜 | ❌ | ❌ |
| Offline Support | ✅ | ❌ | ❌ |

---

## Notes

- All Phase 1 features can be implemented with the current React Spectrum + TanStack stack
- Phase 2 features require careful API key/token management
- Phase 3 features may require a backend service for persistence and auth
