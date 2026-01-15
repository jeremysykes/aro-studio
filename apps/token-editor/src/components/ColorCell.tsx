import { memo, useState, useCallback, useMemo } from 'react';
import { Flex, View, Text, DialogTrigger, Dialog, ActionButton, Content, Heading } from '@adobe/react-spectrum';
import { ColorArea, ColorSlider, ColorField, parseColor, Color } from '@adobe/react-spectrum';

interface ColorCellProps {
  value: string;
  onCommit: (value: string) => void;
  isDisabled: boolean;
  ariaLabel: string;
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
 * Format a color value for display in the table
 * Shows "#RRGGBB (XX%)" format when alpha is not 100%
 */
function formatColorDisplay(color: Color): string {
  const alpha = color.getChannelValue('alpha');
  const hex = color.toString('hex'); // Always 6-digit
  if (alpha < 1) {
    const percent = Math.round(alpha * 100);
    return `${hex} (${percent}%)`;
  }
  return hex;
}

export const ColorCell = memo(function ColorCell({ value, onCommit, isDisabled, ariaLabel }: ColorCellProps) {
  const parsedColor = useMemo(() => safeParseColor(value), [value]);
  const [localColor, setLocalColor] = useState<Color | null>(parsedColor);
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = useCallback((newColor: Color | null) => {
    if (newColor) {
      // Convert to HSLA so ColorArea/ColorSlider can access hue/saturation/lightness
      setLocalColor(newColor.toFormat('hsla'));
    }
  }, []);

  const handleSave = useCallback(() => {
    if (localColor) {
      const hexValue = colorToHex(localColor);
      if (hexValue !== value) {
        onCommit(hexValue);
      }
    }
    setIsOpen(false);
  }, [localColor, value, onCommit]);

  const handleCancel = useCallback(() => {
    setLocalColor(parsedColor);
    setIsOpen(false);
  }, [parsedColor]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && parsedColor) {
        // Ensure HSLA format when dialog opens
        setLocalColor(parsedColor.toFormat('hsla'));
      }
      setIsOpen(open);
    },
    [parsedColor]
  );

  // If color can't be parsed, show as text input fallback
  if (!parsedColor) {
    return (
      <View padding="size-100">
        <Text UNSAFE_style={{ fontSize: 13 }}>{value}</Text>
        <Text UNSAFE_style={{ fontSize: 11, color: 'var(--spectrum-global-color-gray-600)' }}>
          (Invalid color format)
        </Text>
      </View>
    );
  }

  // Format for display: "#RRGGBB (XX%)" when alpha < 100%
  const displayValue = formatColorDisplay(parsedColor);

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
              backgroundColor: value,
              border: '1px solid var(--spectrum-global-color-gray-400)',
              flexShrink: 0,
            }}
          />
          <Text UNSAFE_style={{ fontSize: 13 }}>{displayValue}</Text>
        </Flex>
      </View>
    );
  }

  return (
    <View padding="size-100">
      <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
        <ActionButton isQuiet aria-label={ariaLabel} UNSAFE_style={{ padding: 0, minWidth: 0, height: 'auto' }}>
          <Flex alignItems="center" gap="size-100">
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: value,
                border: '1px solid var(--spectrum-global-color-gray-400)',
                flexShrink: 0,
              }}
            />
            <Text UNSAFE_style={{ fontSize: 13 }}>{displayValue}</Text>
          </Flex>
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
                    <ActionButton onPress={handleCancel} isQuiet>
                      Cancel
                    </ActionButton>
                    <ActionButton onPress={handleSave}>Apply</ActionButton>
                  </Flex>
                </>
              )}
            </Flex>
          </Content>
        </Dialog>
      </DialogTrigger>
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
