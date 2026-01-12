import { cn } from '@aro-studio/ui';
import type { ReactNode } from 'react';

interface ChromeBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function ChromeBar({ left, center, right, className }: ChromeBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 border-b border-border bg-background/90 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">{left}</div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">{center}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

interface ChromeStatusProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function ChromeStatus({ left, right, className }: ChromeStatusProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-1 border-t border-border text-[11px] text-muted-foreground bg-background/90 backdrop-blur-sm',
        className
      )}
    >
      <div className="min-w-0">{left}</div>
      <div className="min-w-0 text-right">{right}</div>
    </div>
  );
}
