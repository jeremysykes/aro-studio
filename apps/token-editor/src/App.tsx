import { useEffect } from 'react';
import { FolderPicker } from './components/FolderPicker';
import { Sidebar } from './components/Sidebar';
import { TokenEditor } from './components/TokenEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { CoreViewer } from './components/CoreViewer';
import { ThemeToggle } from './components/ThemeToggle';
import { useAppStore } from './store';
import { parseTokenDocument, validateTokenDocument } from '@aro-studio/core';

function App() {
  const {
    tokenRoot,
    selectedBU,
    selectedCore,
    selectedCoreFile,
    tokenContent,
    setValidationIssues,
  } = useAppStore();

  // Validate token content when it changes
  useEffect(() => {
    if (!tokenContent || !selectedBU) {
      setValidationIssues([]);
      return;
    }

    try {
      const parsed = JSON.parse(tokenContent);
      const doc = parseTokenDocument(parsed);
      const issues = validateTokenDocument(doc);
      setValidationIssues(issues);
    } catch (error) {
      setValidationIssues([
        {
          path: '',
          message: error instanceof Error ? error.message : 'Invalid JSON',
          severity: 'error',
        },
      ]);
    }
  }, [tokenContent, selectedBU, setValidationIssues]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        // Save will be handled by TokenEditor component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">Aro Studio - Token Editor</h1>
        </div>
        <p className="text-muted-foreground">
          Select a folder containing a tokens/ directory to get started
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <FolderPicker />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {tokenRoot && (
          <div className="w-64 border-r border-border overflow-y-auto">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Select a business unit or core file to view</p>
              </div>
            </div>
            <Sidebar />
          </div>
        )}

        {/* Editor/Viewer area */}
        <div className="flex-1 flex overflow-hidden">
          {selectedBU ? (
            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <TokenEditor />
              </div>
              <div className="w-80 border-l border-border overflow-y-auto">
                <ValidationPanel />
              </div>
            </div>
          ) : selectedCore && selectedCoreFile ? (
            <div className="flex-1 flex flex-col">
              <CoreViewer />
            </div>
          ) : null}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border text-xs text-muted-foreground">
        <div>
          {useAppStore.getState().isDirty && (
            <span className="text-amber-600">● Unsaved changes</span>
          )}
        </div>
        <div>{tokenRoot && <span>Token Root: {tokenRoot}</span>}</div>
      </div>
    </div>
  );
}

export default App;
