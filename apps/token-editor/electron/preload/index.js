import { contextBridge, ipcRenderer } from 'electron';
const electronAPI = {
    pickDirectory: () => ipcRenderer.invoke('pick-directory'),
    discoverTokenRoot: (selectedFolder) => ipcRenderer.invoke('discover-token-root', selectedFolder),
    discoverBusinessUnits: (tokensDir) => ipcRenderer.invoke('discover-business-units', tokensDir),
    discoverCore: (tokensDir) => ipcRenderer.invoke('discover-core', tokensDir),
    readJson: (path) => ipcRenderer.invoke('read-json', path),
    writeJson: (path, data) => ipcRenderer.invoke('write-json', path, data),
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    listDir: (path) => ipcRenderer.invoke('list-dir', path),
    loadTokens: (tokensDir, bu) => ipcRenderer.invoke('load-tokens', tokensDir, bu),
    saveTokens: (payload) => ipcRenderer.invoke('save-tokens', payload),
};
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=index.js.map