import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../store';
import { FileText } from 'lucide-react';

export function CoreViewer() {
  const { selectedCore, selectedCoreFile, coreEntries } = useAppStore();
  const [content, setContent] = useState<string>('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(600);

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

  // Calculate editor height from container using ResizeObserver
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

      {/* Editor */}
      <div ref={editorContainerRef} className="flex-1 relative min-h-0">
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
    </div>
  );
}

