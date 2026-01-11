import { Button } from '@aro-studio/ui';
import { useAppStore } from '../store';
import { FolderOpen } from 'lucide-react';
import type { BU } from '@aro-studio/core';

export function FolderPicker() {
  const {
    setSelectedFolder,
    setTokenRoot,
    setBusinessUnits,
    setCoreEntries,
    setSelectedBU,
    reset,
  } = useAppStore();

  const handlePickFolder = async () => {
    if (!window.electronAPI) {
      alert('Electron API not available');
      return;
    }

    try {
      const selectedFolder = await window.electronAPI.pickDirectory();
      if (!selectedFolder) {
        return;
      }

      // Discover token root
      const rootResult = await window.electronAPI.discoverTokenRoot(selectedFolder);
      if (rootResult.error) {
        alert(`Error: ${rootResult.error}`);
        reset();
        return;
      }

      if (!rootResult.data) {
        alert('No tokens/ directory found');
        reset();
        return;
      }

      const tokensDir = rootResult.data.tokensDir;

      // Discover business units and core
      const [busResult, coreResult] = await Promise.all([
        window.electronAPI.discoverBusinessUnits(tokensDir),
        window.electronAPI.discoverCore(tokensDir),
      ]);

      if (busResult.error) {
        console.error('Error discovering business units:', busResult.error);
      }
      if (coreResult.error) {
        console.error('Error discovering core:', coreResult.error);
      }

      setSelectedFolder(selectedFolder);
      setTokenRoot(tokensDir);
      const businessUnitsList = (busResult.data as BU[]) || [];
      setBusinessUnits(businessUnitsList);
      setCoreEntries((coreResult.data as unknown[]) || []);
      
      // Auto-select first business unit if available
      if (businessUnitsList.length > 0) {
        setSelectedBU(businessUnitsList[0].name);
      }
    } catch (error) {
      console.error('Error picking folder:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Button onClick={handlePickFolder} variant="outline" size="sm">
      <FolderOpen className="w-4 h-4 mr-2" />
      Open Tokens Folder
    </Button>
  );
}

