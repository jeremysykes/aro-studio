import { useMemo, useRef, useState, useCallback, memo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FlatTokenRow } from '@aro-studio/core';
import { TextField, Text, Switch, View, Flex, ActionButton } from '@adobe/react-spectrum';
import { Copy } from 'lucide-react';
import { ColorCell, shouldUseColorPicker } from './ColorCell';
import { ReferenceAutocomplete } from './ReferenceAutocomplete';
import { DeleteTokenDialog } from './DeleteTokenDialog';

type TokenTableProps = {
  rows: FlatTokenRow[];
  allFilteredRows?: FlatTokenRow[]; // All filtered rows (for group buttons), before collapse filtering
  coreModeEnabled: boolean;
  onUpdate: (rowIndex: number, columnId: 'value' | 'type' | 'description', newValue: string | number | boolean) => void;
  onDelete?: (rowIndex: number) => void;
  onDuplicate?: (rowIndex: number) => void;
  selectedPaths?: Set<string>;
  onToggleSelection?: (path: string) => void;
  onSelectAll?: (paths: string[]) => void;
  // Grouping
  collapsedGroups?: Set<string>;
  onToggleGroupCollapse?: (group: string) => void;
};

// Get the top-level group from a token path
function getTokenGroup(path: string): string {
  return path.split('.')[0];
}

// Group rows by their top-level path segment
function groupRows(rows: FlatTokenRow[]): Map<string, FlatTokenRow[]> {
  const groups = new Map<string, FlatTokenRow[]>();
  for (const row of rows) {
    const group = getTokenGroup(row.path);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(row);
  }
  return groups;
}

const isBooleanish = (type: string, value: unknown) => type === 'boolean' || typeof value === 'boolean';

// Memoized editable text cell to prevent re-renders and preserve focus
const EditableCell = memo(function EditableCell({
  value,
  onCommit,
  isDisabled,
  ariaLabel,
}: {
  value: string;
  onCommit: (val: string) => void;
  isDisabled: boolean;
  ariaLabel: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onCommit(localValue);
    }
  }, [localValue, value, onCommit]);

  return (
    <TextField
      aria-label={ariaLabel}
      width="100%"
      value={localValue}
      onChange={setLocalValue}
      onBlur={handleBlur}
      isDisabled={isDisabled}
    />
  );
});

// Memoized boolean cell
const BooleanCell = memo(function BooleanCell({
  value,
  onChange,
  isDisabled,
  ariaLabel,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  isDisabled: boolean;
  ariaLabel: string;
}) {
  return (
    <Switch
      isSelected={value}
      isDisabled={isDisabled}
      onChange={onChange}
      aria-label={ariaLabel}
    >
      <Text UNSAFE_style={{ fontSize: 12 }}>{String(value)}</Text>
    </Switch>
  );
});

const ROW_HEIGHT = 60; // Estimated row height for virtualization

