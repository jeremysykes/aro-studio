import { contextBridge, ipcRenderer } from 'electron';
import type { LoadTokensResult, SaveTokensPayload, SaveTokensResult } from '@aro-studio/core';

/**
 * Electron API exposed to renderer process
 */
export interface ElectronAPI {
  pickDirectory: () => Promise<string | null>;
  discoverTokenRoot: (selectedFolder: string) => Promise<{ data?: { tokensDir: string }; error?: string }>;
  discoverBusinessUnits: (tokensDir: string) => Promise<{ data?: unknown[]; error?: string }>;
  discoverCore: (tokensDir: string) => Promise<{ data?: unknown[]; error?: string }>;
  readJson: (path: string) => Promise<{ data?: unknown; error?: string }>;
  writeJson: (path: string, data: unknown) => Promise<{ success?: boolean; error?: string }>;
  readFile: (path: string) => Promise<{ data?: string; error?: string }>;
  listDir: (path: string) => Promise<{ data?: string[]; error?: string }>;
  loadTokens: (tokensDir: string, bu: string) => Promise<{ data?: LoadTokensResult; error?: string }>;
  saveTokens: (payload: SaveTokensPayload) => Promise<{ data?: SaveTokensResult; error?: string }>;
}

const electronAPI: ElectronAPI = {
  pickDirectory: () => ipcRenderer.invoke('pick-directory'),
  discoverTokenRoot: (selectedFolder: string) =>
    ipcRenderer.invoke('discover-token-root', selectedFolder),
  discoverBusinessUnits: (tokensDir: string) =>
    ipcRenderer.invoke('discover-business-units', tokensDir),
  discoverCore: (tokensDir: string) => ipcRenderer.invoke('discover-core', tokensDir),
  readJson: (path: string) => ipcRenderer.invoke('read-json', path),
  writeJson: (path: string, data: unknown) => ipcRenderer.invoke('write-json', path, data),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  listDir: (path: string) => ipcRenderer.invoke('list-dir', path),
  loadTokens: (tokensDir: string, bu: string) => ipcRenderer.invoke('load-tokens', tokensDir, bu),
  saveTokens: (payload: SaveTokensPayload) => ipcRenderer.invoke('save-tokens', payload),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

