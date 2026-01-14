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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a leaf token (has $value property)
 */
function isLeafToken(value: unknown): value is { $value: unknown; [key: string]: unknown } {
  return isObject(value) && '$value' in value;
}

/**
 * Check if a value is a token group (object without $value)
 */
function isTokenGroup(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !('$value' in value);
}

function getValueByPath(doc: TokenDocument, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = doc;
  for (const part of parts) {
    if (!isObject(current)) return undefined;
    current = current[part];
  }
  return current;
}

const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgba?\(/;
const DIMENSION_REGEX = /^-?\d+(\.\d+)?(px|rem|em|%)$/;

interface ValidateOptions {
  resolverDoc?: TokenDocument; // for reference resolution
}

function validateValueType(path: string, token: { $value: unknown; $type?: unknown }, issues: ValidationIssue[]) {
  const { $value, $type } = token;
  if ($value === undefined) {
    issues.push({ path, message: 'Token must have a $value property', severity: 'error' });
    return;
  }
  if (!$type) {
    issues.push({ path, message: 'Token must have a $type property', severity: 'error' });
    return;
  }

  const type = String($type);
  if (typeof $value === 'string') {
    // references are allowed for any type
    if ($value.startsWith('{') && $value.endsWith('}')) {
      return;
    }
  }

  switch (type) {
    case 'color':
      if (!(typeof $value === 'string' && COLOR_REGEX.test($value))) {
        issues.push({ path, message: 'Color $value must be a color string or reference', severity: 'error' });
      }
      break;
    case 'dimension':
      if (!(typeof $value === 'string' && DIMENSION_REGEX.test($value))) {
        issues.push({ path, message: 'Dimension $value must be number+unit or reference', severity: 'error' });
      }
      break;
    case 'number':
      if (typeof $value !== 'number') {
        issues.push({ path, message: 'Number $value must be a number or reference', severity: 'error' });
      }
      break;
    case 'boolean':
      if (typeof $value !== 'boolean') {
        issues.push({ path, message: 'Boolean $value must be a boolean or reference', severity: 'error' });
      }
      break;
    case 'string':
      if (typeof $value !== 'string') {
        issues.push({ path, message: 'String $value must be a string or reference', severity: 'error' });
      }
      break;
    default:
      // Unknown types are allowed but must have $value
      break;
  }
}

function resolveReference(
  ref: string,
  doc: TokenDocument,
  visited: Set<string>,
  issues: ValidationIssue[],
  originPath: string
) {
  const match = ref.match(/^\{([^}]+)\}$/);
  if (!match) return;
  const targetPath = match[1];
  if (visited.has(targetPath)) {
    issues.push({ path: originPath, message: 'Circular reference detected', severity: 'error' });
    return;
  }
  visited.add(targetPath);
  const target = getValueByPath(doc, targetPath);
  if (!target || !isLeafToken(target)) {
    issues.push({ path: originPath, message: `Missing reference target: ${targetPath}`, severity: 'error' });
    return;
  }
  const val = target.$value;
  if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    resolveReference(val, doc, visited, issues, originPath);
  }
}

function validateRecursive(
  obj: unknown,
  path: string[] = [],
  issues: ValidationIssue[],
  resolverDoc: TokenDocument
) {
  if (!isTokenGroup(obj)) {
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$schema') continue;
    const currentPath = [...path, key];
    const pathString = currentPath.join('.');

    if (isLeafToken(value)) {
      validateValueType(pathString, value, issues);
      if (typeof value.$value === 'string' && value.$value.startsWith('{') && value.$value.endsWith('}')) {
        resolveReference(value.$value, resolverDoc, new Set(), issues, pathString);
      }
    } else if (isTokenGroup(value)) {
      validateRecursive(value, currentPath, issues, resolverDoc);
    }
  }
}

/**
 * Validate a token document
 * Returns an array of validation issues (errors and warnings)
 */
export function validateTokenDocument(doc: TokenDocument, opts: ValidateOptions = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const resolver = opts.resolverDoc ?? doc;
  validateRecursive(doc, [], issues, resolver);
  return issues;
}