export function TokenTable({
  rows,
  allFilteredRows,
  onUpdate,
  coreModeEnabled,
  onDelete,
  onDuplicate,
  selectedPaths,
  onToggleSelection,
  onSelectAll,
  collapsedGroups,
  onToggleGroupCollapse,
}: TokenTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  // Selection helpers
  const allSelected = selectedPaths && rows.length > 0 && rows.every((row) => selectedPaths.has(row.path));
  const someSelected = selectedPaths && rows.some((row) => selectedPaths.has(row.path)) && !allSelected;

  // Compute grouped rows for group buttons UI - uses all filtered rows (before collapse)
  const rowsForGroups = allFilteredRows ?? rows;
  const groups = groupRows(rowsForGroups);
  const groupNames = Array.from(groups.keys()).sort();

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalRows = rows.length;
      if (totalRows === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            const next = prev === null ? 0 : Math.min(prev + 1, totalRows - 1);
            // Scroll to the focused row
            if (parentRef.current) {
              const rowElement = parentRef.current.querySelector(`[data-row-index="${next}"]`);
              rowElement?.scrollIntoView({ block: 'nearest' });
            }
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            const next = prev === null ? totalRows - 1 : Math.max(prev - 1, 0);
            if (parentRef.current) {
              const rowElement = parentRef.current.querySelector(`[data-row-index="${next}"]`);
              rowElement?.scrollIntoView({ block: 'nearest' });
            }
            return next;
          });
          break;
        case 'Home':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFocusedRowIndex(0);
            if (parentRef.current) {
              parentRef.current.scrollTop = 0;
            }
          }
          break;
        case 'End':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFocusedRowIndex(totalRows - 1);
            if (parentRef.current) {
              parentRef.current.scrollTop = parentRef.current.scrollHeight;
            }
          }
          break;
        case ' ':
          // Don't capture space when typing in an input field
          const target = e.target as HTMLElement;
          const isTypingInInput = target.tagName === 'INPUT' ||
                                  target.tagName === 'TEXTAREA' ||
                                  target.isContentEditable;
          if (isTypingInInput) {
            break; // Let the space go through to the input
          }
          // Space to toggle selection
          if (focusedRowIndex !== null && onToggleSelection) {
            e.preventDefault();
            const row = rows[focusedRowIndex];
            if (row) {
              onToggleSelection(row.path);
            }
          }
          break;
      }
    },
    [rows, focusedRowIndex, onToggleSelection]
  );

  // Stable callback references to prevent column recreation
  const handleValueUpdate = useCallback(
    (rowIndex: number, newValue: string | number | boolean) => {
      onUpdate(rowIndex, 'value', newValue);
    },
    [onUpdate]
  );

  const handleTypeUpdate = useCallback(
    (rowIndex: number, newValue: string) => {
      onUpdate(rowIndex, 'type', newValue);
    },
    [onUpdate]
  );

  const handleDescriptionUpdate = useCallback(
    (rowIndex: number, newValue: string) => {
      onUpdate(rowIndex, 'description', newValue);
    },
    [onUpdate]
  );

  const columns = useMemo<ColumnDef<FlatTokenRow>[]>(
    () => [
      // Selection checkbox column (optional)
      ...(onToggleSelection
        ? [
            {
              id: 'select',
              header: () => (
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected || false;
                  }}
                  onChange={() => {
                    if (allSelected) {
                      onSelectAll?.([]);
                    } else {
                      onSelectAll?.(rows.map((r) => r.path));
                    }
                  }}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                  aria-label="Select all"
                />
              ),
              size: 40,
              cell: ({ row }: { row: { original: FlatTokenRow } }) => {
                const isSelected = selectedPaths?.has(row.original.path) || false;
                return (
                  <div style={{ padding: '8px 12px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(row.original.path)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                      aria-label={`Select ${row.original.path}`}
                    />
                  </div>
                );
              },
            } as ColumnDef<FlatTokenRow>,
          ]
        : []),
      {
        accessorKey: 'path',
        header: 'Path',
        size: 300,
        cell: ({ getValue, row }) => (
          <Flex alignItems="center" gap="size-100" UNSAFE_style={{ padding: '8px 12px' }}>
            <View
              paddingX="size-75"
              paddingY="size-50"
              backgroundColor={row.original.layer === 'core' ? 'gray-200' : 'blue-400'}
              borderRadius="regular"
            >
              <Text UNSAFE_style={{ fontSize: 11, fontWeight: 600 }}>
                {row.original.layer === 'core' ? 'core' : 'bu'}
              </Text>
            </View>
            <Text UNSAFE_style={{ fontSize: 13 }}>{getValue() as string}</Text>
          </Flex>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        size: 200,
        cell: ({ row, getValue }) => {
          const original = row.original;
          const val = getValue() as string | number | boolean;
          const isDisabled = original.layer === 'core' && !coreModeEnabled;

          // Check if this is a color token
          const isColor = shouldUseColorPicker(original.type, val);

          if (isDisabled) {
            // Show color swatch for disabled color tokens
            if (isColor && typeof val === 'string') {
              return (
                <View padding="size-100">
                  <Flex alignItems="center" gap="size-100">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: val,
                        border: '1px solid var(--spectrum-global-color-gray-400)',
                        flexShrink: 0,
                      }}
                    />
                    <Text UNSAFE_style={{ fontSize: 13 }}>{String(val)}</Text>
                  </Flex>
                  {original.resolved && original.resolved !== val ? (
                    <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
                      Resolved: {String(original.resolved)}
                    </Text>
                  ) : null}
                </View>
              );
            }
            return (
              <View padding="size-100">
                <Text UNSAFE_style={{ fontSize: 13 }}>{String(val)}</Text>
                {original.resolved && original.resolved !== val ? (
                  <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
                    Resolved: {String(original.resolved)}
                  </Text>
                ) : null}
              </View>
            );
          }

          if (isBooleanish(original.type, val)) {
            return (
              <View padding="size-100">
                <BooleanCell
                  value={Boolean(val)}
                  isDisabled={isDisabled}
                  onChange={(selected) => handleValueUpdate(row.index, selected)}
                  ariaLabel={`Toggle ${original.path}`}
                />
              </View>
            );
          }

          // Use ColorCell for color tokens
          if (isColor && typeof val === 'string') {
            return (
              <ColorCell
                value={val}
                isDisabled={isDisabled}
                onCommit={(newVal) => handleValueUpdate(row.index, newVal)}
                ariaLabel={`Color for ${original.path}`}
              />
            );
          }

          // Use ReferenceAutocomplete for string values (with autocomplete for {references})
          return (
            <View padding="size-100">
              <ReferenceAutocomplete
                value={String(val)}
                isDisabled={isDisabled}
                onCommit={(newVal) => handleValueUpdate(row.index, newVal)}
                ariaLabel={`Value for ${original.path}`}
                availableTokens={rows}
              />
              {original.resolved && original.resolved !== val ? (
                <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
                  Resolved: {String(original.resolved)}
                </Text>
              ) : null}
            </View>
          );
        },
      },
      {
        accessorKey: 'type',
        header: '$type',
        size: 120,
        cell: ({ row, getValue }) => {
          const val = getValue() as string | number | boolean;
          const original = row.original;
          const isDisabled = original.layer === 'core' && !coreModeEnabled;

          if (isDisabled) {
            return (
              <View padding="size-100">
                <Text UNSAFE_style={{ fontSize: 13 }}>{String(val)}</Text>
              </View>
            );
          }
          return (
            <View padding="size-100">
              <EditableCell
                value={String(val)}
                isDisabled={isDisabled}
                onCommit={(newVal) => handleTypeUpdate(row.index, newVal)}
                ariaLabel={`Type for ${original.path}`}
              />
            </View>
          );
        },
      },
      {
        accessorKey: 'description',
        header: '$description',
        size: 200,
        cell: ({ row, getValue }) => {
          const val = getValue() as string | number | boolean;
          const original = row.original;
          const isDisabled = original.layer === 'core' && !coreModeEnabled;

          if (isDisabled) {
            return (
              <View padding="size-100">
                <Text UNSAFE_style={{ fontSize: 13 }}>{String(val || '')}</Text>
              </View>
            );
          }
          return (
            <View padding="size-100">
              <EditableCell
                value={val ? String(val) : ''}
                isDisabled={isDisabled}
                onCommit={(newVal) => handleDescriptionUpdate(row.index, newVal)}
                ariaLabel={`Description for ${original.path}`}
              />
            </View>
          );
        },
      },
      // Actions column (delete)
      ...(onDelete
        ? [
            {
              id: 'actions',
              header: '',
              size: 80,
              cell: ({ row }: { row: { index: number; original: FlatTokenRow } }) => {
                const original = row.original;
                const isDisabled = original.layer === 'core' && !coreModeEnabled;

                return (
                  <View padding="size-100">
                    <Flex gap="size-50">
                      {onDuplicate && (
                        <ActionButton
                          isQuiet
                          aria-label={`Duplicate ${original.path}`}
                          isDisabled={isDisabled}
                          onPress={() => onDuplicate(row.index)}
                          UNSAFE_style={{ padding: 4, minWidth: 0 }}
                        >
                          <Copy size={14} />
                        </ActionButton>
                      )}
                      <DeleteTokenDialog
                        token={original}
                        allTokens={rows}
                        onDelete={() => onDelete(row.index)}
                        isDisabled={isDisabled}
                      />
                    </Flex>
                  </View>
                );
              },
            } as ColumnDef<FlatTokenRow>,
          ]
        : []),
    ],
    [coreModeEnabled, handleValueUpdate, handleTypeUpdate, handleDescriptionUpdate, rows, onDelete, onDuplicate, onToggleSelection, onSelectAll, selectedPaths, allSelected, someSelected]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Group headers bar - OUTSIDE scroll container, always visible */}
      {onToggleGroupCollapse && groupNames.length > 1 && (
        <View
          paddingX="size-300"
          paddingY="size-100"
          backgroundColor="gray-100"
          borderBottomWidth="thin"
          borderColor="gray-300"
          UNSAFE_style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {groupNames.map((group) => {
            const isCollapsed = collapsedGroups?.has(group);
            const count = groups.get(group)?.length ?? 0;
            return (
              <button
                key={group}
                onClick={() => onToggleGroupCollapse(group)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: isCollapsed
                    ? 'var(--spectrum-global-color-gray-200)'
                    : 'var(--spectrum-global-color-gray-75)',
                  border: '1px solid var(--spectrum-global-color-gray-300)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  opacity: isCollapsed ? 0.7 : 1,
                }}
              >
                <span style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
                  ▼
                </span>
                {group}
                <span
                  style={{
                    backgroundColor: 'var(--spectrum-global-color-gray-400)',
                    color: 'white',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: 10,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </View>
      )}

      {/* Scroll container */}
      <div
        ref={parentRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          overflow: 'auto',
          backgroundColor: 'var(--spectrum-global-color-gray-50)',
          flex: 1,
          outline: 'none',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--spectrum-global-color-gray-300)' }}>
              {headerGroup.headers.map((header, index) => {
                const isFirst = index === 0;
                const isLast = index === headerGroup.headers.length - 1;
                return (
                  <th
                    key={header.id}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      paddingTop: 'var(--spectrum-global-dimension-size-100)',
                      paddingBottom: 'var(--spectrum-global-dimension-size-100)',
                      paddingLeft: isFirst ? 'var(--spectrum-global-dimension-size-300)' : 'var(--spectrum-global-dimension-size-150)',
                      paddingRight: isLast ? 'var(--spectrum-global-dimension-size-300)' : 'var(--spectrum-global-dimension-size-150)',
                      textAlign: 'left',
                      background: 'var(--spectrum-global-color-gray-100)',
                      fontWeight: 600,
                      fontSize: 12,
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* Spacer row for virtualization */}
          {virtualRows.length > 0 && virtualRows[0].start > 0 && (
            <tr style={{ height: virtualRows[0].start }} />
          )}
          {virtualRows.map((virtualRow) => {
            const row = tableRows[virtualRow.index];
            const isFocused = focusedRowIndex === virtualRow.index;
            return (
              <tr
                key={row.id}
                data-row-index={virtualRow.index}
                onClick={() => setFocusedRowIndex(virtualRow.index)}
                style={{
                  height: ROW_HEIGHT,
                  borderBottom: '1px solid var(--spectrum-global-color-gray-200)',
                  backgroundColor: isFocused ? 'var(--spectrum-global-color-blue-100)' : undefined,
                  boxShadow: isFocused ? 'inset 3px 0 0 var(--spectrum-global-color-blue-500)' : undefined,
                  cursor: 'pointer',
                  scrollMarginTop: 'var(--spectrum-global-dimension-size-500)',
                }}
              >
                {row.getVisibleCells().map((cell, index) => {
                  const isFirst = index === 0;
                  const isLast = index === row.getVisibleCells().length - 1;
                  return (
                    <td
                      key={cell.id}
                      style={{
                        padding: 0,
                        paddingLeft: isFirst ? 'var(--spectrum-global-dimension-size-150)' : 0,
                        paddingRight: isLast ? 'var(--spectrum-global-dimension-size-150)' : 0,
                        verticalAlign: 'top',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* Bottom spacer for virtualization */}
          {virtualRows.length > 0 && (
            <tr style={{ height: totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) }} />
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
