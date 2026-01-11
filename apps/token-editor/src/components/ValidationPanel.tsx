import { useAppStore } from '../store';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@aro-studio/ui';

export function ValidationPanel() {
  const { validationIssues } = useAppStore();

  const errors = validationIssues.filter((issue) => issue.severity === 'error');
  const warnings = validationIssues.filter((issue) => issue.severity === 'warning');

  if (validationIssues.length === 0) {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Validation</h3>
        <div className="text-sm text-muted-foreground">No validation issues</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-foreground">Validation</h3>

      {errors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="font-medium text-destructive">Errors ({errors.length})</span>
          </div>
          <div className="space-y-2">
            {errors.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  'p-2 rounded text-sm border border-destructive/20 bg-destructive/10'
                )}
              >
                <div className="font-mono text-xs text-muted-foreground mb-1">
                  {issue.path || '<root>'}
                </div>
                <div className="text-foreground">{issue.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-600">Warnings ({warnings.length})</span>
          </div>
          <div className="space-y-2">
            {warnings.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  'p-2 rounded text-sm border border-amber-600/20 bg-amber-600/10'
                )}
              >
                <div className="font-mono text-xs text-muted-foreground mb-1">
                  {issue.path || '<root>'}
                </div>
                <div className="text-foreground">{issue.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

