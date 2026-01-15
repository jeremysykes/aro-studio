import type { BU, CoreEntry } from '@aro-studio/core';
import { useAppStore } from '../store';

export const FOLDER_CACHE_KEY = 'token-editor:last-folder';
export const RECENT_FOLDERS_KEY = 'token-editor:recent-folders';
const MAX_RECENT_FOLDERS = 5;

/**
 * Get recent folders from localStorage
 */
export function getRecentFolders(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_FOLDERS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/**
 * Add a folder to the recent folders list
 */
export function addRecentFolder(folderPath: string): void {
  const recent = getRecentFolders();
  // Remove if already exists
  const filtered = recent.filter((path) => path !== folderPath);
  // Add to front
  filtered.unshift(folderPath);
  // Limit to MAX_RECENT_FOLDERS
  const limited = filtered.slice(0, MAX_RECENT_FOLDERS);
  localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(limited));
}

/**
 * Clear recent folders list
 */
export function clearRecentFolders(): void {
  localStorage.removeItem(RECENT_FOLDERS_KEY);
}

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
      addRecentFolder(selectedFolder);
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
