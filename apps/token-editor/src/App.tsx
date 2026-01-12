import { useEffect, useState, useCallback } from 'react';
import { FolderPicker } from './components/FolderPicker';
import { Sidebar } from './components/Sidebar';
import { TokenEditor } from './components/TokenEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { CoreViewer } from './components/CoreViewer';
import { ThemeToggle } from './components/ThemeToggle';
import { useAppStore } from './store';
import { parseTokenDocument, validateTokenDocument } from '@aro-studio/core';
import { Button } from '@aro-studio/ui';
import { Save, XCircle } from 'lucide-react';
import { FOLDER_CACHE_KEY, loadFolderFromPath } from './utils/folderLoader';

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
    businessUnits,
    validationIssues,
    setTokenContent,
    reset,
  } = useAppStore();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!selectedBU || !window.electronAPI || !tokenContent) {
      return;
    }

    const bu = businessUnits.find((b) => b.name === selectedBU);
    if (!bu) {
      return;
    }

    // Validate JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(tokenContent);
    } catch {
      return;
    }

    setIsSaving(true);

    try {
      const tokensPath = `${bu.path}/tokens.json`;
      const result = await window.electronAPI.writeJson(tokensPath, parsedData);

      if (!result.error) {
        setIsDirty(false);
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedBU, businessUnits, tokenContent, setIsDirty, setTokenContent]);

  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');
  const canSave = isDirty && !isSaving && !hasErrors && selectedBU;

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
        if (canSave) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSave, handleSave]);

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
  const helperMessage = hasFolder
    ? 'Folder loaded'
    : 'Select a folder containing a tokens/ directory to get started';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">Aro Studio - Token Editor</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <p className="text-muted-foreground">{helperMessage}</p>
          {!hasFolder ? (
            <FolderPicker />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearCache}
              title="Clear saved folder"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={!canSave}
            title={canSave ? 'Save (Cmd+S)' : 'No changes to save'}
          >
            <Save className="w-4 h-4" />
          </Button>
          <ThemeToggle />
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
