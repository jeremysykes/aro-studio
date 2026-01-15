import type { FlatTokenRow } from '@aro-studio/core';

export type ExportFormat = 'css' | 'scss' | 'js' | 'ts';

/**
 * Convert a dot-notation path to CSS custom property name
 * e.g., "color.primary.500" -> "--color-primary-500"
 */
function pathToCssVar(path: string): string {
  return '--' + path.replace(/\./g, '-');
}

/**
 * Convert a dot-notation path to SCSS variable name
 * e.g., "color.primary.500" -> "$color-primary-500"
 */
function pathToScssVar(path: string): string {
  return '$' + path.replace(/\./g, '-');
}

/**
 * Convert a dot-notation path to JS camelCase
 * e.g., "color.primary.500" -> "colorPrimary500"
 */
function pathToCamelCase(path: string): string {
  const parts = path.split('.');
  return parts
    .map((part, i) => {
      if (i === 0) return part;
      // Handle numbers in path
      if (/^\d/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Format a token value for code output
 */
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    // Check if it's a reference - keep as-is for documentation
    if (value.startsWith('{') && value.endsWith('}')) {
      return `"${value}"`;
    }
    return `"${value}"`;
  }
  return String(value);
}

/**
 * Format a token value for CSS (no quotes for simple values)
 */
function formatCssValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    // References become var() calls
    if (value.startsWith('{') && value.endsWith('}')) {
      const refPath = value.slice(1, -1);
      return `var(${pathToCssVar(refPath)})`;
    }
    return value;
  }
  return String(value);
}

/**
 * Generate CSS custom properties
 */
export function generateCss(rows: FlatTokenRow[]): string {
  const lines = [':root {'];
  
  for (const row of rows) {
    const varName = pathToCssVar(row.path);
    const value = formatCssValue(row.value);
    if (row.description) {
      lines.push(`  /* ${row.description} */`);
    }
    lines.push(`  ${varName}: ${value};`);
  }
  
  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate SCSS variables
 */
export function generateScss(rows: FlatTokenRow[]): string {
  const lines: string[] = [];
  
  for (const row of rows) {
    const varName = pathToScssVar(row.path);
    let value = row.value;
    
    // Convert references to SCSS variable refs
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      const refPath = value.slice(1, -1);
      value = pathToScssVar(refPath);
    }
    
    if (row.description) {
      lines.push(`// ${row.description}`);
    }
    lines.push(`${varName}: ${value};`);
  }
  
  return lines.join('\n');
}

/**
 * Generate JavaScript module
 */
export function generateJs(rows: FlatTokenRow[]): string {
  const lines = ['export const tokens = {'];
  
  for (const row of rows) {
    const key = pathToCamelCase(row.path);
    const value = formatValue(row.value);
    if (row.description) {
      lines.push(`  // ${row.description}`);
    }
    lines.push(`  ${key}: ${value},`);
  }
  
  lines.push('};');
  return lines.join('\n');
}

/**
 * Generate TypeScript module with type definitions
 */
export function generateTs(rows: FlatTokenRow[]): string {
  const tokenLines: string[] = [];
  const typeLines: string[] = [];
  
  for (const row of rows) {
    const key = pathToCamelCase(row.path);
    const value = formatValue(row.value);
    const tsType = typeof row.value === 'boolean' ? 'boolean' : typeof row.value === 'number' ? 'number' : 'string';
    
    if (row.description) {
      tokenLines.push(`  /** ${row.description} */`);
    }
    tokenLines.push(`  ${key}: ${value},`);
    typeLines.push(`  ${key}: ${tsType};`);
  }
  
  const lines = [
    'export interface Tokens {',
    ...typeLines,
    '}',
    '',
    'export const tokens: Tokens = {',
    ...tokenLines,
    '};',
  ];
  
  return lines.join('\n');
}

/**
 * Generate export based on format
 */
export function generateExport(rows: FlatTokenRow[], format: ExportFormat): string {
  switch (format) {
    case 'css':
      return generateCss(rows);
    case 'scss':
      return generateScss(rows);
    case 'js':
      return generateJs(rows);
    case 'ts':
      return generateTs(rows);
    default:
      return '';
  }
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'css':
      return '.css';
    case 'scss':
      return '.scss';
    case 'js':
      return '.js';
    case 'ts':
      return '.ts';
    default:
      return '.txt';
  }
}

/**
 * Get language for Monaco editor
 */
export function getMonacoLanguage(format: ExportFormat): string {
  switch (format) {
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    default:
      return 'plaintext';
  }
}
