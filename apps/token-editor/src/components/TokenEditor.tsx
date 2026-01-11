import { useEffect, useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@aro-studio/ui';
import { useAppStore } from '../store';
import { Save, AlertCircle } from 'lucide-react';

export function TokenEditor() {
  const {
    selectedBU,
    businessUnits,
    tokenContent,
    setTokenContent,
    setIsDirty,
    isDirty,
    validationIssues,
    version,
    setVersion,
  } = useAppStore();

  const [editorContent, setEditorContent] = useState(tokenContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(600); // Default fallback

  // Load token content when BU is selected
  useEffect(() => {
    const loadTokenContent = async () => {
      if (!selectedBU || !window.electronAPI) {
        return;
      }

      const bu = businessUnits.find((b) => b.name === selectedBU);
      if (!bu) {
        return;
      }

      try {
        const tokensPath = `${bu.path}/tokens.json`;
        const result = await window.electronAPI.readJson(tokensPath);

        if (result.error) {
          console.error('Error reading tokens:', result.error);
          setEditorContent('{}');
          setTokenContent('{}');
          return;
        }

        const content = JSON.stringify(result.data, null, 2);
        setEditorContent(content);
        setTokenContent(content);
        setIsDirty(false);

        // Load version
        const versionPath = `${bu.path}/version.json`;
        const versionResult = await window.electronAPI.readJson(versionPath);
        if (versionResult.data && typeof versionResult.data === 'object' && 'version' in versionResult.data) {
          setVersion((versionResult.data as any).version);
        }
      } catch (error) {
        console.error('Error loading token content:', error);
        setEditorContent('{}');
        setTokenContent('{}');
      }
    };

    loadTokenContent();
  }, [selectedBU, businessUnits, setTokenContent, setIsDirty, setVersion]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const content = value || '';
      setEditorContent(content);
      setTokenContent(content);
      setIsDirty(true);
      setSaveError(null);
    },
    [setTokenContent, setIsDirty]
  );

  const handleSave = useCallback(async () => {
    if (!selectedBU || !window.electronAPI) {
      return;
    }

    const bu = businessUnits.find((b) => b.name === selectedBU);
    if (!bu) {
      return;
    }

    // Validate JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(editorContent);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Invalid JSON');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const tokensPath = `${bu.path}/tokens.json`;
      const result = await window.electronAPI.writeJson(tokensPath, parsedData);

      if (result.error) {
        setSaveError(result.error);
        setIsSaving(false);
        return;
      }

      setIsDirty(false);
      setTokenContent(editorContent);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  }, [selectedBU, businessUnits, editorContent, setIsDirty, setTokenContent]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

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

  const handleBumpVersion = async () => {
    if (!selectedBU || !version || !window.electronAPI) {
      return;
    }

    const bu = businessUnits.find((b) => b.name === selectedBU);
    if (!bu) {
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
    const versionPath = `${bu.path}/version.json`;

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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-foreground">{selectedBU}</h2>
          {version && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Version: {version}</span>
              <Button size="sm" variant="outline" onClick={handleBumpVersion}>
                Bump Patch
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasErrors && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Validation errors</span>
            </div>
          )}
          <Button onClick={handleSave} disabled={!isDirty || isSaving || hasErrors}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorContainerRef} className="flex-1 relative min-h-0">
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

      {/* Save error */}
      {saveError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-border">
          Error saving: {saveError}
        </div>
      )}
    </div>
  );
}

