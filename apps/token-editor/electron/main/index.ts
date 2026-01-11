import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, access, readdir, stat } from 'fs/promises';
import { constants } from 'fs';
import {
  FileSystemAdapter,
  DialogAdapter,
  discoverTokenRoot,
  discoverBusinessUnits,
  discoverCore,
  readJson,
  writeJson,
} from '@aro-studio/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Electron implementation of FileSystemAdapter
 */
class ElectronFileSystemAdapter implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    return writeFile(path, content, 'utf-8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async listDir(path: string): Promise<string[]> {
    return readdir(path);
  }

  join(...paths: string[]): string {
    return join(...paths);
  }

  async stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    const stats = await stat(path);
    return {
      isDirectory: () => stats.isDirectory(),
      isFile: () => stats.isFile(),
    };
  }
}

/**
 * Electron implementation of DialogAdapter
 */
class ElectronDialogAdapter implements DialogAdapter {
  async pickDirectory(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }
}

const fsAdapter = new ElectronFileSystemAdapter();
const dialogAdapter = new ElectronDialogAdapter();

function createWindow() {
  // Preload script must be JavaScript (Electron requirement)
  // Compiled to dist-electron/preload/index.cjs (renamed from .js to be explicitly CommonJS)
  const appRoot = process.cwd(); // Points to apps/token-editor directory
  const preloadPath = join(appRoot, 'dist-electron/preload/index.cjs');

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // In dev, load from Vite dev server
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('pick-directory', async () => {
  return dialogAdapter.pickDirectory();
});

ipcMain.handle('discover-token-root', async (_event, selectedFolder: string) => {
  try {
    const result = await discoverTokenRoot(selectedFolder, fsAdapter);
    if (result instanceof Error) {
      return { error: result.message };
    }
    return { data: result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

ipcMain.handle('discover-business-units', async (_event, tokensDir: string) => {
  try {
    const bus = await discoverBusinessUnits(tokensDir, fsAdapter);
    return { data: bus };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

ipcMain.handle('discover-core', async (_event, tokensDir: string) => {
  try {
    const coreEntries = await discoverCore(tokensDir, fsAdapter);
    return { data: coreEntries };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

ipcMain.handle('read-json', async (_event, path: string) => {
  try {
    const data = await readJson(path, fsAdapter);
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

ipcMain.handle('write-json', async (_event, path: string, data: unknown) => {
  try {
    await writeJson(path, data, fsAdapter);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

ipcMain.handle('read-file', async (_event, path: string) => {
  try {
    const content = await fsAdapter.readFile(path);
    return { data: content };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

ipcMain.handle('list-dir', async (_event, path: string) => {
  try {
    const entries = await fsAdapter.listDir(path);
    return { data: entries };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

