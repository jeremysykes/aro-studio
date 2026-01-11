import { FileSystemAdapter } from './adapters';

/**
 * Read a JSON file and parse it
 */
export async function readJson(path: string, fs: FileSystemAdapter): Promise<unknown> {
  const content = await fs.readFile(path);
  return JSON.parse(content);
}

/**
 * Write a JSON file with consistent formatting
 * - 2-space indentation
 * - Trailing newline
 * - Preserves structure (does not sort keys)
 */
export async function writeJson(
  path: string,
  data: unknown,
  fs: FileSystemAdapter
): Promise<void> {
  const content = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(path, content);
}

