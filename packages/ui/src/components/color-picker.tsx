import { useState, useCallback } from 'react';
import {
  ColorPicker as AriaColorPicker,
  ColorArea,
  ColorSlider,
  ColorThumb,
  SliderTrack,
} from 'react-aria-components';
import type { Color } from '@react-stately/color';
import { parseColor } from 'react-aria-components';
import { cn } from '../utils/cn';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [color, setColor] = useState<Color>(() => {
    try {
      return parseColor(value).toFormat('hsb');
    } catch {
      return parseColor('#000000').toFormat('hsb');
    }
  });

  const [hexInput, setHexInput] = useState(() => {
    const hexStr = parseColor(value).toString('hex');
    return (hexStr.startsWith('#') ? hexStr : '#' + hexStr).toUpperCase();
  });

  const handleColorChange = useCallback(
    (newColor: Color) => {
      setColor(newColor);
      const hexStr = newColor.toString('hex');
      const finalHex = (hexStr.startsWith('#') ? hexStr : '#' + hexStr).toUpperCase();
      setHexInput(finalHex);
      onChange(finalHex);
    },
    [onChange]
  );

  const handleHexInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setHexInput(inputValue);

      // Try to parse and update color if valid hex
      const hex = inputValue.startsWith('#') ? inputValue : '#' + inputValue;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        try {
          const newColor = parseColor(hex).toFormat('hsb');
          setColor(newColor);
          onChange(hex.toUpperCase());
        } catch {
          // Invalid color, don't update
        }
      }
    },
    [onChange]
  );

  const thumbStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 0 1px black, inset 0 0 0 1px black',
    boxSizing: 'border-box',
  };

  return (
    <div
      className={cn(
        'p-3 bg-background border border-border rounded-lg shadow-lg',
        className
      )}
    >
      <AriaColorPicker value={color} onChange={handleColorChange}>
        {/* Color Area - Saturation/Brightness */}
        <ColorArea
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
          style={{
            width: 192,
            height: 192,
            borderRadius: 4,
          }}
        >
          <ColorThumb style={thumbStyle} />
        </ColorArea>

        {/* Hue Slider */}
        <ColorSlider
          colorSpace="hsb"
          channel="hue"
          style={{ width: 192, marginTop: 12 }}
        >
          <SliderTrack
            style={{
              height: 16,
              width: '100%',
              borderRadius: 4,
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
          >
            <ColorThumb style={thumbStyle} />
          </SliderTrack>
        </ColorSlider>

        {/* Alpha Slider */}
        <ColorSlider
          colorSpace="hsb"
          channel="alpha"
          style={{ width: 192, marginTop: 8 }}
        >
          <SliderTrack
            style={{
              height: 16,
              width: '100%',
              borderRadius: 4,
              backgroundImage: `
                linear-gradient(to right, transparent, ${color.toString('css')}),
                repeating-conic-gradient(#e6e6e6 0% 25%, white 0% 50%)
              `,
              backgroundSize: '100% 100%, 8px 8px',
            }}
          >
            <ColorThumb style={thumbStyle} />
          </SliderTrack>
        </ColorSlider>
      </AriaColorPicker>

      {/* Hex Input */}
      <div className="mt-3 flex items-center gap-2">
        <span className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground">
          Hex
        </span>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
