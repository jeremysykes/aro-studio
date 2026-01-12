import type { BU, CoreEntry } from '@aro-studio/core';
import { useAppStore } from '../store';

export const FOLDER_CACHE_KEY = 'token-editor:last-folder';

type LoadMode = 'manual' | 'auto';

interface LoadOptions {
  cache?: boolean;
  mode?: LoadMode;
}

export async function loadFolderFromPath(
  selectedFolder: string,
  options: LoadOptions = {}
): Promise<boolean> {
  const { cache = true, mode = 'manual' } = options;
  const {
    setSelectedFolder,
    setTokenRoot,
    setBusinessUnits,
    setCoreEntries,
    setSelectedBU,
    reset,
  } = useAppStore.getState();

  if (!window.electronAPI) {
    if (mode === 'manual') {
      alert('Electron API not available');
    }
    return false;
  }

  try {
    const rootResult = await window.electronAPI.discoverTokenRoot(selectedFolder);
    if (rootResult.error) {
      if (mode === 'manual') {
        alert(`Error: ${rootResult.error}`);
      }
      reset();
      return false;
    }

    if (!rootResult.data) {
      if (mode === 'manual') {
        alert('No tokens/ directory found');
      }
      reset();
      return false;
    }

    const tokensDir = rootResult.data.tokensDir;

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
    setCoreEntries((coreResult.data as CoreEntry[]) || []);

    if (businessUnitsList.length > 0) {
      setSelectedBU(businessUnitsList[0].name);
    }

    if (cache) {
      localStorage.setItem(FOLDER_CACHE_KEY, selectedFolder);
    }

    return true;
  } catch (error) {
    console.error('Error loading folder:', error);
    if (mode === 'manual') {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    reset();
    return false;
  }
}
