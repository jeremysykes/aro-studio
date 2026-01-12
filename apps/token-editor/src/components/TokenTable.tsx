import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, Row } from '@tanstack/react-table';
import { ColorPicker } from '@aro-studio/ui';
import { TokenRow, flattenTokens, unflattenTokens } from '../utils/tokenFlatten';
import { TokenDocument } from '@aro-studio/core';

interface TokenTableProps {
  tokenDoc: TokenDocument;
  onTokenChange: (doc: TokenDocument) => void;
}

interface EditableCellProps {
  value: string | number | boolean;
  row: Row<TokenRow>;
  columnId: string;
  onUpdate: (rowIndex: number, columnId: string, value: string | number | boolean) => void;
  tokenType?: string;
}

function EditableCell({ value, row, columnId, onUpdate, tokenType }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const swatchRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Check if value is a color (hex format)
  const isColor = tokenType === 'color' && columnId === 'value' && typeof value === 'string';
  const hexValue = isColor ? String(value).trim() : '';
  const isValidHex = isColor && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hexValue);

  const handleSave = useCallback(() => {
    // Convert value based on column type
    let finalValue: string | number | boolean = editValue;
    if (columnId === 'value') {
      // Try to parse as number or boolean, otherwise keep as string
      if (editValue === 'true') {
        finalValue = true;
      } else if (editValue === 'false') {
        finalValue = false;
      } else if (!isNaN(Number(editValue)) && editValue.trim() !== '') {
        finalValue = Number(editValue);
      } else {
        finalValue = editValue;
      }
    }
    onUpdate(row.index, columnId, finalValue);
    setIsEditing(false);
  }, [editValue, columnId, row.index, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditValue(String(value));
    setIsEditing(false);
  }, [value]);

  const handleSwatchClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isValidHex) {
        setIsColorPickerOpen(true);
      }
    },
    [isValidHex]
  );

  const handleColorChange = useCallback(
    (newHex: string) => {
      setEditValue(newHex);
      onUpdate(row.index, columnId, newHex);
    },
    [row.index, columnId, onUpdate]
  );

  // Close picker when clicking outside
  useEffect(() => {
    if (!isColorPickerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        swatchRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        !swatchRef.current.contains(e.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColorPickerOpen]);

  if (columnId === 'path') {
    // Path is read-only
    return <div className="px-4 py-2 text-sm">{String(value)}</div>;
  }

  if (isEditing && !isColorPickerOpen) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            handleCancel();
          }
        }}
        className="px-4 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />
    );
  }

  return (
    <div className="relative">
      <div
        className="px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 min-h-[2.5rem] flex items-center gap-2"
        onClick={() => !isColorPickerOpen && setIsEditing(true)}
      >
        {isValidHex && (
          <div
            ref={swatchRef}
            className="w-4 h-4 rounded border border-border/50 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-ring transition-all"
            style={{ backgroundColor: hexValue, width: '16px', height: '16px' }}
            title={`Click to pick color: ${hexValue}`}
            onClick={handleSwatchClick}
          />
        )}
        <span>{String(value)}</span>
      </div>
      {isColorPickerOpen && isValidHex && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-1"
          style={{ left: 0, top: '100%' }}
        >
          <ColorPicker value={hexValue} onChange={handleColorChange} />
        </div>
      )}
    </div>
  );
}

export function TokenTable({ tokenDoc, onTokenChange }: TokenTableProps) {
  const rows = useMemo(() => flattenTokens(tokenDoc), [tokenDoc]);

  const handleCellUpdate = useCallback(
    (rowIndex: number, columnId: string, newValue: string | number | boolean) => {
      const updatedRows = [...rows];
      const row = updatedRows[rowIndex];

      if (columnId === 'value') {
        row.value = newValue;
      } else if (columnId === 'type') {
        row.type = String(newValue);
      } else if (columnId === 'description') {
        row.description = String(newValue);
      }

      // Reconstruct token document
      const updatedDoc = unflattenTokens(updatedRows, tokenDoc);
      onTokenChange(updatedDoc);
    },
    [rows, tokenDoc, onTokenChange]
  );

  const columns = useMemo<ColumnDef<TokenRow>[]>(
    () => [
      {
        accessorKey: 'path',
        header: 'Path',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue() as string | number | boolean}
            row={row}
            columnId="path"
            onUpdate={handleCellUpdate}
          />
        ),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue() as string | number | boolean}
            row={row}
            columnId="value"
            onUpdate={handleCellUpdate}
            tokenType={row.original.type}
          />
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue() as string | number | boolean}
            row={row}
            columnId="type"
            onUpdate={handleCellUpdate}
          />
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue() as string | number | boolean}
            row={row}
            columnId="description"
            onUpdate={handleCellUpdate}
          />
        ),
      },
    ],
    [handleCellUpdate]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left text-sm font-semibold text-foreground bg-muted/50"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-border hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
