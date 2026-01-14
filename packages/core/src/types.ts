/**
 * Core types for token documents and business entities
 */

/**
 * DTCG token value - can be a primitive or object
 */
export type TokenValue =
  | string
  | number
  | boolean
  | { $value: string | number | boolean | object; $type?: string; $description?: string; [key: string]: unknown };

/**
 * DTCG token document - nested structure of tokens
 */
export type TokenDocument = {
  [key: string]: TokenValue | TokenDocument;
};

export type Layer = 'core' | 'bu';

export interface SourceMapEntry {
  layer: Layer;
  file: string;
}

export interface FlatTokenRow {
  path: string;
  layer: Layer;
  type: string;
  value: string | number | boolean;
  description?: string;
  resolved?: string | number | boolean;
}

/**
 * Business Unit entity
 */
export interface BU {
  name: string;
  path: string;
}

/**
 * Core entry (folder starting with _)
 */
export interface CoreEntry {
  name: string;
  path: string;
  files: string[];
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Loader contracts
 */
export interface LoadTokensResult {
  tokensDir: string;
  bu: string;
  merged: TokenDocument;
  flat: FlatTokenRow[];
  sourceMaps: Record<string, SourceMapEntry>;
  coreDocsByFile: Record<string, TokenDocument>;
  buDoc: TokenDocument;
  buPath: string;
}

export interface SaveTokensPayload {
  tokensDir: string;
  bu: string;
  coreDocsByFile: Record<string, TokenDocument>;
  buDoc: TokenDocument;
  sourceMaps?: Record<string, SourceMapEntry>;
  buPath?: string;
}

export interface SaveTokensResult {
  success: boolean;
}

/**
 * Version document
 */
export interface VersionDocument {
  version: string;
  [key: string]: unknown;
}

