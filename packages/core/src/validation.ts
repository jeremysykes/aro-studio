import { z } from 'zod';
import { TokenDocument, ValidationIssue } from './types';

/**
 * Zod schema for a token document - permissive to allow any JSON structure
 * We do runtime validation separately
 */
const tokenDocumentSchema = z.record(z.string(), z.unknown());

/**
 * Parse and validate a token document structure
 * This ensures it's a valid JSON object, but doesn't enforce DTCG structure
 * (that's done by validateTokenDocument)
 */
export function parseTokenDocument(data: unknown): TokenDocument {
  const parsed = tokenDocumentSchema.parse(data);
  return parsed as TokenDocument;
}

/**
 * Check if a value is a leaf token (has $value property)
 */
function isLeafToken(value: unknown): value is { $value: unknown; [key: string]: unknown } {
  return typeof value === 'object' && value !== null && '$value' in value;
}

/**
 * Check if a value is a token group (object without $value)
 */
function isTokenGroup(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively validate a token document
 */
function validateRecursive(
  obj: unknown,
  path: string[] = []
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isTokenGroup(obj)) {
    return issues;
  }

  for (const [key, value] of Object.entries(obj)) {
    // Skip metadata fields like $schema
    if (key === '$schema') {
      continue;
    }

    const currentPath = [...path, key];
    const pathString = currentPath.join('.');

    if (isLeafToken(value)) {
      // Leaf token must have $value
      if (!('$value' in value) || value.$value === undefined) {
        issues.push({
          path: pathString,
          message: 'Token must have a $value property',
          severity: 'error',
        });
      }

      // $type is recommended but optional
      if (!('$type' in value) || !value.$type) {
        issues.push({
          path: pathString,
          message: 'Token should have a $type property (recommended)',
          severity: 'warning',
        });
      }
    } else if (isTokenGroup(value)) {
      // Recursively validate nested groups
      issues.push(...validateRecursive(value, currentPath));
    }
    // Primitives (string, number, boolean) at top level are allowed
  }

  return issues;
}

/**
 * Validate a token document
 * Returns an array of validation issues (errors and warnings)
 */
export function validateTokenDocument(doc: TokenDocument): ValidationIssue[] {
  return validateRecursive(doc);
}

