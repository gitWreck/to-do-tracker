import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { formatDuration, formatDurationCompact, getTaskDateSpan } from '@/lib/time';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
  CheckCircle2,
  X,
  Clock,
  Calendar,
} from 'lucide-react';

interface CommitCompletionModalProps {
  task: Task | null;
  project?: Project;
  activeTimerSeconds?: number;
  isTimerRunningOnTask: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCommit: (taskId: string, options: { note?: string; additionalSeconds?: number }) => void;
}

export const CommitCompletionModal: React.FC<CommitCompletionModalProps> = ({
  task,
  project,
  activeTimerSeconds = 0,
  isTimerRunningOnTask,
  isOpen,
  onClose,
  onCommit,
}) => {
  const { shouldRender, isEntered } = useModalAnimation(isOpen, { onClose });
  const [cachedTask, setCachedTask] = useState<Task | null>(task);
  const [cachedProject, setCachedProject] = useState<typeof project>(project);

  const [note, setNote] = useState(task?.completionNote || '');
  const [extraMinutes, setExtraMinutes] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setCachedTask(task);
      setNote(task.completionNote || '');
      setExtraMinutes(0);
    }
    if (project) {
      setCachedProject(project);
    }
  }, [task, project]);

  const displayTask = task || cachedTask;
  const displayProject = project || cachedProject;

  if (!shouldRender || !displayTask) return null;

  const dateSpan = displayTask ? getTaskDateSpan(displayTask) : null;

  // Calculate estimated final duration
  const baseSeconds = isTimerRunningOnTask
    ? activeTimerSeconds
    : (displayTask.totalDurationSeconds || 0);
  const totalWithExtra = baseSeconds + extraMinutes * 60;

  const handleAddMinutes = (mins: number) => {
    setExtraMinutes(prev => Math.max(0, prev + mins));
  };

  const handleRoundTo15Mins = () => {
    const currentMins = Math.ceil(baseSeconds / 60);
    const remainder = currentMins % 15;
    if (remainder === 0) return;
    const toAdd = 15 - remainder;
    setExtraMinutes(toAdd);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayTask) return;
    onCommit(displayTask.id, {
      note: note.trim() || undefined,
      additionalSeconds: extraMinutes * 60,
    });
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-200 ${isEntered ? 'opacity-100 ease-out' : 'opacity-0 ease-in pointer-events-none'
        }`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-all duration-200 ${isEntered
            ? 'opacity-100 scale-100 translate-y-0 ease-out'
            : 'opacity-0 scale-95 translate-y-2 ease-in'
          }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Commit Task Completion
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Review time tracking and add accomplishment deliverables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* Task Info Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/80">
            <div className="flex items-center gap-2 mb-1">
              {displayProject && (
                <span
                  className="px-2 py-0.5 text-[11px] font-semibold rounded text-white"
                  style={{ backgroundColor: displayProject.color }}
                >
                  {displayProject.name}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 bg-slate-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {displayTask.category}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                &bull; {displayTask.location}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-neutral-100 mt-1">
              {displayTask.title}
            </h3>
            {dateSpan && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-neutral-800 flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-[11px]">Timeline:</span>
                <span
                  title={dateSpan.tooltip}
                  className={`text-[11px] font-medium ${dateSpan.isMultiDay
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-neutral-300'
                    }`}
                >
                  {dateSpan.display}
                </span>
              </div>
            )}
          </div>

          {/* Time Tracking & Log Review */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider text-[11px]">
                Time Commitment
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Final: {formatDurationCompact(totalWithExtra)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {isTimerRunningOnTask ? 'Currently Running Stopwatch:' : 'Total Tracked Time:'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {isTimerRunningOnTask ? formatDuration(activeTimerSeconds) : formatDurationCompact(baseSeconds)}
                </span>
              </div>

              {isTimerRunningOnTask && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-tight">
                  Committing will automatically stop the running timer and log this session into your accomplishment history.
                </p>
              )}

              {/* Quick Adjust Buttons */}
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium mr-1">Quick adjust:</span>
                <button
                  type="button"
                  onClick={() => handleAddMinutes(5)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-emerald-500 transition"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMinutes(15)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-emerald-500 transition"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMinutes(30)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-emerald-500 transition"
                >
                  +30m
                </button>
                <button
                  type="button"
                  onClick={handleRoundTo15Mins}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-emerald-500 transition"
                  title="Round up total to the nearest 15-minute interval"
                >
                  Round to 15m
                </button>
                {extraMinutes > 0 && (
                  <button
                    type="button"
                    onClick={() => setExtraMinutes(0)}
                    className="text-[10px] text-red-500 hover:underline ml-auto"
                  >
                    Reset ({extraMinutes}m added)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Accomplishment / Deliverables Note */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
              Accomplishment Deliverable / Note <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Deployed API endpoint, drafted review feedback, completed draft..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition"
            />
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
              Included in your official Weekly Accomplishment Report and CSV export.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Keep Pending (Cancel)
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Commit & Mark Done</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
