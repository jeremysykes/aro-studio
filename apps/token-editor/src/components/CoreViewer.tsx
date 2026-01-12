import { useEffect, useState, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@aro-studio/ui';
import { useAppStore } from '../store';
import { FileText } from 'lucide-react';
import { TokenTable } from './TokenTable';
import { parseTokenDocument } from '@aro-studio/core';
import type { TokenDocument } from '@aro-studio/core';

export function CoreViewer() {
  const { selectedCore, selectedCoreFile, coreEntries } = useAppStore();
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a core file to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase">Core</span>
          <span className="font-semibold text-foreground">{selectedCore}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">{selectedCoreFile}</span>
        </div>
        <div className="text-xs text-muted-foreground">Read-only</div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'table' | 'json')} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
        </div>

        {/* Table View */}
        <TabsContent value="table" className="flex-1 mt-0 min-h-0 overflow-hidden">
          {tokenDoc ? (
            <div className="flex-1 overflow-auto min-h-0">
              <TokenTable tokenDoc={tokenDoc} onTokenChange={() => {}} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p>Unable to parse as token document</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* JSON View */}
        <TabsContent value="json" className="flex-1 overflow-hidden mt-0">
          <div ref={editorContainerRef} className="h-full relative min-h-0">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
