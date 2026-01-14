import { FileSystemAdapter } from './adapters';
import { discoverCore } from './discovery';
import { readJson, writeJson } from './io';
import {
  FlatTokenRow,
  Layer,
  LoadTokensResult,
  SaveTokensPayload,
  SaveTokensResult,
  SourceMapEntry,
  TokenDocument,
  TokenValue,
} from './types';

const REFERENCE_REGEX = /^\{([^}]+)\}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLeafToken(value: unknown): value is { $value: unknown; [key: string]: unknown } {
  return isObject(value) && '$value' in value;
}

function isTokenGroup(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !('$value' in value);
}

function mergeTokenDocuments(base: TokenDocument, override: TokenDocument): TokenDocument {
  const result: TokenDocument = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (key === '$schema') {
      result[key] = value as TokenValue;
      continue;
    }

    const existing = result[key];

    if (isTokenGroup(existing) && isTokenGroup(value)) {
      result[key] = mergeTokenDocuments(existing as TokenDocument, value as TokenDocument);
    } else {
      // Leaf token or primitive override replaces prior value
      result[key] = value as TokenValue;
    }
  }

  return result;
}

function getValueByPath(doc: TokenDocument, path: string): TokenValue | undefined {
  const parts = path.split('.');
  let current: unknown = doc;

  for (const part of parts) {
    if (!isObject(current)) {
      return undefined;
    }
    current = current[part];
  }

  return current as TokenValue | undefined;
}

function resolveReference(value: string, doc: TokenDocument, visited: Set<string> = new Set()): TokenValue | string {
  const match = value.match(REFERENCE_REGEX);
  if (!match) {
    return value;
  }

  const refPath = match[1];
  if (visited.has(refPath)) {
    return value;
  }

  visited.add(refPath);
  const target = getValueByPath(doc, refPath);
  if (!target) {
    return value;
  }

  if (isLeafToken(target)) {
    const resolved = target.$value;
    if (typeof resolved === 'string') {
      return resolveReference(resolved, doc, visited);
    }
    return resolved as TokenValue;
  }

  return value;
}

function collectSourceMaps(
  doc: TokenDocument,
  entry: SourceMapEntry,
  prefix: string[] = [],
  map: Record<string, SourceMapEntry>
): void {
  for (const [key, value] of Object.entries(doc)) {
    if (key === '$schema') continue;
    const currentPath = [...prefix, key];

    if (isLeafToken(value)) {
      const pathString = currentPath.join('.');
      map[pathString] = entry;
    } else if (isTokenGroup(value)) {
      collectSourceMaps(value as TokenDocument, entry, currentPath, map);
    }
  }
}

function flattenTokens(
  doc: TokenDocument,
  sourceMaps: Record<string, SourceMapEntry>,
  mergedDoc: TokenDocument,
  prefix: string[] = [],
  rows: FlatTokenRow[] = []
): FlatTokenRow[] {
  for (const [key, value] of Object.entries(doc)) {
    if (key === '$schema') continue;
    const currentPath = [...prefix, key];
    const pathString = currentPath.join('.');

    if (isLeafToken(value)) {
      let rawValue = value.$value;
      const tokenType = (value.$type as string) ?? '';
      const description = value.$description as string | undefined;

      let finalValue: string | number | boolean;
      if (typeof rawValue === 'object' && rawValue !== null) {
        finalValue = JSON.stringify(rawValue);
      } else {
        finalValue = rawValue as string | number | boolean;
      }

      let resolved: string | number | boolean | undefined;
      if (typeof rawValue === 'string') {
        const resolvedValue = resolveReference(rawValue, mergedDoc);
        if (typeof resolvedValue === 'string' || typeof resolvedValue === 'number' || typeof resolvedValue === 'boolean') {
          resolved = resolvedValue;
        }
      }

      const layer = sourceMaps[pathString]?.layer ?? ('core' as Layer);

      rows.push({
        path: pathString,
        layer,
        type: tokenType,
        value: finalValue,
        description,
        resolved,
      });
    } else if (isTokenGroup(value)) {
      flattenTokens(value as TokenDocument, sourceMaps, mergedDoc, currentPath, rows);
    }
  }

  return rows;
}

async function loadCoreDocs(
  tokensDir: string,
  fs: FileSystemAdapter
): Promise<{ coreDocsByFile: Record<string, TokenDocument>; coreMerged: TokenDocument; sourceMaps: Record<string, SourceMapEntry> }> {
  const coreEntries = await discoverCore(tokensDir, fs);
  const coreDocsByFile: Record<string, TokenDocument> = {};
  const sourceMaps: Record<string, SourceMapEntry> = {};

  const sortedFiles: string[] = [];
  for (const entry of coreEntries) {
    for (const file of entry.files) {
      sortedFiles.push(fs.join(entry.path, file));
    }
  }
  sortedFiles.sort();

  for (const filePath of sortedFiles) {
    const data = (await readJson(filePath, fs)) as TokenDocument;
    coreDocsByFile[filePath] = data;
    collectSourceMaps(data, { layer: 'core', file: filePath }, [], sourceMaps);
  }

  let coreMerged: TokenDocument = {};
  for (const filePath of sortedFiles) {
    coreMerged = mergeTokenDocuments(coreMerged, coreDocsByFile[filePath]);
  }

  return { coreDocsByFile, coreMerged, sourceMaps };
}

async function loadBuDoc(tokensDir: string, bu: string, fs: FileSystemAdapter): Promise<{ buDoc: TokenDocument; buPath: string; buSourceMaps: Record<string, SourceMapEntry> }> {
  const buPath = fs.join(tokensDir, bu, 'tokens.json');
  const buDoc = (await readJson(buPath, fs)) as TokenDocument;
  const buSourceMaps: Record<string, SourceMapEntry> = {};
  collectSourceMaps(buDoc, { layer: 'bu', file: buPath }, [], buSourceMaps);
  return { buDoc, buPath, buSourceMaps };
}

export async function loadTokens(tokensDir: string, bu: string, fs: FileSystemAdapter): Promise<LoadTokensResult> {
  const { coreDocsByFile, coreMerged, sourceMaps: coreSourceMaps } = await loadCoreDocs(tokensDir, fs);
  const { buDoc, buPath, buSourceMaps } = await loadBuDoc(tokensDir, bu, fs);

  const sourceMaps: Record<string, SourceMapEntry> = { ...coreSourceMaps, ...buSourceMaps };

  const merged = mergeTokenDocuments(coreMerged, buDoc);
  const flat = flattenTokens(merged, sourceMaps, merged);

  return {
    tokensDir,
    bu,
    merged,
    flat,
    sourceMaps,
    coreDocsByFile,
    buDoc,
    buPath,
  };
}

export async function saveTokens(payload: SaveTokensPayload, fs: FileSystemAdapter): Promise<SaveTokensResult> {
  const { tokensDir, bu, coreDocsByFile, buDoc } = payload;

  // Write core docs back to their original files
  for (const [filePath, doc] of Object.entries(coreDocsByFile)) {
    await writeJson(filePath, doc, fs);
  }

  // Write BU tokens
  const buPath = payload.buPath ?? fs.join(tokensDir, bu, 'tokens.json');
  await writeJson(buPath, buDoc, fs);

  return { success: true };
}

