import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActionButton,
  Divider,
  Flex,
  Heading,
  Provider,
  Text,
  View,
  defaultTheme,
} from '@adobe/react-spectrum';
import { FolderPicker } from './components/FolderPicker';
import { Sidebar } from './components/Sidebar';
import { TokenEditor } from './components/TokenEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { CoreViewer } from './components/CoreViewer';
import { ThemeToggle } from './components/ThemeToggle';
import { ChromeBar, ChromeStatus } from './components/Chrome';
import { useAppStore } from './store';
import { parseTokenDocument, validateTokenDocument } from '@aro-studio/core';
import { Save, XCircle, Undo2, Redo2 } from 'lucide-react';
import { FOLDER_CACHE_KEY, loadFolderFromPath } from './utils/folderLoader';
import type { TokenDocument } from '@aro-studio/core';

type ColorScheme = 'light' | 'dark';
type DiffEntry = {
  path: string;
  before: string;
  after: string;
};
type DiffData = {
  coreChangedPaths: string[];
  buChangedPaths: string[];
  coreDiffs: DiffEntry[];
  buDiffs: DiffEntry[];
  impactedRefs: number;
};

function App() {
  const {
    tokenRoot,
    selectedBU,
    selectedCore,
    selectedCoreFile,
    tokenContent,
    setValidationIssues,
    isDirty,
    setIsDirty,
    validationIssues,
    reset,
    buDoc,
    coreDocsByFile,
    buPath,
    setBuDoc,
    mergedDoc,
    setCoreDirty,
    refreshInitialDocs,
    initialCoreDocsByFile,
    initialBuDoc,
    version,
    setVersion,
  } = useAppStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [bumpVersionChecked, setBumpVersionChecked] = useState(false);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem('token-editor:color-scheme');
    return stored === 'light' ? 'light' : 'dark';
  });

  const handleColorSchemeChange = useCallback((scheme: ColorScheme) => {
    setColorScheme(scheme);
    localStorage.setItem('token-editor:color-scheme', scheme);
  }, []);

  // Undo/Redo state from temporal store
  const temporalState = useAppStore.temporal.getState();
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  // Subscribe to temporal store changes
  useEffect(() => {
    const unsubscribe = useAppStore.temporal.subscribe((state) => {
      setUndoCount(state.pastStates.length);
      setRedoCount(state.futureStates.length);
    });
    // Initial sync
    setUndoCount(temporalState.pastStates.length);
    setRedoCount(temporalState.futureStates.length);
    return unsubscribe;
  }, [temporalState]);

  const handleUndo = useCallback(() => {
    const { undo, pastStates } = useAppStore.temporal.getState();
    if (pastStates.length > 0) {
      undo();
      setIsDirty(true);
    }
  }, [setIsDirty]);

  const handleRedo = useCallback(() => {
    const { redo, futureStates } = useAppStore.temporal.getState();
    if (futureStates.length > 0) {
      redo();
      setIsDirty(true);
    }
  }, [setIsDirty]);

  // Diff computation functions (called lazily when dialog opens)
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const computeDiffData = useCallback((): DiffData => {
    const formatDiffValue = (value: unknown): string => {
      if (value === undefined) return '∅';
      if (isObject(value) && '$value' in value) {
        const leaf = value as Record<string, unknown>;
        const parts = [`"$value": ${JSON.stringify(leaf.$value)}`];
        if (leaf.$type !== undefined) {
          parts.push(`"$type": ${JSON.stringify(leaf.$type)}`);
        }
        if (leaf.$description !== undefined) {
          parts.push(`"$description": ${JSON.stringify(leaf.$description)}`);
        }
        return `{ ${parts.join(', ')} }`;
      }
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    const truncateDiffValue = (value: string, limit = 120): string => {
      if (value.length <= limit) return value;
      return `${value.slice(0, limit - 3)}...`;
    };

    const collectChanges = (
      prevDoc: TokenDocument | undefined,
      nextDoc: TokenDocument | undefined,
      prefix: string[] = [],
      acc: Set<string>
    ): Set<string> => {
      const keys = new Set<string>([...Object.keys(prevDoc || {}), ...Object.keys(nextDoc || {})]);
      keys.forEach((key) => {
        if (key === '$schema') return;
        const pathArr = [...prefix, key];
        const prevVal = prevDoc ? (prevDoc as Record<string, unknown>)[key] : undefined;
        const nextVal = nextDoc ? (nextDoc as Record<string, unknown>)[key] : undefined;
        const bothObjects = isObject(prevVal) && isObject(nextVal);
        const prevLeaf = isObject(prevVal) && '$value' in prevVal;
        const nextLeaf = isObject(nextVal) && '$value' in nextVal;
        if (prevLeaf || nextLeaf) {
          const prevValue = prevLeaf ? (prevVal as any).$value : undefined;
          const nextValue = nextLeaf ? (nextVal as any).$value : undefined;
          const prevType = prevLeaf ? (prevVal as any).$type : undefined;
          const nextType = nextLeaf ? (nextVal as any).$type : undefined;
          const prevDesc = prevLeaf ? (prevVal as any).$description : undefined;
          const nextDesc = nextLeaf ? (nextVal as any).$description : undefined;
          if (
            prevValue !== nextValue ||
            prevType !== nextType ||
            prevDesc !== nextDesc ||
            prevLeaf !== nextLeaf
          ) {
            acc.add(pathArr.join('.'));
          }
        } else if (bothObjects) {
          collectChanges(prevVal as TokenDocument, nextVal as TokenDocument, pathArr, acc);
        } else if (prevVal !== nextVal) {
          acc.add(pathArr.join('.'));
        }
      });
      return acc;
    };

    const collectDiffs = (
      prevDoc: TokenDocument | undefined,
      nextDoc: TokenDocument | undefined,
      prefix: string[] = [],
      acc: DiffEntry[]
    ): DiffEntry[] => {
      const keys = new Set<string>([...Object.keys(prevDoc || {}), ...Object.keys(nextDoc || {})]);
      keys.forEach((key) => {
        if (key === '$schema') return;
        const pathArr = [...prefix, key];
        const prevVal = prevDoc ? (prevDoc as Record<string, unknown>)[key] : undefined;
        const nextVal = nextDoc ? (nextDoc as Record<string, unknown>)[key] : undefined;
        const bothObjects = isObject(prevVal) && isObject(nextVal);
        const prevLeaf = isObject(prevVal) && '$value' in prevVal;
        const nextLeaf = isObject(nextVal) && '$value' in nextVal;
        if (prevLeaf || nextLeaf) {
          const prevValue = prevLeaf ? (prevVal as any).$value : undefined;
          const nextValue = nextLeaf ? (nextVal as any).$value : undefined;
          const prevType = prevLeaf ? (prevVal as any).$type : undefined;
          const nextType = nextLeaf ? (nextVal as any).$type : undefined;
          const prevDesc = prevLeaf ? (prevVal as any).$description : undefined;
          const nextDesc = nextLeaf ? (nextVal as any).$description : undefined;
          if (
            prevValue !== nextValue ||
            prevType !== nextType ||
            prevDesc !== nextDesc ||
            prevLeaf !== nextLeaf
          ) {
            acc.push({
              path: pathArr.join('.'),
              before: truncateDiffValue(formatDiffValue(prevVal)),
              after: truncateDiffValue(formatDiffValue(nextVal)),
            });
          }
        } else if (bothObjects) {
          collectDiffs(prevVal as TokenDocument, nextVal as TokenDocument, pathArr, acc);
        } else if (prevVal !== nextVal) {
          acc.push({
            path: pathArr.join('.'),
            before: truncateDiffValue(formatDiffValue(prevVal)),
            after: truncateDiffValue(formatDiffValue(nextVal)),
          });
        }
      });
      return acc;
    };

    // Compute core changes
    const coreChanged = new Set<string>();
    Object.keys({ ...initialCoreDocsByFile, ...coreDocsByFile }).forEach((file) => {
      collectChanges(initialCoreDocsByFile[file], coreDocsByFile[file], [], coreChanged);
    });
    const coreChangedPaths = Array.from(coreChanged).sort();

    // Compute BU changes
    const buChanged = new Set<string>();
    if (initialBuDoc || buDoc) {
      collectChanges(initialBuDoc || undefined, buDoc || undefined, [], buChanged);
    }
    const buChangedPaths = Array.from(buChanged).sort();

    // Compute core diffs
    const coreDiffs: DiffEntry[] = [];
    Object.keys({ ...initialCoreDocsByFile, ...coreDocsByFile }).forEach((file) => {
      collectDiffs(initialCoreDocsByFile[file], coreDocsByFile[file], [file], coreDiffs);
    });

    // Compute BU diffs
    const buDiffs: DiffEntry[] = [];
    if (initialBuDoc || buDoc) {
      collectDiffs(initialBuDoc || undefined, buDoc || undefined, [], buDiffs);
    }

    // Compute impacted refs
    let impactedRefs = 0;
    if (mergedDoc && coreChangedPaths.length > 0) {
      const targetPaths = new Set(coreChangedPaths);
      const walk = (node: TokenDocument) => {
        Object.entries(node).forEach(([key, value]) => {
          if (key === '$schema') return;
          if (isObject(value)) {
            if ('$value' in value) {
              const val = (value as any).$value;
              if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
                const refPath = val.slice(1, -1);
                if (targetPaths.has(refPath)) {
                  impactedRefs += 1;
                }
              }
            } else {
              walk(value as TokenDocument);
            }
          }
        });
      };
      walk(mergedDoc);
    }

    return { coreChangedPaths, buChangedPaths, coreDiffs, buDiffs, impactedRefs };
  }, [initialCoreDocsByFile, coreDocsByFile, initialBuDoc, buDoc, mergedDoc]);

  const parsedVersion = useMemo(() => {
    if (!version) return null;
    const parts = version.split('.').map((part) => parseInt(part, 10));
    if (parts.length !== 3) return null;
    if (parts.some((part) => Number.isNaN(part))) return null;
    return { major: parts[0], minor: parts[1], patch: parts[2] };
  }, [version]);

  const diffPreviewLimit = 6;
  const requiresVersionBump = diffData ? diffData.coreChangedPaths.length > 0 : false;
  const canBumpVersion = Boolean(parsedVersion);
  const shouldBlockSaveForVersion = requiresVersionBump && !bumpVersionChecked;
  const versionMissingForCore = requiresVersionBump && !canBumpVersion;

  const performSave = useCallback(async () => {
    if (!selectedBU || !window.electronAPI || !tokenContent || !tokenRoot) {
      return;
    }

    let parsedData: unknown = buDoc;
    if (!parsedData) {
      try {
        parsedData = JSON.parse(tokenContent);
      } catch {
        return;
      }
    }

    setIsSaving(true);

    try {
      // Optional version bump
      if (bumpVersionChecked && parsedVersion) {
        const newVersion = `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch + 1}`;
        const versionPath = `${tokenRoot}/${selectedBU}/version.json`;
        await window.electronAPI.writeJson(versionPath, { version: newVersion });
      }

      const result = await window.electronAPI.saveTokens({
        tokensDir: tokenRoot,
        bu: selectedBU,
        coreDocsByFile,
        buDoc: parsedData as any,
        buPath: buPath ?? undefined,
      });

      if (!result.error && result.data?.success) {
        setIsDirty(false);
        setCoreDirty(false);
        if (bumpVersionChecked && parsedVersion) {
          const newVersion = `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch + 1}`;
          setVersion(newVersion);
        }
        refreshInitialDocs();
      }
    } finally {
      setIsSaving(false);
      setIsSaveDialogOpen(false);
      setDiffData(null);
    }
  }, [
    selectedBU,
    tokenRoot,
    tokenContent,
    buDoc,
    coreDocsByFile,
    buPath,
    setIsDirty,
    refreshInitialDocs,
    setCoreDirty,
    bumpVersionChecked,
    parsedVersion,
    setVersion,
  ]);

  const handleSave = useCallback(() => {
    if (!selectedBU || !window.electronAPI || !tokenContent || !tokenRoot) {
      return;
    }
    // Compute diffs lazily only when opening the save dialog
    const computed = computeDiffData();
    setDiffData(computed);
    const hasCoreChanges = computed.coreChangedPaths.length > 0;
    const hasBuChanges = computed.buChangedPaths.length > 0;
    if (hasCoreChanges || hasBuChanges) {
      setBumpVersionChecked(hasCoreChanges || hasBuChanges);
      setIsSaveDialogOpen(true);
    } else {
      void performSave();
    }
  }, [computeDiffData, performSave, selectedBU, tokenContent, tokenRoot]);

  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');
  const canSave = isDirty && !isSaving && !hasErrors && selectedBU;
  const canConfirmSave = !isSaving && !shouldBlockSaveForVersion && !versionMissingForCore;

  // Validate token content when it changes (debounced to reduce lag)
  useEffect(() => {
    if (!tokenContent || !selectedBU) {
      setValidationIssues([]);
      setBuDoc(null);
      return;
    }

    const handle = setTimeout(() => {
      try {
        const parsed = JSON.parse(tokenContent);
        const doc = parseTokenDocument(parsed);
        setBuDoc(doc);
        const base = mergedDoc ?? doc;
        const issues = validateTokenDocument(base, { resolverDoc: mergedDoc ?? doc });
        setValidationIssues(issues);
      } catch (error) {
        setValidationIssues([
          {
            path: '',
            message: error instanceof Error ? error.message : 'Invalid JSON',
            severity: 'error',
          },
        ]);
        setBuDoc(null);
      }
    }, 150);

    return () => clearTimeout(handle);
  }, [tokenContent, selectedBU, setValidationIssues, setBuDoc, mergedDoc]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (canSave) {
          handleSave();
        }
      }
      // Undo: Cmd/Ctrl + Z (without Shift)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSave, handleSave, handleUndo, handleRedo]);

  // Auto-load cached folder on start
  useEffect(() => {
    const cachedPath = localStorage.getItem(FOLDER_CACHE_KEY);
    if (!cachedPath) return;

    let isCancelled = false;

    (async () => {
      const ok = await loadFolderFromPath(cachedPath, { cache: true, mode: 'auto' });
      if (!ok && !isCancelled) {
        localStorage.removeItem(FOLDER_CACHE_KEY);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleClearCache = useCallback(() => {
    localStorage.removeItem(FOLDER_CACHE_KEY);
    reset();
  }, [reset]);

  const hasFolder = Boolean(tokenRoot);
  const helperMessage = hasFolder ? 'Folder loaded' : 'Select a tokens/ directory to get started';

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme} height="100vh" width="100vw">
      <Flex direction="column" height="100%">
        <ChromeBar
          left={
            <Heading level={4} margin="size-0">
              Aro Studio — Token Editor
            </Heading>
          }
          center={
            <Flex alignItems="center" gap="size-150" wrap="wrap">
              <Text>{helperMessage}</Text>
              {!hasFolder ? (
                <FolderPicker />
              ) : (
                <ActionButton onPress={handleClearCache} isQuiet aria-label="Clear saved folder">
                  <XCircle size={14} />
                </ActionButton>
              )}
            </Flex>
          }
          right={
            <Flex alignItems="center" gap="size-150">
              <ActionButton
                onPress={handleUndo}
                isDisabled={undoCount === 0}
                isQuiet
                aria-label={undoCount > 0 ? `Undo (${undoCount}) Cmd+Z` : 'Nothing to undo'}
              >
                <Undo2 size={14} />
              </ActionButton>
              <ActionButton
                onPress={handleRedo}
                isDisabled={redoCount === 0}
                isQuiet
                aria-label={redoCount > 0 ? `Redo (${redoCount}) Cmd+Shift+Z` : 'Nothing to redo'}
              >
                <Redo2 size={14} />
              </ActionButton>
              <Divider orientation="vertical" size="S" />
              <ActionButton
                onPress={handleSave}
                isDisabled={!canSave}
                aria-label={canSave ? 'Save (Cmd+S)' : 'No changes to save'}
              >
                <Save size={14} />
              </ActionButton>
              <Divider orientation="vertical" size="S" />
              <ThemeToggle colorScheme={colorScheme} onChange={handleColorSchemeChange} />
            </Flex>
          }
        />

        <Flex flex="1" minHeight={0}>
          {tokenRoot && (
            <View
              width="size-3200"
              borderEndWidth="thin"
              borderColor="gray-300"
              backgroundColor="gray-75"
              overflow="auto"
            >
              <View padding="size-200">
                <Text
                  UNSAFE_style={{ fontSize: 12, color: 'var(--spectrum-global-color-gray-700)' }}
                >
                  Select a business unit or core file to view
                </Text>
              </View>
              <Sidebar />
            </View>
          )}

          <Flex flex="1" minWidth={0} UNSAFE_style={{ overflow: 'hidden' }}>
            {selectedBU ? (
              <Flex flex="1" minHeight={0}>
                <View flex="1" minHeight={0}>
                  <TokenEditor />
                </View>
                <View
                  width="size-3600"
                  borderStartWidth="thin"
                  borderColor="gray-300"
                  overflow="auto"
                >
                  <ValidationPanel />
                </View>
              </Flex>
            ) : selectedCore && selectedCoreFile ? (
              <View flex="1" minHeight={0}>
                <CoreViewer />
              </View>
            ) : null}
          </Flex>
        </Flex>

        <ChromeStatus
          left={
            useAppStore.getState().isDirty ? (
              <Text UNSAFE_style={{ color: 'var(--spectrum-semantic-negative-color-default)' }}>
                ● Unsaved changes
              </Text>
            ) : null
          }
          right={
            tokenRoot ? (
              <Text UNSAFE_style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Token Root: {tokenRoot}
              </Text>
            ) : null
          }
        />

        {isSaveDialogOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              setIsSaveDialogOpen(false);
              setDiffData(null);
            }}
          >
            <div
              style={{
                background: 'var(--spectrum-global-color-gray-50)',
                padding: '16px',
                borderRadius: 8,
                border: '1px solid var(--spectrum-global-color-gray-400)',
                minWidth: 360,
                maxWidth: 520,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Heading level={4} marginBottom="size-200">
                Confirm save
              </Heading>
              {diffData && diffData.coreChangedPaths.length > 0 ? (
                <View marginBottom="size-200">
                  <Text UNSAFE_style={{ fontWeight: 600 }}>
                    Core changes ({diffData.coreChangedPaths.length})
                  </Text>
                  <Text UNSAFE_style={{ display: 'block', fontSize: 12 }}>
                    {diffData.coreChangedPaths.slice(0, 8).join(', ')}
                    {diffData.coreChangedPaths.length > 8
                      ? `, +${diffData.coreChangedPaths.length - 8} more`
                      : ''}
                  </Text>
                  <Text
                    UNSAFE_style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--spectrum-semantic-caution-color-default)',
                    }}
                  >
                    Approx impacted references: {diffData.impactedRefs}
                  </Text>
                  <Text UNSAFE_style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                    Recommendation: bump BU version after core edits.
                  </Text>
                  {diffData.coreDiffs.length > 0 && (
                    <View marginTop="size-150">
                      <Text UNSAFE_style={{ fontWeight: 600, fontSize: 12 }}>
                        Core diff preview
                      </Text>
                      {diffData.coreDiffs.slice(0, diffPreviewLimit).map((diff, index) => (
                        <View key={`${diff.path}-${index}`} marginTop="size-100">
                          <Text UNSAFE_style={{ fontSize: 12 }}>{diff.path}</Text>
                          <Text
                            UNSAFE_style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              display: 'block',
                            }}
                          >
                            before: {diff.before}
                          </Text>
                          <Text
                            UNSAFE_style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              display: 'block',
                            }}
                          >
                            after: {diff.after}
                          </Text>
                        </View>
                      ))}
                      {diffData.coreDiffs.length > diffPreviewLimit ? (
                        <Text UNSAFE_style={{ fontSize: 11, marginTop: 4 }}>
                          +{diffData.coreDiffs.length - diffPreviewLimit} more…
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              ) : (
                <Text>No core changes detected.</Text>
              )}
              {diffData && diffData.buChangedPaths.length > 0 ? (
                <View marginBottom="size-200">
                  <Text UNSAFE_style={{ fontWeight: 600 }}>
                    BU changes ({diffData.buChangedPaths.length})
                  </Text>
                  <Text UNSAFE_style={{ display: 'block', fontSize: 12 }}>
                    {diffData.buChangedPaths.slice(0, 8).join(', ')}
                    {diffData.buChangedPaths.length > 8
                      ? `, +${diffData.buChangedPaths.length - 8} more`
                      : ''}
                  </Text>
                  {diffData.buDiffs.length > 0 && (
                    <View marginTop="size-150">
                      <Text UNSAFE_style={{ fontWeight: 600, fontSize: 12 }}>BU diff preview</Text>
                      {diffData.buDiffs.slice(0, diffPreviewLimit).map((diff, index) => (
                        <View key={`${diff.path}-${index}`} marginTop="size-100">
                          <Text UNSAFE_style={{ fontSize: 12 }}>{diff.path}</Text>
                          <Text
                            UNSAFE_style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              display: 'block',
                            }}
                          >
                            before: {diff.before}
                          </Text>
                          <Text
                            UNSAFE_style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              display: 'block',
                            }}
                          >
                            after: {diff.after}
                          </Text>
                        </View>
                      ))}
                      {diffData.buDiffs.length > diffPreviewLimit ? (
                        <Text UNSAFE_style={{ fontSize: 11, marginTop: 4 }}>
                          +{diffData.buDiffs.length - diffPreviewLimit} more…
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              ) : (
                <Text>No BU changes detected.</Text>
              )}
              <Flex alignItems="center" gap="size-150" marginBottom="size-200">
                <input
                  type="checkbox"
                  checked={bumpVersionChecked}
                  onChange={(e) => setBumpVersionChecked(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                  id="bump-version-checkbox"
                  disabled={!canBumpVersion}
                />
                <label htmlFor="bump-version-checkbox" style={{ fontSize: 13 }}>
                  Bump patch version on save
                </label>
              </Flex>
              {versionMissingForCore && (
                <Text
                  UNSAFE_style={{
                    fontSize: 12,
                    color: 'var(--spectrum-semantic-negative-color-default)',
                    marginBottom: 8,
                  }}
                >
                  Core edits require a valid BU version (x.y.z). Please fix `version.json` to
                  continue.
                </Text>
              )}
              {shouldBlockSaveForVersion && !versionMissingForCore && (
                <Text
                  UNSAFE_style={{
                    fontSize: 12,
                    color: 'var(--spectrum-semantic-caution-color-default)',
                    marginBottom: 8,
                  }}
                >
                  Core edits require a BU version bump. Enable the checkbox to continue.
                </Text>
              )}
              <Flex justifyContent="end" gap="size-150" marginTop="size-200">
                <ActionButton
                  onPress={() => {
                    setIsSaveDialogOpen(false);
                    setDiffData(null);
                  }}
                  isQuiet
                >
                  Cancel
                </ActionButton>
                <ActionButton onPress={() => void performSave()} isDisabled={!canConfirmSave}>
                  {isSaving ? 'Saving...' : 'Save'}
                </ActionButton>
              </Flex>
            </div>
          </div>
        )}
      </Flex>
    </Provider>
  );
}

export default App;
