import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TextField, Text, View, Flex } from '@adobe/react-spectrum';
import type { FlatTokenRow } from '@aro-studio/core';

interface ReferenceAutocompleteProps {
  value: string;
  onCommit: (val: string) => void;
  isDisabled: boolean;
  ariaLabel: string;
  availableTokens: FlatTokenRow[];
}

/**
 * Editable cell with reference autocomplete.
 * When user types `{`, shows a dropdown with available tokens.
 */
export const ReferenceAutocomplete = memo(function ReferenceAutocomplete({
  value,
  onCommit,
  isDisabled,
  ariaLabel,
  availableTokens,
}: ReferenceAutocompleteProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const localValueRef = useRef(localValue);

  // Keep ref in sync with state - ensures handlers always have fresh value
  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  // Extract the search query from the current reference being typed
  const referenceQuery = useMemo(() => {
    // Check if we're in the middle of typing a reference
    const lastOpenBrace = localValue.lastIndexOf('{');
    const lastCloseBrace = localValue.lastIndexOf('}');

    // If there's an open brace that hasn't been closed yet
    if (lastOpenBrace !== -1 && (lastCloseBrace === -1 || lastOpenBrace > lastCloseBrace)) {
      return localValue.substring(lastOpenBrace + 1);
    }
    return null;
  }, [localValue]);

  // Filter suggestions based on the query
  const suggestions = useMemo(() => {
    if (referenceQuery === null) return [];

    const query = referenceQuery.toLowerCase();
    return availableTokens
      .filter((token) => token.path.toLowerCase().includes(query))
      .slice(0, 10); // Limit to 10 suggestions
  }, [referenceQuery, availableTokens]);

  // Show/hide suggestions based on query
  useEffect(() => {
    setShowSuggestions(referenceQuery !== null && suggestions.length > 0);
    setSelectedIndex(0);
  }, [referenceQuery, suggestions.length]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
  }, []);

  const handleBlur = useCallback(() => {
    // Only close suggestions - commits happen explicitly via Enter, Tab, or suggestion selection
    setShowSuggestions(false);
  }, []);

  // Use ref to always get fresh localValue, avoiding stale closure issues
  const handleSelectSuggestion = (token: FlatTokenRow) => {
    const currentValue = localValueRef.current;
    const lastOpenBrace = currentValue.lastIndexOf('{');
    if (lastOpenBrace !== -1) {
      const newValue = currentValue.substring(0, lastOpenBrace) + `{${token.path}}`;
      setLocalValue(newValue);
      onCommit(newValue);
    }
    setShowSuggestions(false);
  };

  // No useCallback - depends on multiple state values that need to be fresh
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (showSuggestions) {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        }
        break;
      case 'ArrowUp':
        if (showSuggestions) {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (showSuggestions && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (localValue !== value) {
          onCommit(localValue);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setLocalValue(value); // Revert to original
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div style={{ position: 'relative' }}>
      <TextField
        ref={inputRef as any}
        aria-label={ariaLabel}
        width="100%"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        isDisabled={isDisabled}
      />
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: 'auto',
            backgroundColor: 'var(--spectrum-global-color-gray-100)',
            border: '1px solid var(--spectrum-global-color-gray-300)',
            borderRadius: 4,
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
          }}
        >
          {suggestions.map((token, index) => (
            <div
              key={token.path}
              onMouseDown={() => handleSelectSuggestion(token)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor:
                  index === selectedIndex ? 'var(--spectrum-global-color-gray-200)' : 'transparent',
              }}
            >
              <Flex direction="column" gap="size-50">
                <Text UNSAFE_style={{ fontSize: 13, fontWeight: 500 }}>{token.path}</Text>
                <Flex alignItems="center" gap="size-100">
                  <View
                    paddingX="size-50"
                    paddingY="size-25"
                    backgroundColor={token.type === 'color' ? 'blue-400' : 'gray-200'}
                    borderRadius="regular"
                  >
                    <Text UNSAFE_style={{ fontSize: 10 }}>{token.type || 'unknown'}</Text>
                  </View>
                  <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
                    {typeof token.value === 'string' && token.value.length > 30
                      ? `${token.value.substring(0, 30)}...`
                      : String(token.value)}
                  </Text>
                </Flex>
              </Flex>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
