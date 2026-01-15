import { useState, useCallback } from 'react';
import {
  Flex,
  View,
  Text,
  ActionButton,
  Picker,
  Item,
  TextField,
  DialogTrigger,
  Dialog,
  Heading,
  Content,
} from '@adobe/react-spectrum';
import { Trash2, RefreshCw, X } from 'lucide-react';
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

interface BulkActionBarProps {
  selectedCount: number;
}

export function BulkActionBar({ selectedCount }: BulkActionBarProps) {
  const {
    selectedPaths,
    clearSelection,
    selectedBU,
    buDoc,
    setBuDoc,
    setTokenContent,
    setIsDirty,
    buRowsByName,
    setBuRowsByName,
  } = useAppStore();

  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Delete selected tokens
  const handleBulkDelete = useCallback(() => {
    if (!selectedBU || selectedPaths.size === 0) return;

    const pathsToDelete = new Set(selectedPaths);

    // Filter out deleted rows
    const currentRows = buRowsByName[selectedBU] ?? [];
    const newRows = currentRows.filter((row) => !pathsToDelete.has(row.path));
    setBuRowsByName({ ...buRowsByName, [selectedBU]: newRows });

    // Update buDoc
    const nextBuDoc = buDoc ? JSON.parse(JSON.stringify(buDoc)) : {};
    pathsToDelete.forEach((path) => {
      const parts = path.split('.');
      let current = nextBuDoc as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return;
        current = current[parts[i]] as Record<string, unknown>;
      }
      delete current[parts[parts.length - 1]];
    });

    setBuDoc(nextBuDoc as TokenDocument);
    setTokenContent(JSON.stringify(nextBuDoc, null, 2));
    setIsDirty(true);
    clearSelection();
  }, [selectedBU, selectedPaths, buRowsByName, buDoc, setBuRowsByName, setBuDoc, setTokenContent, setIsDirty, clearSelection]);

  // Change type for selected tokens
  const handleChangeType = useCallback(
    (newType: React.Key | null) => {
      if (!selectedBU || !newType || selectedPaths.size === 0) return;

      const pathsToUpdate = new Set(selectedPaths);

      // Update rows
      const currentRows = buRowsByName[selectedBU] ?? [];
      const newRows = currentRows.map((row) => {
        if (pathsToUpdate.has(row.path)) {
          return { ...row, type: newType as string };
        }
        return row;
      });
      setBuRowsByName({ ...buRowsByName, [selectedBU]: newRows });

      // Update buDoc
      const nextBuDoc = buDoc ? JSON.parse(JSON.stringify(buDoc)) : {};
      pathsToUpdate.forEach((path) => {
        const parts = path.split('.');
        let current = nextBuDoc as Record<string, unknown>;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) return;
          current = current[parts[i]] as Record<string, unknown>;
        }
        const token = current[parts[parts.length - 1]] as Record<string, unknown>;
        if (token && typeof token === 'object' && '$value' in token) {
          token.$type = newType as string;
        }
      });

      setBuDoc(nextBuDoc as TokenDocument);
      setTokenContent(JSON.stringify(nextBuDoc, null, 2));
      setIsDirty(true);
    },
    [selectedBU, selectedPaths, buRowsByName, buDoc, setBuRowsByName, setBuDoc, setTokenContent, setIsDirty]
  );

  // Find and replace in values
  const handleFindReplace = useCallback(() => {
    if (!selectedBU || !findText || selectedPaths.size === 0) return;

    const pathsToUpdate = new Set(selectedPaths);

    // Update rows
    const currentRows = buRowsByName[selectedBU] ?? [];
    const newRows = currentRows.map((row) => {
      if (pathsToUpdate.has(row.path) && typeof row.value === 'string') {
        const newValue = row.value.replace(new RegExp(findText, 'g'), replaceText);
        if (newValue !== row.value) {
          return { ...row, value: newValue };
        }
      }
      return row;
    });
    setBuRowsByName({ ...buRowsByName, [selectedBU]: newRows });

    // Update buDoc
    const nextBuDoc = buDoc ? JSON.parse(JSON.stringify(buDoc)) : {};
    pathsToUpdate.forEach((path) => {
      const parts = path.split('.');
      let current = nextBuDoc as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return;
        current = current[parts[i]] as Record<string, unknown>;
      }
      const token = current[parts[parts.length - 1]] as Record<string, unknown>;
      if (token && typeof token === 'object' && '$value' in token) {
        const val = token.$value;
        if (typeof val === 'string') {
          token.$value = val.replace(new RegExp(findText, 'g'), replaceText);
        }
      }
    });

    setBuDoc(nextBuDoc as TokenDocument);
    setTokenContent(JSON.stringify(nextBuDoc, null, 2));
    setIsDirty(true);
    setFindReplaceOpen(false);
    setFindText('');
    setReplaceText('');
  }, [selectedBU, selectedPaths, findText, replaceText, buRowsByName, buDoc, setBuRowsByName, setBuDoc, setTokenContent, setIsDirty]);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <View
      paddingX="size-200"
      paddingY="size-100"
      backgroundColor="blue-400"
      borderBottomWidth="thin"
      borderColor="gray-300"
    >
      <Flex alignItems="center" gap="size-200" justifyContent="space-between">
        <Flex alignItems="center" gap="size-150">
          <Text UNSAFE_style={{ fontWeight: 600, color: 'white' }}>
            {selectedCount} token{selectedCount !== 1 ? 's' : ''} selected
          </Text>

          <ActionButton onPress={handleBulkDelete} isQuiet aria-label="Delete selected">
            <Trash2 size={14} />
            <Text>Delete</Text>
          </ActionButton>

          <Picker
            aria-label="Change type"
            placeholder="Change type..."
            onSelectionChange={handleChangeType}
            width="size-1600"
            items={TOKEN_TYPES}
          >
            {(item) => <Item key={item.key}>{item.label}</Item>}
          </Picker>

          <DialogTrigger isOpen={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
            <ActionButton isQuiet aria-label="Find and replace">
              <RefreshCw size={14} />
              <Text>Find/Replace</Text>
            </ActionButton>
            <Dialog>
              <Heading>Find and Replace in Values</Heading>
              <Content>
                <Flex direction="column" gap="size-200">
                  <TextField
                    label="Find"
                    value={findText}
                    onChange={setFindText}
                    placeholder="Text to find"
                  />
                  <TextField
                    label="Replace with"
                    value={replaceText}
                    onChange={setReplaceText}
                    placeholder="Replacement text"
                  />
                  <Text UNSAFE_style={{ fontSize: 12, color: 'var(--spectrum-global-color-gray-600)' }}>
                    Will replace in {selectedCount} selected token{selectedCount !== 1 ? 's' : ''}
                  </Text>
                  <Flex gap="size-100" justifyContent="end" marginTop="size-200">
                    <ActionButton onPress={() => setFindReplaceOpen(false)} isQuiet>
                      Cancel
                    </ActionButton>
                    <ActionButton onPress={handleFindReplace} isDisabled={!findText}>
                      Replace All
                    </ActionButton>
                  </Flex>
                </Flex>
              </Content>
            </Dialog>
          </DialogTrigger>
        </Flex>

        <ActionButton onPress={clearSelection} isQuiet aria-label="Clear selection">
          <X size={14} />
          <Text>Clear</Text>
        </ActionButton>
      </Flex>
    </View>
  );
}
