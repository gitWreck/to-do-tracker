import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { useTasks } from '@/context/TaskContext';
import { formatDuration, formatDurationCompact, getTaskDateSpan } from '@/lib/time';
import {
  Play,
  Pause,
  Check,
  Trash2,
  Pencil,
  Building2,
  Home,
  Compass,
  Hash,
  Clock,
  Calendar,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project?: Project;
  variant?: 'list' | 'grid';
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, project, variant = 'list' }) => {
  const {
    activeTimer,
    startTimer,
    stopTimer,
    toggleTaskComplete,
    updateTask,
    deleteTask,
  } = useTasks();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const isCurrentTaskRunning = activeTimer?.taskId === task.id;
  const isCompleted = task.status === 'COMPLETED';
  const dateSpan = getTaskDateSpan(task);

  // Total duration including live active timer elapsed seconds if this task is active
  const totalSeconds = isCurrentTaskRunning && activeTimer
    ? activeTimer.elapsedSeconds
    : (task.totalDurationSeconds || 0);

  const DateBadge = (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
        dateSpan.isMultiDay
          ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800/70 shadow-2xs'
          : 'text-slate-400 dark:text-neutral-500'
      }`}
      title={dateSpan.tooltip}
    >
      <Calendar
        className={`w-3 h-3 flex-shrink-0 ${
          dateSpan.isMultiDay ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-neutral-500'
        }`}
      />
      <span>{dateSpan.display}</span>
    </span>
  );

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim()) {
      updateTask(task.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-900/60 uppercase tracking-wider">
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 uppercase tracking-wider">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700/60">
            Med
          </span>
        );
      case 'LOW':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-normal rounded-md bg-slate-50 text-slate-500 dark:bg-neutral-900 dark:text-neutral-400 border border-slate-200/60 dark:border-neutral-800">
            Low
          </span>
        );
    }
  };

  const getLocationBadge = (location: Task['location']) => {
    switch (location) {
      case 'OFFICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 px-1.5 py-0.5 rounded-md font-medium">
            <Building2 className="w-3 h-3" />
            <span>Office</span>
          </span>
        );
      case 'HOME':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 px-1.5 py-0.5 rounded-md font-medium">
            <Home className="w-3 h-3" />
            <span>Home</span>
          </span>
        );
      case 'FIELD':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 px-1.5 py-0.5 rounded-md font-medium">
            <Compass className="w-3 h-3" />
            <span>Field</span>
          </span>
        );
    }
  };

  // -----------------------------------------------------------------
  // LEFT-SIDE CHECKBOX COMPONENT
  // -----------------------------------------------------------------
  const CheckboxIcon = (
    <button
      onClick={() => toggleTaskComplete(task.id)}
      className={`relative group/check flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-150 flex-shrink-0 cursor-pointer shadow-2xs ${isCompleted
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs shadow-emerald-500/25 scale-100'
          : 'border-slate-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-neutral-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
        }`}
      title={isCompleted ? 'Click to reopen task' : 'Mark as completed (Review & Commit)'}
    >
      {isCompleted ? (
        <Check className="w-3.5 h-3.5 stroke-[2.75]" />
      ) : (
        <Check className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover/check:opacity-60 transition-opacity stroke-[2]" />
      )}
    </button>
  );

  // -----------------------------------------------------------------
  // TIMER CONTROL (Play/Pause/Time duration pill)
  // -----------------------------------------------------------------
  const TimerControl = (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {/* Live stopwatch running state */}
      {isCurrentTaskRunning && activeTimer ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 shadow-xs shadow-emerald-500/10 animate-pulse">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatDuration(activeTimer.elapsedSeconds)}
          </span>
          <button
            onClick={stopTimer}
            title="Pause Stopwatch"
            className="w-5 h-5 ml-0.5 rounded-full flex items-center justify-center bg-emerald-200/80 dark:bg-emerald-900/80 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/60 dark:hover:text-amber-300 text-emerald-800 dark:text-emerald-300 transition shadow-2xs cursor-pointer"
          >
            <Pause className="w-2.5 h-2.5 fill-current" />
          </button>
        </div>
      ) : totalSeconds > 0 ? (
        /* Idle with previously recorded time */
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-neutral-700/60">
            <Clock className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
            {formatDurationCompact(totalSeconds)}
          </span>
          {!isCompleted && (
            <button
              onClick={() => startTimer(task.id)}
              title="Resume Timer on this task"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800/90 dark:hover:bg-emerald-600 dark:hover:text-white text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700/70 transition-colors shadow-2xs cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </button>
          )}
        </div>
      ) : (
        /* Idle with 0 seconds */
        !isCompleted && (
          <button
            onClick={() => startTimer(task.id)}
            title="Start Timer on this task"
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800/80 dark:hover:bg-emerald-600 dark:hover:text-white text-slate-400 dark:text-neutral-500 border border-slate-200 dark:border-neutral-700/60 transition-colors shadow-2xs cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </button>
        )
      )}
    </div>
  );

  // -----------------------------------------------------------------
  // QUICK ACTION ICONS: Edit & Delete
  // -----------------------------------------------------------------
  const QuickActions = (
    <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
      <button
        onClick={() => setIsEditingTitle(true)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-neutral-500 dark:hover:text-indigo-400 dark:hover:bg-neutral-800 transition cursor-pointer"
        title="Edit Title"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => deleteTask(task.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
        title="Delete Task"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // -------------------------------------------------------------
  // GRID / CARD STYLE VARIANT
  // -------------------------------------------------------------
  if (variant === 'grid') {
    return (
      <div
        className={`group relative rounded-2xl border flex flex-col justify-between transition-all duration-150 p-4 overflow-hidden ${isCurrentTaskRunning
            ? 'bg-emerald-50/70 dark:bg-neutral-900/95 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
            : isCompleted
              ? 'bg-slate-50/80 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-80'
              : 'bg-white hover:bg-slate-50/90 dark:bg-neutral-900/70 dark:hover:bg-neutral-900/95 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs'
          }`}
      >
        {/* Left vertical color accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: project?.color || '#3b82f6' }}
        />

        {/* Card Header: Project badge, category, priority, and quick actions */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 truncate pl-1">
              {project && (
                <span
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-white flex-shrink-0 shadow-2xs"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
                {task.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {getPriorityBadge(task.priority)}
              {QuickActions}
            </div>
          </div>

          {/* Card Title & Checkbox Row */}
          <div className="flex items-start gap-2.5 mb-2 pl-1">
            <div className="mt-0.5">{CheckboxIcon}</div>

            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    autoFocus
                    onBlur={handleTitleSubmit}
                    className="flex-1 px-2 py-1 text-sm bg-white dark:bg-neutral-950 border border-indigo-500 rounded text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button type="submit" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Done
                  </button>
                </form>
              ) : (
                <h4
                  onDoubleClick={() => setIsEditingTitle(true)}
                  className={`text-sm font-semibold leading-snug cursor-pointer select-text ${isCompleted
                      ? 'line-through text-slate-400 dark:text-neutral-500'
                      : 'text-slate-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
                    }`}
                >
                  {task.title}
                </h4>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 mb-3 pl-8">
              {task.description}
            </p>
          )}

          {/* Location & Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 pl-1">
            {getLocationBadge(task.location)}
            {task.tags &&
              task.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-neutral-700/50"
                >
                  <Hash className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-500" />
                  {tag}
                </span>
              ))}
          </div>
        </div>

        {/* Card Footer: Date on left, Timer on right */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-2 mt-auto pl-1">
          {DateBadge}
          {TimerControl}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST STYLE VARIANT (Default)
  // -------------------------------------------------------------
  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150 overflow-hidden ${isCurrentTaskRunning
          ? 'bg-emerald-50/70 dark:bg-neutral-900/95 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
          : isCompleted
            ? 'bg-slate-50/70 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-80'
            : 'bg-white hover:bg-slate-50/90 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/90 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs'
        }`}
    >
      {/* Left vertical color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: project?.color || '#3b82f6' }}
      />

      <div className="p-3.5 pl-4 flex items-center gap-3.5">
        {/* Left-side Checkbox */}
        <div className="flex-shrink-0">{CheckboxIcon}</div>

        {/* Center Task Details */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Project, Category, Location, Priority */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {project && (
              <span
                className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-white flex-shrink-0 shadow-2xs"
                style={{ backgroundColor: project.color }}
              >
                {project.name}
              </span>
            )}

            <span className="text-[11px] font-medium text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
              {task.category}
            </span>

            {getLocationBadge(task.location)}
            {getPriorityBadge(task.priority)}

            {/* Created or completed date indicator */}
            <div className="ml-auto hidden sm:flex items-center">
              {DateBadge}
            </div>
          </div>

          {/* Title Row */}
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                autoFocus
                onBlur={handleTitleSubmit}
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-neutral-950 border border-indigo-500 rounded text-slate-900 dark:text-white focus:outline-none"
              />
              <button type="submit" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                Done
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                className={`text-sm font-semibold leading-snug cursor-pointer select-text truncate ${isCompleted
                    ? 'line-through text-slate-400 dark:text-neutral-500'
                    : 'text-slate-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
                  }`}
                title={task.title}
              >
                {task.title}
              </span>

              {task.completionNote && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40 truncate max-w-xs">
                  ✓ {task.completionNote}
                </span>
              )}
            </div>
          )}

          {/* Description or Notes if present */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {task.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/60 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-neutral-700/50"
                >
                  <Hash className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-500" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right-side Stopwatch, Duration Capsule & Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {TimerControl}
          {QuickActions}
        </div>
      </div>
    </div>
  );
};
