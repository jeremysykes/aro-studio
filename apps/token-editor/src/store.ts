import { create } from 'zustand';
import { temporal } from 'zundo';
import { BU, CoreEntry, ValidationIssue, TokenDocument, SourceMapEntry, FlatTokenRow } from '@aro-studio/core';

export type FilterLayer = 'all' | 'core' | 'bu';

// State that we track for undo/redo (token documents only)
interface TrackedState {
  buDoc: TokenDocument | null;
  coreDocsByFile: Record<string, TokenDocument>;
  buRowsByName: Record<string, FlatTokenRow[]>;
}

interface AppState {
  selectedFolder: string | null;
  tokenRoot: string | null;
  businessUnits: BU[];
  coreEntries: CoreEntry[];
  selectedBU: string | null;
  selectedCore: string | null;
  selectedCoreFile: string | null;
  tokenContent: string | null;
  isDirty: boolean;
  validationIssues: ValidationIssue[];
  version: string | null;
  coreDocsByFile: Record<string, TokenDocument>;
  buDoc: TokenDocument | null;
  buPath: string | null;
  mergedDoc: TokenDocument | null;
  flatTokens: FlatTokenRow[];
  sourceMaps: Record<string, SourceMapEntry>;
  coreModeEnabled: boolean;
  coreDirty: boolean;
  initialCoreDocsByFile: Record<string, TokenDocument>;
  initialBuDoc: TokenDocument | null;
  coreRowsByFile: Record<string, FlatTokenRow[]>;
  buRowsByName: Record<string, FlatTokenRow[]>;

  // Filter state
  searchQuery: string;
  filterType: string | null;
  filterLayer: FilterLayer;
  filterHasReference: boolean | null;

  // Selection state (for bulk edit)
  selectedPaths: Set<string>;

  // Grouping state
  collapsedGroups: Set<string>;

