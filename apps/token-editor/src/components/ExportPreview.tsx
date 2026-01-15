import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Flex, View, Picker, Item, ActionButton, Text } from '@adobe/react-spectrum';
import { Copy, Check } from 'lucide-react';
import type { FlatTokenRow } from '@aro-studio/core';
import { generateExport, getMonacoLanguage, ExportFormat } from '../utils/exportFormats';

interface ExportPreviewProps {
  rows: FlatTokenRow[];
}

const FORMAT_OPTIONS = [
  { key: 'css', label: 'CSS Custom Properties' },
  { key: 'scss', label: 'SCSS Variables' },
  { key: 'js', label: 'JavaScript Module' },
  { key: 'ts', label: 'TypeScript Module' },
];

export function ExportPreview({ rows }: ExportPreviewProps) {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(400);

  const exportContent = useMemo(() => {
    return generateExport(rows, format);
  }, [rows, format]);

  const handleFormatChange = useCallback((key: React.Key | null) => {
    setFormat(key as ExportFormat);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [exportContent]);

  // Calculate editor height from container
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setEditorHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <View height="100%" UNSAFE_style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Toolbar */}
      <View
        paddingX="size-200"
        paddingY="size-100"
        backgroundColor="gray-75"
        borderBottomWidth="thin"
        borderColor="gray-300"
      >
        <Flex alignItems="center" gap="size-200" justifyContent="space-between">
          <Flex alignItems="center" gap="size-150">
            <Text UNSAFE_style={{ fontSize: 12, fontWeight: 500 }}>Format:</Text>
            <Picker
              aria-label="Export format"
              selectedKey={format}
              onSelectionChange={handleFormatChange}
              width="size-2400"
              items={FORMAT_OPTIONS}
            >
              {(item) => <Item key={item.key}>{item.label}</Item>}
            </Picker>
          </Flex>

          <ActionButton onPress={handleCopy} isQuiet aria-label={copied ? 'Copied!' : 'Copy to clipboard'}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <Text>{copied ? 'Copied!' : 'Copy'}</Text>
          </ActionButton>
        </Flex>
      </View>

      {/* Editor */}
      <View flex="1" minHeight={0}>
        <div ref={editorContainerRef} style={{ height: '100%', minHeight: 0, position: 'relative' }}>
          <Editor
            height={editorHeight}
            language={getMonacoLanguage(format)}
            value={exportContent}
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

      {/* Stats */}
      <View
        paddingX="size-200"
        paddingY="size-100"
        backgroundColor="gray-75"
        borderTopWidth="thin"
        borderColor="gray-300"
      >
        <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
          {rows.length} tokens • {exportContent.length} characters
        </Text>
      </View>
    </View>
  );
}
