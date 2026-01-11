import { create } from 'zustand';
import { BU, CoreEntry, ValidationIssue } from '@aro-studio/core';

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
    }),
}));

