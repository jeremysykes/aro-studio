import { FileSystemAdapter } from './adapters';
import { BU, CoreEntry } from './types';

/**
 * Discover the tokens directory starting from a selected folder
 * Searches upward in the directory tree for a `tokens/` directory
 */
export async function discoverTokenRoot(
  selectedFolder: string,
  fs: FileSystemAdapter
): Promise<{ tokensDir: string } | Error> {
  let currentPath = selectedFolder;

  while (true) {
    const tokensPath = fs.join(currentPath, 'tokens');
    const exists = await fs.exists(tokensPath);

    if (exists) {
      const stat = await fs.stat(tokensPath);
      if (stat.isDirectory()) {
        return { tokensDir: tokensPath };
      }
    }

    // Go up one level
    const parentPath = fs.join(currentPath, '..');
    if (parentPath === currentPath) {
      // Reached root, no tokens directory found
      return new Error(`No tokens/ directory found starting from ${selectedFolder}`);
    }
    currentPath = parentPath;
  }
}

/**
 * Discover business units in the tokens directory
 * Business units are direct children folders that do NOT start with `_`
 */
export async function discoverBusinessUnits(
  tokensDir: string,
  fs: FileSystemAdapter
): Promise<BU[]> {
  const entries = await fs.listDir(tokensDir);
  const bus: BU[] = [];

  for (const entry of entries) {
    // Skip entries starting with underscore (these are core folders)
    if (entry.startsWith('_')) {
      continue;
    }

    const entryPath = fs.join(tokensDir, entry);
    const stat = await fs.stat(entryPath);

    if (stat.isDirectory()) {
      bus.push({
        name: entry,
        path: entryPath,
      });
    }
  }

  return bus.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Discover core entries in the tokens directory
 * Core entries are folders starting with `_` (e.g., `_core`)
 */
export async function discoverCore(
  tokensDir: string,
  fs: FileSystemAdapter
): Promise<CoreEntry[]> {
  const entries = await fs.listDir(tokensDir);
  const coreEntries: CoreEntry[] = [];

  for (const entry of entries) {
    // Only process folders starting with underscore
    if (!entry.startsWith('_')) {
      continue;
    }

    const entryPath = fs.join(tokensDir, entry);
    const stat = await fs.stat(entryPath);

    if (stat.isDirectory()) {
      const files = await fs.listDir(entryPath);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      coreEntries.push({
        name: entry,
        path: entryPath,
        files: jsonFiles.sort(),
      });
    }
  }

  return coreEntries.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load display names for business units from tokens/bu-display-names.json
 * Maps folder name -> display string for UI
 */
export async function loadBuDisplayNames(
  tokensDir: string,
  fs: FileSystemAdapter
): Promise<Record<string, string>> {
  const path = fs.join(tokensDir, 'bu-display-names.json');
  if (!(await fs.exists(path))) {
    return {};
  }
  try {
    const content = await fs.readFile(path);
    const data = JSON.parse(content);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof key === 'string' && typeof value === 'string') {
          result[key] = value;
        }
      }
      return result;
    }
  } catch {
    // Ignore parse/read errors, return empty
  }
  return {};
}

