import { TokenDocument, TokenValue } from '@aro-studio/core';

/**
 * Token row for table display
 */
export interface TokenRow {
  path: string; // e.g., "color.primary-50"
  value: string | number | boolean;
  type: string;
  description: string;
}

/**
 * Check if a value is a leaf token (has $value property)
 */
function isLeafToken(value: unknown): value is { $value: unknown; $type?: string; $description?: string; [key: string]: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && '$value' in value;
}

/**
 * Check if a value is a token group (object but not a leaf token)
 */
function isTokenGroup(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !('$value' in value);
}

/**
 * Get a value from a token document using a dot-notation path
 */
function getValueByPath(doc: TokenDocument, path: string): TokenValue | undefined {
  const parts = path.split('.');
  let current: unknown = doc;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current as TokenValue | undefined;
}

/**
 * Resolve a token reference like {color.neutral-50} to its actual value
 */
function resolveReference(value: string, doc: TokenDocument, visited: Set<string> = new Set()): TokenValue | string {
  // Check if value is a reference (format: {path.to.token})
  const referenceMatch = value.match(/^\{([^}]+)\}$/);
  if (!referenceMatch) {
    return value; // Not a reference, return as-is
  }

  const referencePath = referenceMatch[1];

  // Cycle detection
  if (visited.has(referencePath)) {
    return value; // Circular reference, return original
  }

  visited.add(referencePath);

  // Look up the referenced token
  const referencedValue = getValueByPath(doc, referencePath);

  if (!referencedValue) {
    return value; // Reference not found, return original
  }

  // If the referenced value is a leaf token, resolve its $value
  if (isLeafToken(referencedValue)) {
    const resolved = referencedValue.$value;
    if (typeof resolved === 'string') {
      // Recursively resolve if it's also a reference
      const recursiveResolved = resolveReference(resolved, doc, visited);
      if (typeof recursiveResolved === 'string') {
        return recursiveResolved;
      }
      // If recursively resolved to non-string, return as string
      return String(recursiveResolved);
    }
    return String(resolved);
  }

  // If it's not a leaf token, return the original reference string
  return value;
}

/**
 * Recursively flatten a token document into table rows
 */
function flattenRecursive(
  obj: TokenDocument,
  path: string[] = [],
  result: TokenRow[] = [],
  rootDoc: TokenDocument
): TokenRow[] {
  for (const [key, value] of Object.entries(obj)) {
    // Skip metadata fields like $schema
    if (key === '$schema') {
      continue;
    }

    const currentPath = [...path, key];
    const pathString = currentPath.join('.');

    if (isLeafToken(value)) {
      // Extract token properties
      let tokenValue = value.$value;
      const tokenType = value.$type || '';
      const tokenDescription = value.$description || '';

      // Resolve references if value is a string
      if (typeof tokenValue === 'string') {
        const resolved = resolveReference(tokenValue, rootDoc);
        if (typeof resolved === 'string' || typeof resolved === 'number' || typeof resolved === 'boolean') {
          tokenValue = resolved;
        } else {
          // If resolved to object, keep original string reference
          tokenValue = value.$value;
        }
      }

      // Convert value to string/number/boolean
      let finalValue: string | number | boolean;
      if (typeof tokenValue === 'object' && tokenValue !== null) {
        // If value is an object, stringify it
        finalValue = JSON.stringify(tokenValue);
      } else {
        finalValue = tokenValue as string | number | boolean;
      }

      result.push({
        path: pathString,
        value: finalValue,
        type: tokenType,
        description: tokenDescription,
      });
    } else if (isTokenGroup(value)) {
      // Recursively process nested groups
      flattenRecursive(value as TokenDocument, currentPath, result, rootDoc);
    }
    // Primitives at top level are skipped (not valid DTCG tokens)
  }

  return result;
}

/**
 * Flatten a token document into table rows
 */
export function flattenTokens(doc: TokenDocument): TokenRow[] {
  return flattenRecursive(doc, [], [], doc);
}

/**
 * Set a nested value in an object using dot-notation path
 */
function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  
  current[path[path.length - 1]] = value;
}

/**
 * Unflatten table rows back into a token document
 * Preserves $schema and other metadata from original document
 */
export function unflattenTokens(rows: TokenRow[], originalDoc?: TokenDocument): TokenDocument {
  const result: TokenDocument = {};
  
  // Preserve $schema and other top-level metadata from original document
  if (originalDoc) {
    for (const [key, value] of Object.entries(originalDoc)) {
      if (key === '$schema' || (typeof value !== 'object' || value === null || Array.isArray(value))) {
        result[key] = value as TokenValue;
      }
    }
  }

  // Reconstruct nested structure from rows
  for (const row of rows) {
    const pathParts = row.path.split('.');
    const tokenObj: { $value: string | number | boolean | object; $type?: string; $description?: string } = {
      $value: row.value,
    };

    if (row.type) {
      tokenObj.$type = row.type;
    }

    if (row.description) {
      tokenObj.$description = row.description;
    }

    setNestedValue(result, pathParts, tokenObj);
  }

  return result;
}
