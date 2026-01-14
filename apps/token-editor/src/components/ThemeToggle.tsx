import { ToggleButton, Text } from '@adobe/react-spectrum';
import { Moon, Sun } from 'lucide-react';

type ColorScheme = 'light' | 'dark';

interface ThemeToggleProps {
  colorScheme: ColorScheme;
  onChange: (scheme: ColorScheme) => void;
}

export function ThemeToggle({ colorScheme, onChange }: ThemeToggleProps) {
  const isDark = colorScheme === 'dark';

  return (
    <ToggleButton
      aria-label="Toggle theme"
      isSelected={isDark}
      onChange={(selected) => onChange(selected ? 'dark' : 'light')}
    >
      {isDark ? <Moon size={14} /> : <Sun size={14} />}
      <Text>{isDark ? 'Dark' : 'Light'}</Text>
    </ToggleButton>
  );
}
