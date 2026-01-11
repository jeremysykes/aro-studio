/**
 * Platform-agnostic adapter interfaces for file system and dialog operations
 */

/**
 * File system adapter interface
 * Implementations should be provided by the platform (Electron, web, etc.)
 */
export interface FileSystemAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  listDir(path: string): Promise<string[]>;
  join(...paths: string[]): string;
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
}

/**
 * Dialog adapter interface
 * Implementations should be provided by the platform
 */
export interface DialogAdapter {
  pickDirectory(): Promise<string | null>;
}

