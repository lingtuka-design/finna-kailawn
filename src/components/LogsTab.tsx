import React from 'react';
import { Terminal, RefreshCw, Trash2, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { SyncLog } from '../types';

interface LogsTabProps {
  logs: SyncLog[];
  onRefresh: () => void;
  onClear: () => Promise<void>;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onRefresh, onClear }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Activity & Automation Logs</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time execution log of source syncs, AI translations, and Facebook publications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground">No activity logs recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden font-mono text-xs shadow-sm">
          {logs.map((log) => {
            const timeStr = new Date(log.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const dateStr = new Date(log.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={log.id} className="p-3.5 hover:bg-secondary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="uppercase tracking-wider px-1.5 py-0.2 rounded bg-secondary text-[10px] text-foreground font-semibold border border-border">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-foreground font-medium">
                          {log.message}
                        </span>
                      </div>

                      {log.details && (
                        <p className="text-[11px] text-muted-foreground font-sans break-all">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {dateStr} {timeStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
