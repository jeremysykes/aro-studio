import { useMemo } from 'react';
import { useAppStore } from '../store';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@aro-studio/ui';

export function Sidebar() {
  const {
    businessUnits,
    coreEntries,
    selectedBU,
    selectedCoreFile,
    setSelectedBU,
    setSelectedCore,
  } = useAppStore();

  // Calculate current value from selectedBU or selectedCoreFile
  const currentValue = useMemo(() => {
    if (selectedBU) {
      return selectedBU;
    }
    if (selectedCoreFile) {
      return `core:${selectedCoreFile}`;
    }
    // Default to first business unit if available
    if (businessUnits.length > 0) {
      return businessUnits[0].name;
    }
    return '';
  }, [selectedBU, selectedCoreFile, businessUnits]);

  const handleValueChange = (value: string) => {
    if (value.startsWith('core:')) {
      const filename = value.replace('core:', '');
      setSelectedCore('_core', filename);
    } else {
      setSelectedBU(value);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full h-9 text-[13px]">
          <SelectValue placeholder="Select..." className="truncate" />
        </SelectTrigger>
        <SelectContent>
          {businessUnits.length > 0 && (
            <SelectGroup>
              <SelectLabel>Business units</SelectLabel>
              {businessUnits.map((bu) => (
                <SelectItem key={bu.name} value={bu.name}>
                  {bu.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {coreEntries.length > 0 && businessUnits.length > 0 && <SelectSeparator />}
          {coreEntries.length > 0 && (
            <SelectGroup>
              <SelectLabel>Core</SelectLabel>
              {coreEntries.flatMap((entry) =>
                entry.files.map((file) => (
                  <SelectItem key={file} value={`core:${file}`}>
                    {file}
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
