import React from 'react';
import { Task } from '@/types';
import { formatDurationCompact } from '@/lib/time';
import { Trash2, AlertTriangle, Archive, X } from 'lucide-react';

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
  if (!isOpen || !task) return null;

  const totalLogged = task.totalDurationSeconds || 0;
  const entryCount = task.timeEntries?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 relative select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Delete Task?
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Confirm how you would like to handle this task.
            </p>
          </div>
        </div>

        {/* Task Details Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 mb-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {task.title}
          </p>
          {totalLogged > 0 ? (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-amber-700 dark:text-amber-400">
              <span className="font-medium">⚠️ Tracked Time:</span>
              <span className="font-mono font-bold">{formatDurationCompact(totalLogged)}</span>
              <span>({entryCount} {entryCount === 1 ? 'session' : 'sessions'})</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              No time tracked on this task.
            </p>
          )}
        </div>

        {totalLogged > 0 && (
          <p className="text-xs text-slate-600 dark:text-neutral-400 mb-5 leading-relaxed">
            Deleting permanently will wipe this task and all its recorded work hours from your database and accomplishment reports.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {/* Archive option if task has hours */}
          {totalLogged > 0 && (
            <button
              onClick={() => onArchive(task.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold transition"
              title="Hide from active board but keep hours in reports"
            >
              <Archive className="w-4 h-4 text-indigo-500" />
              <span>Archive (Keep Hours)</span>
            </button>
          )}

          {/* Delete Permanently button */}
          <button
            onClick={() => onConfirmPermanentDelete(task.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Permanently</span>
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-xs font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
