import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { formatDurationCompact } from '@/lib/time';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { Trash2, Archive, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DeleteConfirmationModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPermanentDelete: (taskId: string) => void;
  onArchive: (taskId: string) => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirmPermanentDelete,
  onArchive,
}) => {
  const { shouldRender, isEntered } = useModalAnimation(isOpen, { onClose });
  const [cachedTask, setCachedTask] = useState<Task | null>(task);

  useEffect(() => {
    if (task) {
      setCachedTask(task);
    }
  }, [task]);

  const displayTask = task || cachedTask;

  if (!shouldRender || !displayTask) return null;

  const totalLogged = displayTask.totalDurationSeconds || 0;
  const entryCount = displayTask.timeEntries?.length || 0;
  const hasTrackedTime = totalLogged > 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-200 ${
        isEntered ? 'opacity-100 ease-out' : 'opacity-0 ease-in pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden transition-all duration-200 ${
          isEntered
            ? 'opacity-100 scale-100 translate-y-0 ease-out'
            : 'opacity-0 scale-95 translate-y-2 ease-in'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800/80 bg-slate-50/80 dark:bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {hasTrackedTime ? 'Manage or Delete Task' : 'Delete Task'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                {hasTrackedTime
                  ? 'This task contains recorded work hours'
                  : 'Permanently remove from your tracker'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-slate-200/50 dark:hover:bg-neutral-800 transition"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Identification Section */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800">
                {displayTask.category}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                {displayTask.location}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white break-words line-clamp-2">
              {displayTask.title}
            </p>

            {/* Time metric banner */}
            {hasTrackedTime ? (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Recorded Work</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-neutral-200 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                  {formatDurationCompact(totalLogged)} ({entryCount} {entryCount === 1 ? 'entry' : 'entries'})
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Decision Area */}
        <div className="p-5 space-y-2.5">
          {hasTrackedTime ? (
            <>
              {/* Option 1: Archive (Recommended) */}
              <button
                onClick={() => {
                  onArchive(displayTask.id);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 transition group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Archive Task
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Removes from your active board, but keeps all {formatDurationCompact(totalLogged)} in accomplishment reports and timesheets.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Delete Permanently */}
              <button
                onClick={() => {
                  onConfirmPermanentDelete(displayTask.id);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/30 transition group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-200 dark:border-rose-900/50 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Delete Permanently
                      </span>
                      <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        Irreversible
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Completely wipes this task and all {formatDurationCompact(totalLogged)} of logged time from the database.
                    </p>
                  </div>
                </div>
              </button>
            </>
          ) : (
            /* Clean single destructive choice when no hours were recorded */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Are you sure you want to permanently delete this task? This action cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onConfirmPermanentDelete(displayTask.id);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Footer cancel button for the two-option layout */}
          {hasTrackedTime ? (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
