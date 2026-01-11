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
 * Version document
 */
export interface VersionDocument {
  version: string;
  [key: string]: unknown;
}

