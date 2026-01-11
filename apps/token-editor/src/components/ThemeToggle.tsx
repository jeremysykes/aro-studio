import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@aro-studio/ui';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  const theme: Theme =
    stored === 'light' || stored === 'dark' ? stored : 'light';
  // Apply immediately to prevent flash
  document.documentElement.classList.toggle('dark', theme === 'dark');
  return theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      aria-label='Toggle theme'
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Sun className='h-4 w-4' />
      ) : (
        <Moon className='h-4 w-4' />
      )}
    </Button>
  );
}
