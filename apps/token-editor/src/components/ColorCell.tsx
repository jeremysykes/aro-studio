import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Flex, View, Text, DialogTrigger, Dialog, ActionButton, Content, Heading, TextField } from '@adobe/react-spectrum';
import { ColorArea, ColorSlider, ColorField, parseColor, Color } from '@adobe/react-spectrum';
import type { FlatTokenRow } from '@aro-studio/core';

interface ColorCellProps {
  value: string;
  onCommit: (value: string) => void;
  isDisabled: boolean;
  ariaLabel: string;
  availableTokens: FlatTokenRow[];
  resolvedValue?: string; // The resolved color value for references
  currentPath: string; // Current token's path - excluded from autocomplete to prevent self-references
}

/**
 * Check if a string is a valid color format that Spectrum can parse
 */
function isValidColorFormat(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  // Hex colors
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
    return true;
  }

  // RGB/RGBA
  if (/^rgba?\s*\(/.test(value)) {
    return true;
  }

  // HSL/HSLA
  if (/^hsla?\s*\(/.test(value)) {
    return true;
  }

  return false;
}

/**
 * Check if a value is a reference (e.g., {color.primary.500})
 */
function isReference(value: string): boolean {
  return value.startsWith('{') && value.endsWith('}');
}

/**
 * Extract the path from a reference string (e.g., {color.primary.500} -> color.primary.500)
 */
function extractReferencePath(value: string): string | null {
  if (!isReference(value)) return null;
  return value.slice(1, -1); // Remove { and }
}

/**
 * Resolve a reference to its actual value using available tokens
 */
function resolveReference(value: string, availableTokens: FlatTokenRow[]): string | null {
  const path = extractReferencePath(value);
  if (!path) return null;
  const token = availableTokens.find((t) => t.path === path);
  if (token && typeof token.value === 'string') {
    return token.value;
  }
  return null;
}

/**
 * Safely parse a color string into a Spectrum Color object
 * Converts to HSLA format so ColorArea/ColorSlider can access hue/saturation/lightness channels
 */
function safeParseColor(value: string): Color | null {
  try {
    const color = parseColor(value);
    // Convert to HSLA so ColorArea/ColorSlider can access hue/saturation/lightness
    return color.toFormat('hsla');
  } catch {
    return null;
  }
}

/**
 * Format a Color object back to a hex string for storage
 * Uses hexa format (8-digit) if alpha is not 100%, otherwise standard hex
 */
function colorToHex(color: Color): string {
  const alpha = color.getChannelValue('alpha');
  if (alpha < 1) {
    return color.toString('hexa');
  }
  return color.toString('hex');
}

/**
 * ColorCell with inline editing and color picker modal.
 * - Swatch button opens the color picker modal for visual editing
 * - Inline text input supports direct hex entry and {reference} autocomplete
 */
export const ColorCell = memo(function ColorCell({
  value,
  onCommit,
  isDisabled,
  ariaLabel,
  availableTokens,
  resolvedValue,
  currentPath,
}: ColorCellProps) {
  // Inline input state - declare first so we can use localValue in display color calculation
  const [localValue, setLocalValue] = useState(value);

  // Determine the display color based on localValue (not value prop) for immediate updates
  // Try to resolve references locally first, then fall back to resolvedValue prop
  const displayColorValue = useMemo(() => {
    if (isReference(localValue)) {
      // First try to resolve using availableTokens (for immediate feedback)
      const localResolved = resolveReference(localValue, availableTokens);
      if (localResolved && isValidColorFormat(localResolved)) {
        return localResolved;
      }
      // Fall back to resolvedValue prop (from parent data)
      if (resolvedValue) {
        return resolvedValue;
      }
      // Can't resolve - return the raw reference (will show grey)
      return localValue;
    }
    return localValue;
  }, [localValue, availableTokens, resolvedValue]);

  const parsedDisplayColor = useMemo(() => safeParseColor(displayColorValue), [displayColorValue]);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState<Color | null>(parsedDisplayColor);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const localValueRef = useRef(localValue);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync localValue with external value when it changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Keep ref in sync with state
  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  // Extract the search query from the current reference being typed
  const referenceQuery = useMemo(() => {
    const lastOpenBrace = localValue.lastIndexOf('{');
    const lastCloseBrace = localValue.lastIndexOf('}');

    if (lastOpenBrace !== -1 && (lastCloseBrace === -1 || lastOpenBrace > lastCloseBrace)) {
      return localValue.substring(lastOpenBrace + 1);
    }
    return null;
  }, [localValue]);

  // Filter suggestions based on the query - exclude self to prevent circular references
  const suggestions = useMemo(() => {
    if (referenceQuery === null) return [];

    const query = referenceQuery.toLowerCase();
    return availableTokens
      .filter((token) => token.path !== currentPath && token.path.toLowerCase().includes(query))
      .slice(0, 10);
  }, [referenceQuery, availableTokens, currentPath]);

  // Show/hide suggestions based on query
  useEffect(() => {
    setShowSuggestions(referenceQuery !== null && suggestions.length > 0);
    setSelectedIndex(0);
  }, [referenceQuery, suggestions.length]);

  // Modal handlers
  const handleColorChange = useCallback((newColor: Color | null) => {
    if (newColor) {
      setLocalColor(newColor.toFormat('hsla'));
    }
  }, []);

  const handleModalSave = useCallback(() => {
    if (localColor) {
      const hexValue = colorToHex(localColor);
      if (hexValue !== value) {
        onCommit(hexValue);
      }
    }
    setIsOpen(false);
  }, [localColor, value, onCommit]);

  const handleModalCancel = useCallback(() => {
    setLocalColor(parsedDisplayColor);
    setIsOpen(false);
  }, [parsedDisplayColor]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // When opening, use the already-computed display color (handles references correctly)
        if (parsedDisplayColor) {
          setLocalColor(parsedDisplayColor.toFormat('hsla'));
        } else {
          // Default to black if no valid color can be parsed
          const defaultColor = safeParseColor('#000000');
          if (defaultColor) {
            setLocalColor(defaultColor.toFormat('hsla'));
          }
        }
      }
      setIsOpen(open);
    },
    [parsedDisplayColor]
  );

  // Inline input handlers
  const handleInputChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
  }, []);

  const handleInputBlur = useCallback(() => {
    setShowSuggestions(false);
    // Commit on blur if value changed and it's valid (hex or reference)
    if (localValue !== value) {
      if (isValidColorFormat(localValue) || isReference(localValue)) {
        onCommit(localValue);
      } else {
        // Revert invalid input
        setLocalValue(value);
      }
    }
  }, [localValue, value, onCommit]);

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
        } else if (localValue !== value && (isValidColorFormat(localValue) || isReference(localValue))) {
          onCommit(localValue);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setLocalValue(value);
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

  // Determine swatch background color
  const swatchColor = parsedDisplayColor ? displayColorValue : 'var(--spectrum-global-color-gray-300)';

  // Disabled state - just show swatch and value
  if (isDisabled) {
    return (
      <View padding="size-100">
        <Flex alignItems="center" gap="size-100">
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: swatchColor,
              border: '1px solid var(--spectrum-global-color-gray-400)',
              flexShrink: 0,
            }}
          />
          <Text UNSAFE_style={{ fontSize: 13 }}>{value}</Text>
        </Flex>
      </View>
    );
  }

  return (
    <View padding="size-100">
      <Flex alignItems="center" gap="size-100">
        {/* Swatch button - opens color picker modal */}
        <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
          <ActionButton
            isQuiet
            aria-label={`Open color picker for ${ariaLabel}`}
            UNSAFE_style={{ padding: 0, minWidth: 0, height: 'auto' }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: swatchColor,
                border: '1px solid var(--spectrum-global-color-gray-400)',
                flexShrink: 0,
                cursor: 'pointer',
              }}
              title="Click to open color picker"
            />
          </ActionButton>
          <Dialog>
            <Heading>Edit Color</Heading>
            <Content>
              <Flex direction="column" gap="size-200" width="size-2400">
                {localColor && (
                  <>
                    <ColorArea
                      value={localColor}
                      onChange={handleColorChange}
                      xChannel="saturation"
                      yChannel="lightness"
                      size="size-2400"
                    />
                    <ColorSlider channel="hue" value={localColor} onChange={handleColorChange} />
                    <ColorSlider channel="alpha" value={localColor} onChange={handleColorChange} />
                    <ColorField value={localColor} onChange={handleColorChange} label="Hex" />
                    <Flex gap="size-100" justifyContent="end" marginTop="size-200">
                      <ActionButton onPress={handleModalCancel} isQuiet>
                        Cancel
                      </ActionButton>
                      <ActionButton onPress={handleModalSave}>Apply</ActionButton>
                    </Flex>
                  </>
                )}
              </Flex>
            </Content>
          </Dialog>
        </DialogTrigger>

        {/* Inline text input with reference autocomplete */}
        <div style={{ position: 'relative', flex: 1 }}>
          <TextField
            aria-label={ariaLabel}
            width="100%"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
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
                      {token.type === 'color' && typeof token.value === 'string' && isValidColorFormat(token.value) && (
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            backgroundColor: token.value,
                            border: '1px solid var(--spectrum-global-color-gray-400)',
                          }}
                        />
                      )}
                      <View
                        paddingX="size-50"
                        paddingY="size-25"
                        backgroundColor={token.type === 'color' ? 'blue-400' : 'gray-200'}
                        borderRadius="regular"
                      >
                        <Text UNSAFE_style={{ fontSize: 10 }}>{token.type || 'unknown'}</Text>
                      </View>
                      <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
                        {typeof token.value === 'string' && token.value.length > 20
                          ? `${token.value.substring(0, 20)}...`
                          : String(token.value)}
                      </Text>
                    </Flex>
                  </Flex>
                </div>
              ))}
            </div>
          )}
        </div>
      </Flex>
    </View>
  );
});

/**
 * Check if a token row should use the color picker
 */
export function shouldUseColorPicker(type: string, value: unknown): boolean {
  // Check explicit type
  if (type === 'color') return true;

  // Check if value looks like a color (hex format)
  if (typeof value === 'string' && isValidColorFormat(value)) {
    return true;
  }

  return false;
}

// Export for use in other components
export { isValidColorFormat };
