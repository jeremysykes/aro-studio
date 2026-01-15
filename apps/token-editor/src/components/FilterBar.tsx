import { useCallback, useMemo } from 'react';
import { Flex, SearchField, Picker, Item, ActionButton, Text, View } from '@adobe/react-spectrum';
import { X } from 'lucide-react';
import { useAppStore, FilterLayer } from '../store';

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

const LAYER_OPTIONS: { key: FilterLayer; label: string }[] = [
  { key: 'all', label: 'All Layers' },
  { key: 'core', label: 'Core Only' },
  { key: 'bu', label: 'BU Only' },
];

const REFERENCE_OPTIONS = [
  { key: 'all', label: 'All Values' },
  { key: 'reference', label: 'References Only' },
  { key: 'literal', label: 'Literals Only' },
];

interface FilterBarProps {
  showLayerFilter?: boolean;
  totalCount: number;
  filteredCount: number;
}

export function FilterBar({ showLayerFilter = true, totalCount, filteredCount }: FilterBarProps) {
  const {
    searchQuery,
    filterType,
    filterLayer,
    filterHasReference,
    setSearchQuery,
    setFilterType,
    setFilterLayer,
    setFilterHasReference,
    clearFilters,
  } = useAppStore();

  const hasActiveFilters = useMemo(
    () => searchQuery !== '' || filterType !== null || filterLayer !== 'all' || filterHasReference !== null,
    [searchQuery, filterType, filterLayer, filterHasReference]
  );

  const handleTypeChange = useCallback(
    (key: React.Key | null) => {
      setFilterType(key === 'all' ? null : (key as string));
    },
    [setFilterType]
  );

  const handleLayerChange = useCallback(
    (key: React.Key | null) => {
      setFilterLayer((key as FilterLayer) || 'all');
    },
    [setFilterLayer]
  );

  const handleReferenceChange = useCallback(
    (key: React.Key | null) => {
      if (key === 'reference') {
        setFilterHasReference(true);
      } else if (key === 'literal') {
        setFilterHasReference(false);
      } else {
        setFilterHasReference(null);
      }
    },
    [setFilterHasReference]
  );

  const referenceSelectedKey = useMemo(() => {
    if (filterHasReference === true) return 'reference';
    if (filterHasReference === false) return 'literal';
    return 'all';
  }, [filterHasReference]);

  // Build type picker items statically to avoid collection type issues
  const typeItems = useMemo(
    () => [{ key: 'all', label: 'All Types' }, ...TOKEN_TYPES],
    []
  );

  return (
    <View
      paddingX="size-200"
      paddingY="size-100"
      backgroundColor="gray-75"
      borderBottomWidth="thin"
      borderColor="gray-300"
    >
      <Flex alignItems="center" gap="size-150" wrap="wrap">
        <SearchField
          aria-label="Search tokens"
          placeholder="Search path, value, description..."
          value={searchQuery}
          onChange={setSearchQuery}
          width="size-2400"
        />

        <Picker
          aria-label="Filter by type"
          selectedKey={filterType || 'all'}
          onSelectionChange={handleTypeChange}
          width="size-1600"
          items={typeItems}
        >
          {(item) => <Item key={item.key}>{item.label}</Item>}
        </Picker>

        {showLayerFilter && (
          <Picker
            aria-label="Filter by layer"
            selectedKey={filterLayer}
            onSelectionChange={handleLayerChange}
            width="size-1600"
            items={LAYER_OPTIONS}
          >
            {(item) => <Item key={item.key}>{item.label}</Item>}
          </Picker>
        )}

        <Picker
          aria-label="Filter by reference"
          selectedKey={referenceSelectedKey}
          onSelectionChange={handleReferenceChange}
          width="size-1600"
          items={REFERENCE_OPTIONS}
        >
          {(item) => <Item key={item.key}>{item.label}</Item>}
        </Picker>

        {hasActiveFilters && (
          <ActionButton onPress={clearFilters} isQuiet aria-label="Clear all filters">
            <X size={14} />
            <Text>Clear</Text>
          </ActionButton>
        )}

        <Text UNSAFE_style={{ fontSize: 12, color: 'var(--spectrum-global-color-gray-600)', marginLeft: 'auto' }}>
          {filteredCount === totalCount ? `${totalCount} tokens` : `${filteredCount} of ${totalCount} tokens`}
        </Text>
      </Flex>
    </View>
  );
}
