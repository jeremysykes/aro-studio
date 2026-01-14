import { useEffect, useState, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabList, TabPanels, Item, View, Flex, Text } from '@adobe/react-spectrum';
import { useAppStore } from '../store';
import { FileText } from 'lucide-react';
import { TokenTable } from './TokenTable';
import { parseTokenDocument } from '@aro-studio/core';
import type { TokenDocument, FlatTokenRow } from '@aro-studio/core';

export function CoreViewer() {
  const { selectedCore, selectedCoreFile, coreEntries, coreRowsByFile } = useAppStore();
  const [content, setContent] = useState<string>('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(600);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');

  useEffect(() => {
    const loadContent = async () => {
      if (!selectedCore || !selectedCoreFile || !window.electronAPI) {
        setContent('');
        return;
      }

      const entry = coreEntries.find((e) => e.name === selectedCore);
      if (!entry) {
        setContent('');
        return;
      }

      try {
        const filePath = `${entry.path}/${selectedCoreFile}`;
        const result = await window.electronAPI.readFile(filePath);

        if (result.error) {
          console.error('Error reading file:', result.error);
          setContent(`// Error: ${result.error}`);
          return;
        }

        // Try to parse as JSON and format it
        try {
          const parsed = JSON.parse(result.data || '{}');
          setContent(JSON.stringify(parsed, null, 2));
        } catch {
          setContent(result.data || '');
        }
      } catch (error) {
        console.error('Error loading content:', error);
        setContent(`// Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    loadContent();
  }, [selectedCore, selectedCoreFile, coreEntries]);

  // Parse token document from content for table view
  const tokenDoc = useMemo<TokenDocument | null>(() => {
    if (!content) {
      return null;
    }
    try {
      const parsed = JSON.parse(content);
      return parseTokenDocument(parsed);
    } catch {
      return null;
    }
  }, [content]);

  const flattenCore = (doc: TokenDocument | null): FlatTokenRow[] => {
    if (!doc) return [];
    const rows: FlatTokenRow[] = [];
    const isLeaf = (v: unknown): v is { $value: unknown; $type?: string; $description?: string } =>
      typeof v === 'object' && v !== null && '$value' in (v as Record<string, unknown>);
    const walk = (node: TokenDocument, path: string[] = []) => {
      Object.entries(node).forEach(([key, value]) => {
        if (key === '$schema') return;
        const current = [...path, key];
        if (isLeaf(value)) {
          let finalValue: string | number | boolean;
          if (typeof value.$value === 'object' && value.$value !== null) {
            finalValue = JSON.stringify(value.$value);
          } else {
            finalValue = value.$value as string | number | boolean;
          }
          rows.push({
            path: current.join('.'),
            layer: 'core',
            type: value.$type || '',
            value: finalValue,
            description: value.$description as string | undefined,
          });
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          walk(value as TokenDocument, current);
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          rows.push({
            path: current.join('.'),
            layer: 'core',
            type: '',
            value,
            description: undefined,
          });
        }
      });
    };
    walk(doc);
    return rows;
  };

  const coreRows = useMemo(() => {
    if (tokenDoc && selectedCore && selectedCoreFile) {
      const entry = coreEntries.find((e) => e.name === selectedCore);
      const filePath = entry ? `${entry.path}/${selectedCoreFile}` : undefined;
      if (filePath && coreRowsByFile[filePath]) {
        return coreRowsByFile[filePath];
      }
    }
    return flattenCore(tokenDoc);
  }, [tokenDoc, selectedCore, selectedCoreFile, coreEntries, coreRowsByFile]);

  // Calculate editor height from container using ResizeObserver
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

  if (!selectedCore || !selectedCoreFile) {
    return (
      <Flex alignItems="center" justifyContent="center" height="100%">
        <View UNSAFE_style={{ textAlign: 'center' }}>
          <View marginBottom="size-100" UNSAFE_style={{ opacity: 0.5 }}>
            <FileText size={48} />
          </View>
          <Text>Select a core file to view</Text>
        </View>
      </Flex>
    );
  }

  return (
    <View height="100%" UNSAFE_style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Toolbar */}
      <View paddingX="size-300" paddingY="size-200" borderBottomWidth="thin" borderColor="gray-300">
        <Flex alignItems="center" justifyContent="space-between" gap="size-200">
          <Flex alignItems="center" gap="size-100">
            <Text UNSAFE_style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--spectrum-global-color-gray-700)' }}>
              Core
            </Text>
            <Text UNSAFE_style={{ fontWeight: 600 }}>{selectedCore}</Text>
            <Text>/</Text>
            <Text>{selectedCoreFile}</Text>
          </Flex>
          <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-700)' }}>Read-only</Text>
        </Flex>
      </View>

      {/* Tabs */}
      <Tabs
        aria-label="Core viewer"
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
              {tokenDoc ? (
                <View flex="1" minHeight={0} UNSAFE_style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <TokenTable rows={coreRows} onUpdate={() => {}} coreModeEnabled={false} />
                </View>
              ) : (
                <Flex alignItems="center" justifyContent="center" height="100%">
                  <Text>Unable to parse as token document</Text>
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
                  value={content}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    readOnly: true,
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
