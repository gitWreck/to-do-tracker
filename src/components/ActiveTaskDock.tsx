import React from 'react';
import { useTasks } from '@/context/TaskContext';
import { formatDuration, formatDurationCompact, getTodayDateString } from '@/lib/time';
import {
  Play,
  Square,
  CheckCircle2,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Clock,
  Briefcase,
  Flame
} from 'lucide-react';

interface ActiveTaskDockProps {
  onOpenCreateModal: () => void;
  onOpenRetroModal: () => void;
  onOpenReportModal: () => void;
  onTogglePip: () => void;
  isPipActive: boolean;
}

export const ActiveTaskDock: React.FC<ActiveTaskDockProps> = ({
  onOpenCreateModal,
  onOpenRetroModal,
  onOpenReportModal,
  onTogglePip,
  isPipActive,
}) => {
  const { activeTask, activeTimer, stopTimer, toggleTaskComplete, projects, tasks } = useTasks();

  // Project for active task
  const activeProject = projects.find(p => p.id === activeTask?.projectId);

  // Calculate today's stats
  const todayStr = getTodayDateString();
  const todayCompletedCount = tasks.filter(
    t => t.status === 'COMPLETED' && t.completedAt && t.completedAt.startsWith(todayStr)
  ).length;

  // Calculate total seconds logged today across all tasks
  let todayTotalSeconds = 0;
  tasks.forEach(t => {
    (t.timeEntries || []).forEach(e => {
      if (e.date === todayStr) {
        todayTotalSeconds += e.durationSeconds;
      }
    });
  });
  if (activeTimer) {
    todayTotalSeconds += activeTimer.elapsedSeconds;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 py-2.5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Task or Idle Status */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {activeTask && activeTimer ? (
            <div className="flex items-center gap-3 bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-3.5 py-1.5 shadow-inner max-w-xl truncate">
              {/* Pulsing indicator */}
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>

              {/* Project Badge */}
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded-md text-white flex-shrink-0"
                style={{ backgroundColor: activeProject?.color || '#3b82f6' }}
              >
                {activeProject?.name || 'General'}
              </span>

              {/* Task Title */}
              <span className="font-medium text-sm text-neutral-100 truncate" title={activeTask.title}>
                {activeTask.title}
              </span>

              {/* Live Timer */}
              <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums px-2 py-0.5 bg-neutral-950/60 rounded border border-emerald-500/20 flex-shrink-0">
                {formatDuration(activeTimer.elapsedSeconds)}
              </div>

              {/* Quick Actions for active task */}
              <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
                <button
                  onClick={stopTimer}
                  title="Pause / Stop Timer"
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
                >
                  <Square className="w-4 h-4 fill-current text-amber-400" />
                </button>
                <button
                  onClick={() => toggleTaskComplete(activeTask.id)}
                  title="Mark Task Completed"
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 hover:text-emerald-300" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-neutral-400 text-sm bg-neutral-950/40 px-3.5 py-1.5 rounded-xl border border-neutral-800">
              <Clock className="w-4 h-4 text-neutral-500" />
              <span>No timer running. Select a task below to start tracking.</span>
            </div>
          )}

          {/* Today's Quick Summary Metric */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-neutral-400 border-l border-neutral-800 pl-3">
            <span className="flex items-center gap-1 font-medium text-neutral-300">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Today: <span className="text-white font-mono">{formatDurationCompact(todayTotalSeconds)}</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Done: <span className="text-white font-semibold">{todayCompletedCount}</span>
            </span>
          </div>
        </div>

        {/* Right: Functional Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Always-on-top Mini-Widget button */}
          <button
            onClick={onTogglePip}
            title={isPipActive ? 'Close Floating Mini-Widget' : 'Pop out Always-On-Top Floating Mini-Widget'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              isPipActive
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mini Widget</span>
          </button>

          {/* Log Past Work (Retroactive modal) */}
          <button
            onClick={onOpenRetroModal}
            title="Log past hours retroactively"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Log Past Work</span>
          </button>

          {/* Accomplishment Report & CSV Export */}
          <button
            onClick={onOpenReportModal}
            title="Export Government Accomplishment Report & CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-100 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report & CSV</span>
          </button>

          {/* New Task Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
