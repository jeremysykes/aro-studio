import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabList, TabPanels, Item, ActionButton, Flex, View, Text } from '@adobe/react-spectrum';
import { useAppStore } from '../store';
import { AlertCircle } from 'lucide-react';
import { TokenTable } from './TokenTable';
import type { FlatTokenRow, SourceMapEntry, TokenDocument, TokenValue } from '@aro-studio/core';

export function TokenEditor() {
  const {
    selectedBU,
    tokenContent,
    setTokenContent,
    setIsDirty,
    validationIssues,
    version,
    setVersion,
    tokenRoot,
    setLoaderData,
    setBuDoc,
    buDoc,
    coreDocsByFile,
    sourceMaps,
    coreModeEnabled,
    setCoreModeEnabled,
    coreDirty,
    setCoreDirty,
    setInitialDocs,
    refreshInitialDocs,
    buRowsByName,
    setBuRowsByName,
    setCoreRowsByFile,
  } = useAppStore();

  const [editorContent, setEditorContent] = useState(tokenContent || '');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(600); // Default fallback
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table'); // Default to table view

  const setNestedValue = (obj: Record<string, unknown>, path: string[], value: unknown) => {
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key] || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    current[path[path.length - 1]] = value;
  };

  // Utilities (renderer-side) to rebuild merged view and flat rows after edits
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const isLeafToken = (value: unknown): value is { $value: unknown; [key: string]: unknown } =>
    isObject(value) && '$value' in value;

  const isTokenGroup = (value: unknown): value is Record<string, unknown> => isObject(value) && !('$value' in value);

  const mergeTokenDocuments = useCallback((base: TokenDocument, override: TokenDocument): TokenDocument => {
    const result: TokenDocument = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (key === '$schema') {
        result[key] = value as TokenValue;
        continue;
      }
      const existing = result[key];
      if (isTokenGroup(existing) && isTokenGroup(value)) {
        result[key] = mergeTokenDocuments(existing as TokenDocument, value as TokenDocument);
      } else {
        result[key] = value as TokenValue;
      }
    }
    return result;
  }, []);

  const getValueByPath = (doc: TokenDocument, path: string): TokenValue | undefined => {
    const parts = path.split('.');
    let current: unknown = doc;
    for (const part of parts) {
      if (!isObject(current)) return undefined;
      current = current[part];
    }
    return current as TokenValue | undefined;
  };

  const resolveReference = (value: string, doc: TokenDocument, visited: Set<string> = new Set()) => {
    const match = value.match(/^\{([^}]+)\}$/);
    if (!match) return value;
    const refPath = match[1];
    if (visited.has(refPath)) return value;
    visited.add(refPath);
    const target = getValueByPath(doc, refPath);
    if (!target) return value;
    if (isLeafToken(target)) {
      const resolved = target.$value;
      if (typeof resolved === 'string') return resolveReference(resolved, doc, visited);
      return resolved as TokenValue;
    }
    return value;
  };

  const flattenDoc = useCallback(
    (doc: TokenDocument, layer: 'core' | 'bu', maps?: Record<string, SourceMapEntry>, merged?: TokenDocument): FlatTokenRow[] => {
      const rows: FlatTokenRow[] = [];
      const walk = (node: TokenDocument, prefix: string[] = []) => {
        Object.entries(node).forEach(([key, value]) => {
          if (key === '$schema') return;
          const pathArr = [...prefix, key];
          const pathString = pathArr.join('.');
          if (isLeafToken(value)) {
            let rawValue = value.$value;
            let finalValue: string | number | boolean;
            if (typeof rawValue === 'object' && rawValue !== null) {
              finalValue = JSON.stringify(rawValue);
            } else {
              finalValue = rawValue as string | number | boolean;
            }
            let resolved: string | number | boolean | undefined;
            if (merged && typeof rawValue === 'string') {
              const r = resolveReference(rawValue, merged);
              if (typeof r === 'string' || typeof r === 'number' || typeof r === 'boolean') {
                resolved = r;
              }
            }
            rows.push({
              path: pathString,
              layer: maps?.[pathString]?.layer ?? layer,
              type: value.$type || '',
              value: finalValue,
              description: value.$description as string | undefined,
              resolved,
            });
          } else if (isTokenGroup(value)) {
            walk(value as TokenDocument, pathArr);
          } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            rows.push({
              path: pathString,
              layer,
              type: '',
              value,
              description: undefined,
            });
          }
        });
      };
      walk(doc);
      return rows;
    },
    []
  );

  const buRows = useMemo(() => {
    return buRowsByName[selectedBU || ''] ?? [];
  }, [buRowsByName, selectedBU]);

  const handleRowUpdate = useCallback(
    (rowIndex: number, columnId: 'value' | 'type' | 'description', newValue: string | number | boolean) => {
      const row = buRows[rowIndex];
      if (!row) return;

      // Create updated row without full recomputation
      const updatedRow: FlatTokenRow = {
        ...row,
        [columnId]: newValue,
      };

      // Update BU doc or core doc based on layer
      if (row.layer === 'bu') {
        // Update only the specific row in buRowsByName
        const currentBuRows = buRowsByName[selectedBU || ''] ?? [];
        const newBuRows = [...currentBuRows];
        newBuRows[rowIndex] = updatedRow;
        setBuRowsByName({ ...buRowsByName, [selectedBU || '']: newBuRows });

        // Update buDoc
        const nextBuDoc = buDoc ? JSON.parse(JSON.stringify(buDoc)) : {};
        const parts = row.path.split('.');
        const token: Record<string, unknown> = {
          $value: columnId === 'value' ? newValue : row.value,
        };
        if (columnId === 'type') {
          token.$type = String(newValue);
        } else if (row.type) {
          token.$type = row.type;
        }
        if (columnId === 'description') {
          token.$description = String(newValue);
        } else if (row.description) {
          token.$description = row.description;
        }
        setNestedValue(nextBuDoc as Record<string, unknown>, parts, token);
        setBuDoc(nextBuDoc as TokenDocument);
        setTokenContent(JSON.stringify(nextBuDoc, null, 2));
        setIsDirty(true);
        return;
      }

      // Core edits require Core Mode
      if (!coreModeEnabled) {
        return;
      }

      const entry = sourceMaps[row.path];
      if (!entry || entry.layer !== 'core') return;
      const filePath = entry.file;
      const coreDoc = coreDocsByFile[filePath];
      if (!coreDoc) return;

      // Update coreDocsByFile
      const updatedDoc = JSON.parse(JSON.stringify(coreDoc)) as Record<string, unknown>;
      const parts = row.path.split('.');
      const token: Record<string, unknown> = {
        $value: columnId === 'value' ? newValue : row.value,
      };
      if (columnId === 'type') {
        token.$type = String(newValue);
      } else if (row.type) {
        token.$type = row.type;
      }
      if (columnId === 'description') {
        token.$description = String(newValue);
      } else if (row.description) {
        token.$description = row.description;
      }
      setNestedValue(updatedDoc, parts, token);

      const updatedCoreDocs = { ...coreDocsByFile, [filePath]: updatedDoc as TokenDocument };
      setLoaderData({ coreDocsByFile: updatedCoreDocs });
      setCoreDirty(true);
      setIsDirty(true);
    },
    [buRows, buRowsByName, selectedBU, buDoc, coreModeEnabled, sourceMaps, coreDocsByFile, setBuDoc, setCoreDirty, setIsDirty, setTokenContent, setBuRowsByName, setLoaderData]
  );

  // Load token content when BU is selected
  useEffect(() => {
    const loadTokenContent = async () => {
      if (!selectedBU || !window.electronAPI || !tokenRoot) {
        return;
      }

      try {
        const result = await window.electronAPI.loadTokens(tokenRoot, selectedBU);

        if (result.error || !result.data) {
          console.error('Error loading tokens:', result.error);
          setLoaderData({
            coreDocsByFile: {},
            buDoc: null,
            mergedDoc: null,
            flatTokens: [],
            sourceMaps: {},
            buPath: null,
          });
          setEditorContent('{}');
          setTokenContent('{}');
          setIsDirty(false);
          setVersion(null);
          return;
        }

        const { buDoc: nextBuDoc, merged, flat, sourceMaps, coreDocsByFile: nextCoreDocsByFile, buPath: nextBuPath } =
          result.data;

        const buRowsMap: Record<string, FlatTokenRow[]> = { [selectedBU]: flattenDoc(nextBuDoc as TokenDocument, 'bu') };
        const coreRowsMap: Record<string, FlatTokenRow[]> = {};
        Object.entries(nextCoreDocsByFile || {}).forEach(([file, doc]) => {
          coreRowsMap[file] = flattenDoc(doc as TokenDocument, 'core');
        });

        setLoaderData({
          coreDocsByFile: nextCoreDocsByFile,
          buDoc: nextBuDoc,
          mergedDoc: merged,
          flatTokens: flat,
          sourceMaps,
          buPath: nextBuPath,
        });
        setBuRowsByName(buRowsMap);
        setCoreRowsByFile(coreRowsMap);
        setInitialDocs(
          JSON.parse(JSON.stringify(nextCoreDocsByFile)) as Record<string, TokenDocument>,
          JSON.parse(JSON.stringify(nextBuDoc)) as TokenDocument
        );
        refreshInitialDocs();

        const content = JSON.stringify(nextBuDoc, null, 2);
        setEditorContent(content);
        setTokenContent(content);
        setIsDirty(false);

        // Load version
        const versionPath = `${tokenRoot}/${selectedBU}/version.json`;
        const versionResult = await window.electronAPI.readJson(versionPath);
        if (versionResult.data && typeof versionResult.data === 'object' && 'version' in versionResult.data) {
          setVersion((versionResult.data as any).version);
        } else {
          setVersion(null);
        }
      } catch (error) {
        console.error('Error loading token content:', error);
        setEditorContent('{}');
        setTokenContent('{}');
        setLoaderData({
          coreDocsByFile: {},
          buDoc: null,
          mergedDoc: null,
          flatTokens: [],
          sourceMaps: {},
          buPath: null,
        });
      }
    };

    loadTokenContent();
  }, [selectedBU, tokenRoot, setTokenContent, setIsDirty, setVersion, setLoaderData]);

  // Sync editor content when tokenContent changes from external source
  useEffect(() => {
    if (tokenContent !== editorContent && activeTab === 'json') {
      setEditorContent(tokenContent || '');
    }
  }, [tokenContent, activeTab]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const content = value || '';
      setEditorContent(content);
      setTokenContent(content);
      setIsDirty(true);
    },
    [setTokenContent, setIsDirty]
  );

  // Calculate editor height from container using ResizeObserver (only when JSON tab is active)
  useEffect(() => {
    if (activeTab !== 'json') {
      return;
    }

    const container = editorContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setEditorHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [activeTab]);

  const handleBumpVersion = async () => {
    if (!selectedBU || !version || !window.electronAPI || !tokenRoot) {
      return;
    }

    // Parse version and bump patch
    const parts = version.split('.');
    if (parts.length !== 3) {
      alert('Invalid version format. Expected x.y.z');
      return;
    }

    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patch = parseInt(parts[2], 10);

    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
      alert('Invalid version format');
      return;
    }

    const newVersion = `${major}.${minor}.${patch + 1}`;
    const versionPath = `${tokenRoot}/${selectedBU}/version.json`;

    try {
      const result = await window.electronAPI.writeJson(versionPath, { version: newVersion });
      if (result.error) {
        alert(`Error bumping version: ${result.error}`);
        return;
      }
      setVersion(newVersion);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!selectedBU) {
    return null;
  }

  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');

  const handleCoreModeToggle = useCallback(() => {
    if (!coreModeEnabled) {
      const ok = window.confirm('Enable Core Mode? Core edits affect all BUs. Proceed?');
      if (!ok) return;
      setCoreModeEnabled(true);
    } else {
      setCoreModeEnabled(false);
    }
  }, [coreModeEnabled, setCoreModeEnabled]);

  return (
    <View height="100%" UNSAFE_style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Toolbar */}
      <View paddingX="size-300" paddingY="size-200" borderBottomWidth="thin" borderColor="gray-300">
        <Flex alignItems="center" justifyContent="space-between" gap="size-200">
          <Flex alignItems="center" gap="size-200">
            <Text UNSAFE_style={{ fontWeight: 600 }}>{selectedBU}</Text>
            {version && (
              <Flex alignItems="center" gap="size-100">
                <Text UNSAFE_style={{ fontSize: 13, color: 'var(--spectrum-global-color-gray-700)' }}>
                  Version: {version}
                </Text>
                <ActionButton onPress={handleBumpVersion} isQuiet>
                  Bump patch
                </ActionButton>
              </Flex>
            )}
          </Flex>
          <Flex alignItems="center" gap="size-150">
            {hasErrors && (
              <Flex alignItems="center" gap="size-100" UNSAFE_style={{ color: 'var(--spectrum-semantic-negative-color-default)' }}>
                <AlertCircle size={16} />
                <Text>Validation errors</Text>
              </Flex>
            )}
            <ActionButton
              onPress={handleCoreModeToggle}
              isQuiet
              UNSAFE_style={{
                color: coreModeEnabled ? 'var(--spectrum-semantic-caution-color-default)' : undefined,
              }}
            >
              {coreModeEnabled ? 'Core Mode: on' : 'Core Mode: off'}
            </ActionButton>
          </Flex>
        </Flex>
      </View>

      <Tabs
        aria-label="Token editor views"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as 'table' | 'json')}
        height="100%"
        UNSAFE_style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <TabList>
          <Item key="table" textValue="Table">
            Table
          </Item>
          <Item key="json" textValue="JSON">
            JSON
          </Item>
        </TabList>
        <TabPanels UNSAFE_style={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Item key="table" textValue="Table">
            <View height="100%" UNSAFE_style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {coreModeEnabled && coreDirty && (
                <View padding="size-200" borderBottomWidth="thin" borderColor="gray-300" backgroundColor="gray-75">
                  <Flex direction="column" gap="size-100">
                    <Text UNSAFE_style={{ fontWeight: 600 }}>Core changes pending</Text>
                    <Text UNSAFE_style={{ fontSize: 12, color: 'var(--spectrum-semantic-caution-color-default)' }}>
                      You have unsaved core edits. Save to see full diff preview.
                    </Text>
                  </Flex>
                </View>
              )}
              {buRows.length > 0 ? (
                <View flex="1" minHeight={0} UNSAFE_style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <TokenTable rows={buRows} onUpdate={handleRowUpdate} coreModeEnabled={coreModeEnabled} />
                </View>
              ) : (
                <Flex alignItems="center" justifyContent="center" height="100%">
                  <Text>No tokens loaded</Text>
                </Flex>
              )}
            </View>
          </Item>
          <Item key="json" textValue="JSON">
            <View height="100%" UNSAFE_style={{ minHeight: 0 }}>
              <div ref={editorContainerRef} style={{ height: '100%', minHeight: 0, position: 'relative' }}>
                <Editor
                  height={editorHeight}
                  defaultLanguage="json"
                  value={editorContent}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                  theme="vs-dark"
                />
              </div>
            </View>
          </Item>
        </TabPanels>
      </Tabs>
    </View>
  );
}

