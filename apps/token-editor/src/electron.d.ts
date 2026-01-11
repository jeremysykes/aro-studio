/**
 * Type declarations for Electron API exposed via preload script
 */
import { ElectronAPI } from '../electron/preload/index';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