  // Actions
  setSelectedFolder: (folder: string | null) => void;
  setTokenRoot: (root: string | null) => void;
  setBusinessUnits: (bus: BU[]) => void;
  setCoreEntries: (entries: CoreEntry[]) => void;
  setSelectedBU: (bu: string | null) => void;
  setSelectedCore: (core: string | null, file?: string | null) => void;
  setTokenContent: (content: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setVersion: (version: string | null) => void;
  setLoaderData: (data: {
    coreDocsByFile?: Record<string, TokenDocument>;
    buDoc?: TokenDocument | null;
    buPath?: string | null;
    mergedDoc?: TokenDocument | null;
    flatTokens?: FlatTokenRow[];
    sourceMaps?: Record<string, SourceMapEntry>;
    coreModeEnabled?: boolean;
    coreDirty?: boolean;
    initialCoreDocsByFile?: Record<string, TokenDocument>;
    initialBuDoc?: TokenDocument | null;
  }) => void;
  setBuDoc: (doc: TokenDocument | null) => void;
  setCoreModeEnabled: (enabled: boolean) => void;
  setCoreDirty: (dirty: boolean) => void;
  setInitialDocs: (coreDocs: Record<string, TokenDocument>, buDoc: TokenDocument | null) => void;
  refreshInitialDocs: () => void;
  setCoreRowsByFile: (rows: Record<string, FlatTokenRow[]>) => void;
  setBuRowsByName: (rows: Record<string, FlatTokenRow[]>) => void;
  reset: () => void;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;
  setFilterLayer: (layer: FilterLayer) => void;
  setFilterHasReference: (hasRef: boolean | null) => void;
  clearFilters: () => void;

  // Selection actions
  toggleRowSelection: (path: string) => void;
  selectAllRows: (paths: string[]) => void;
  clearSelection: () => void;

  // Grouping actions
  toggleGroupCollapse: (group: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: (groups: string[]) => void;
}

export const useAppStore = create<AppState>()(
  temporal(
    (set) => ({
  selectedFolder: null,
  tokenRoot: null,
  businessUnits: [],
  coreEntries: [],
  selectedBU: null,
  selectedCore: null,
  selectedCoreFile: null,
  tokenContent: null,
  isDirty: false,
  validationIssues: [],
  version: null,
  coreDocsByFile: {},
  buDoc: null,
  buPath: null,
  mergedDoc: null,
  flatTokens: [],
  sourceMaps: {},
  coreModeEnabled: false,
  coreDirty: false,
  initialCoreDocsByFile: {},
  initialBuDoc: null,
  coreRowsByFile: {},
  buRowsByName: {},

  // Filter state defaults
  searchQuery: '',
  filterType: null,
  filterLayer: 'all',
  filterHasReference: null,

  // Selection state default
  selectedPaths: new Set<string>(),

  // Grouping state default
  collapsedGroups: new Set<string>(),

  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setTokenRoot: (root) => set({ tokenRoot: root }),
  setBusinessUnits: (bus) => set({ businessUnits: bus }),
  setCoreEntries: (entries) => set({ coreEntries: entries }),
  setSelectedBU: (bu) =>
    set({
      selectedBU: bu,
      selectedCore: null,
      selectedCoreFile: null,
      isDirty: false,
    }),
  setSelectedCore: (core, file = null) =>
    set({
      selectedCore: core,
      selectedCoreFile: file,
      selectedBU: null,
      isDirty: false,
    }),
  setTokenContent: (content) =>
    set({ tokenContent: content, isDirty: content !== null }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setValidationIssues: (issues) => set({ validationIssues: issues }),
  setVersion: (version) => set({ version }),
  setLoaderData: (data) =>
    set((state) => ({
      coreDocsByFile: data.coreDocsByFile ?? state.coreDocsByFile,
      buDoc: data.buDoc ?? state.buDoc,
      buPath: data.buPath ?? state.buPath,
      mergedDoc: data.mergedDoc ?? state.mergedDoc,
      flatTokens: data.flatTokens ?? state.flatTokens,
      sourceMaps: data.sourceMaps ?? state.sourceMaps,
      coreModeEnabled: data.coreModeEnabled ?? state.coreModeEnabled,
      coreDirty: data.coreDirty ?? state.coreDirty,
      initialCoreDocsByFile: data.initialCoreDocsByFile ?? state.initialCoreDocsByFile,
      initialBuDoc: data.initialBuDoc ?? state.initialBuDoc,
    })),
  setBuDoc: (doc) => set({ buDoc: doc }),
  setCoreModeEnabled: (enabled) => set({ coreModeEnabled: enabled }),
  setCoreDirty: (dirty) => set({ coreDirty: dirty }),
  setInitialDocs: (coreDocs, buDoc) => set({ initialCoreDocsByFile: coreDocs, initialBuDoc: buDoc }),
  refreshInitialDocs: () =>
    set((state) => ({
      initialCoreDocsByFile: state.coreDocsByFile,
      initialBuDoc: state.buDoc,
    })),
  setCoreRowsByFile: (rows) => set({ coreRowsByFile: rows }),
  setBuRowsByName: (rows) => set({ buRowsByName: rows }),
  reset: () =>
    set({
      selectedFolder: null,
      tokenRoot: null,
      businessUnits: [],
      coreEntries: [],
      selectedBU: null,
      selectedCore: null,
      selectedCoreFile: null,
      tokenContent: null,
      isDirty: false,
      validationIssues: [],
      version: null,
      coreDocsByFile: {},
      buDoc: null,
      buPath: null,
      mergedDoc: null,
      flatTokens: [],
      sourceMaps: {},
      coreModeEnabled: false,
      coreDirty: false,
      initialCoreDocsByFile: {},
      initialBuDoc: null,
      coreRowsByFile: {},
      buRowsByName: {},
      searchQuery: '',
      filterType: null,
      filterLayer: 'all',
      filterHasReference: null,
      selectedPaths: new Set<string>(),
      collapsedGroups: new Set<string>(),
    }),

  // Filter actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterLayer: (layer) => set({ filterLayer: layer }),
  setFilterHasReference: (hasRef) => set({ filterHasReference: hasRef }),
  clearFilters: () =>
    set({
      searchQuery: '',
      filterType: null,
      filterLayer: 'all',
      filterHasReference: null,
    }),

  // Selection actions
  toggleRowSelection: (path) =>
    set((state) => {
      const newSelected = new Set(state.selectedPaths);
      if (newSelected.has(path)) {
        newSelected.delete(path);
      } else {
        newSelected.add(path);
      }
      return { selectedPaths: newSelected };
    }),
  selectAllRows: (paths) =>
    set({ selectedPaths: new Set(paths) }),
  clearSelection: () =>
    set({ selectedPaths: new Set<string>() }),

  // Grouping actions
  toggleGroupCollapse: (group) =>
    set((state) => {
      const newCollapsed = new Set(state.collapsedGroups);
      if (newCollapsed.has(group)) {
        newCollapsed.delete(group);
      } else {
        newCollapsed.add(group);
      }
      return { collapsedGroups: newCollapsed };
    }),
  expandAllGroups: () =>
    set({ collapsedGroups: new Set<string>() }),
  collapseAllGroups: (groups) =>
    set({ collapsedGroups: new Set(groups) }),
}),
    {
      // Only track token document state for undo/redo
      partialize: (state): TrackedState => ({
        buDoc: state.buDoc,
        coreDocsByFile: state.coreDocsByFile,
        buRowsByName: state.buRowsByName,
      }),
      // Limit history to prevent memory issues
      limit: 50,
      // Custom equality to deep compare documents
      equality: (pastState, currentState) =>
        JSON.stringify(pastState) === JSON.stringify(currentState),
    }
  )
);

// Access undo/redo functionality via useAppStore.temporal.getState()
// Example: const { undo, redo, pastStates, futureStates } = useAppStore.temporal.getState();

