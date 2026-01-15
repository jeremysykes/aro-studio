import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTrigger,
  ActionButton,
  Content,
  Heading,
  TextField,
  Picker,
  Item,
  Flex,
  Text,
  View,
} from '@adobe/react-spectrum';
import { useAppStore } from '../store';
import type { TokenDocument } from '@aro-studio/core';

const TOKEN_TYPES = [
  { key: 'color', label: 'Color' },
  { key: 'dimension', label: 'Dimension' },
  { key: 'number', label: 'Number' },
  { key: 'string', label: 'String' },
  { key: 'boolean', label: 'Boolean' },
  { key: 'fontFamily', label: 'Font Family' },
  { key: 'fontWeight', label: 'Font Weight' },
  { key: 'duration', label: 'Duration' },
  { key: 'cubicBezier', label: 'Cubic Bezier' },
];

/**
 * Auto-detect token type based on value pattern
 */
function detectType(value: string): string {
  if (!value) return 'string';

  // Hex color
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
    return 'color';
  }

  // RGB/RGBA/HSL/HSLA
  if (/^(rgb|hsl)a?\s*\(/.test(value)) {
    return 'color';
  }

  // Dimension (number with unit)
  if (/^-?\d+(\.\d+)?(px|rem|em|%|vw|vh|pt|pc|in|cm|mm)$/.test(value)) {
    return 'dimension';
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number';
  }

  // Boolean
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }

  // Reference
  if (/^\{[^}]+\}$/.test(value)) {
    return 'string'; // References inherit type from target
  }

  return 'string';
}

interface AddTokenDialogProps {
  existingPaths: Set<string>;
  onAdd: (path: string, value: string, type: string, description: string) => void;
}

export function AddTokenDialog({ existingPaths, onAdd }: AddTokenDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [path, setPath] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<string>('string');
  const [description, setDescription] = useState('');
  const [autoDetectType, setAutoDetectType] = useState(true);

  // Validation
  const validationError = useMemo(() => {
    if (!path.trim()) {
      return 'Path is required';
    }
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(path)) {
      return 'Path must start with a letter and contain only letters, numbers, dots, underscores, or hyphens';
    }
    if (existingPaths.has(path)) {
      return 'A token with this path already exists';
    }
    if (!value.trim()) {
      return 'Value is required';
    }
    return null;
  }, [path, value, existingPaths]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (autoDetectType) {
        const detected = detectType(newValue);
        setType(detected);
      }
    },
    [autoDetectType]
  );

  const handleTypeChange = useCallback((key: React.Key | null) => {
    setType(key as string);
    setAutoDetectType(false); // User manually selected type
  }, []);

  const handleAdd = useCallback(() => {
    if (validationError) return;

    onAdd(path.trim(), value.trim(), type, description.trim());

    // Reset form
    setPath('');
    setValue('');
    setType('string');
    setDescription('');
    setAutoDetectType(true);
    setIsOpen(false);
  }, [validationError, path, value, type, description, onAdd]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form on close
      setPath('');
      setValue('');
      setType('string');
      setDescription('');
      setAutoDetectType(true);
    }
  }, []);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      <ActionButton aria-label="Add token">
        <Text>Add Token</Text>
      </ActionButton>
      <Dialog>
        <Heading>Add New Token</Heading>
        <Content>
          <Flex direction="column" gap="size-200">
            <TextField
              label="Path"
              value={path}
              onChange={setPath}
              placeholder="e.g., color.brand.primary"
              isRequired
              description="Use dot notation for nested paths"
            />

            <TextField
              label="Value"
              value={value}
              onChange={handleValueChange}
              placeholder="e.g., #3A5B81 or {color.palette.blue-500}"
              isRequired
              description={
                autoDetectType && value
                  ? `Auto-detected type: ${type}`
                  : 'Enter a value or reference like {path.to.token}'
              }
            />

            <Picker
              label="Type"
              selectedKey={type}
              onSelectionChange={handleTypeChange}
              items={TOKEN_TYPES}
            >
              {(item) => <Item key={item.key}>{item.label}</Item>}
            </Picker>

            <TextField
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Optional description for this token"
            />

            {validationError && (
              <View backgroundColor="negative" padding="size-100" borderRadius="regular">
                <Text UNSAFE_style={{ color: 'var(--spectrum-semantic-negative-color-default)' }}>
                  {validationError}
                </Text>
              </View>
            )}

            <Flex gap="size-100" justifyContent="end" marginTop="size-200">
              <ActionButton onPress={() => handleOpenChange(false)} isQuiet>
                Cancel
              </ActionButton>
              <ActionButton onPress={handleAdd} isDisabled={!!validationError}>
                Add Token
              </ActionButton>
            </Flex>
          </Flex>
        </Content>
      </Dialog>
    </DialogTrigger>
  );
}

/**
 * Hook to get the add token handler that integrates with the store
 */
export function useAddToken() {
  const {
    selectedBU,
    buDoc,
    setBuDoc,
    setTokenContent,
    setIsDirty,
    buRowsByName,
    setBuRowsByName,
  } = useAppStore();

  const existingPaths = useMemo(() => {
    const paths = new Set<string>();
    const rows = buRowsByName[selectedBU || ''] ?? [];
    rows.forEach((row) => paths.add(row.path));
    return paths;
  }, [buRowsByName, selectedBU]);

  const handleAddToken = useCallback(
    (path: string, value: string, type: string, description: string) => {
      if (!selectedBU) return;

      // Build the token object
      const token: Record<string, unknown> = {
        $value: value,
        $type: type,
      };
      if (description) {
        token.$description = description;
      }

      // Add to buDoc
      const nextBuDoc = buDoc ? JSON.parse(JSON.stringify(buDoc)) : {};
      const parts = path.split('.');
      let current = nextBuDoc as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = token;

      setBuDoc(nextBuDoc as TokenDocument);
      setTokenContent(JSON.stringify(nextBuDoc, null, 2));

      // Add to buRowsByName
      const currentRows = buRowsByName[selectedBU] ?? [];
      const newRow = {
        path,
        layer: 'bu' as const,
        type,
        value,
        description: description || undefined,
      };
      setBuRowsByName({ ...buRowsByName, [selectedBU]: [...currentRows, newRow] });

      setIsDirty(true);
    },
    [selectedBU, buDoc, setBuDoc, setTokenContent, buRowsByName, setBuRowsByName, setIsDirty]
  );

  return { existingPaths, handleAddToken };
}
