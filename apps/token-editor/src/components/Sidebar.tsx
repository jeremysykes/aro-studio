import { useAppStore } from '../store';
import { ChevronRight } from 'lucide-react';
import { cn } from '@aro-studio/ui';

export function Sidebar() {
  const {
    businessUnits,
    coreEntries,
    selectedBU,
    selectedCore,
    selectedCoreFile,
    setSelectedBU,
    setSelectedCore,
  } = useAppStore();

  return (
    <div className="p-4 space-y-6">
      {/* Core section */}
      {coreEntries.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Core
          </h2>
          <div className="space-y-1">
            {coreEntries.map((entry) => (
              <div key={entry.name}>
                <button
                  onClick={() => setSelectedCore(entry.name)}
                  className={cn(
                    'w-full text-left px-2 py-1 rounded text-sm flex items-center justify-between',
                    selectedCore === entry.name
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-foreground'
                  )}
                >
                  <span>{entry.name}</span>
                  {selectedCore === entry.name && <ChevronRight className="w-4 h-4" />}
                </button>
                {selectedCore === entry.name && (
                  <div className="ml-4 mt-1 space-y-1">
                    {entry.files.map((file) => (
                      <button
                        key={file}
                        onClick={() => setSelectedCore(entry.name, file as string)}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded text-xs flex items-center',
                          selectedCoreFile === file
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-accent/50 text-muted-foreground'
                        )}
                      >
                        {file}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Units section */}
      {businessUnits.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Business Units
          </h2>
          <div className="space-y-1">
            {businessUnits.map((bu) => (
              <button
                key={bu.name}
                onClick={() => setSelectedBU(bu.name)}
                className={cn(
                  'w-full text-left px-2 py-1 rounded text-sm',
                  selectedBU === bu.name
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-accent/50 text-foreground'
                )}
              >
                {bu.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

