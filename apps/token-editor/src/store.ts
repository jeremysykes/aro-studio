import { create } from 'zustand';
import { BU, CoreEntry, ValidationIssue, TokenDocument, SourceMapEntry, FlatTokenRow } from '@aro-studio/core';

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
}

export const useAppStore = create<AppState>((set) => ({
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
    }),
}));

