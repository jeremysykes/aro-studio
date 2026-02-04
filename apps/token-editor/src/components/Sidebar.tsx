import { useMemo } from 'react';
import { useAppStore } from '../store';
import { Picker, Item, Section, Text, View } from '@adobe/react-spectrum';

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
    <View padding="size-200">
      <Picker
        label="Sources"
        selectedKey={currentValue}
        onSelectionChange={(key) => handleValueChange(key as string)}
        width="100%"
      >
        {businessUnits.length > 0 ? (
          <Section title="Business units">
            {businessUnits.map((bu) => (
              <Item key={bu.name} textValue={bu.displayName ?? bu.name}>
                <Text>{bu.displayName ?? bu.name}</Text>
              </Item>
            ))}
          </Section>
        ) : null}
        {coreEntries.length > 0 ? (
          <Section title="Core">
            {coreEntries.flatMap((entry) =>
              entry.files.map((file) => (
                <Item key={`core:${file}`} textValue={file}>
                  <Text>{file}</Text>
                </Item>
              ))
            )}
          </Section>
        ) : null}
      </Picker>
    </View>
  );
}
