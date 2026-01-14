import { useMemo, useRef, useState, useCallback, memo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FlatTokenRow } from '@aro-studio/core';
import { TextField, Text, Switch, View, Flex } from '@adobe/react-spectrum';

type TokenTableProps = {
  rows: FlatTokenRow[];
  coreModeEnabled: boolean;
  onUpdate: (rowIndex: number, columnId: 'value' | 'type' | 'description', newValue: string | number | boolean) => void;
};

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

export function TokenTable({ rows, onUpdate, coreModeEnabled }: TokenTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

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

          if (isDisabled) {
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

          return (
            <View padding="size-100">
              <EditableCell
                value={String(val)}
                isDisabled={isDisabled}
                onCommit={(newVal) => handleValueUpdate(row.index, newVal)}
                ariaLabel={`Value for ${original.path}`}
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
    ],
    [coreModeEnabled, handleValueUpdate, handleTypeUpdate, handleDescriptionUpdate]
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
    <div
      ref={parentRef}
      style={{
        overflow: 'auto',
        backgroundColor: 'var(--spectrum-global-color-gray-50)',
        height: '100%',
        maxHeight: '100%',
        flex: 1,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--spectrum-global-color-gray-300)' }}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'var(--spectrum-global-color-gray-100)',
                    fontWeight: 600,
                    fontSize: 12,
                    width: header.getSize(),
                  }}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
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
            return (
              <tr
                key={row.id}
                style={{
                  height: ROW_HEIGHT,
                  borderBottom: '1px solid var(--spectrum-global-color-gray-200)',
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ padding: 0, verticalAlign: 'top' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
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
  );
}
