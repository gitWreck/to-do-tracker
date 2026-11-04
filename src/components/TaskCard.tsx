import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { useTasks } from '@/context/TaskContext';
import { formatDuration, formatDurationCompact } from '@/lib/time';
import {
  Play,
  Square,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Building2,
  Home,
  Compass,
  Hash,
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

  // Total duration including live active timer elapsed seconds if this task is active
  const totalSeconds =
    (task.totalDurationSeconds || 0) + (isCurrentTaskRunning && activeTimer ? activeTimer.elapsedSeconds : 0);

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
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-800">URGENT</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">MED</span>;
      case 'LOW':
        return <span className="px-1.5 py-0.5 text-[10px] font-normal rounded bg-slate-100 text-slate-500 dark:bg-neutral-900 dark:text-neutral-400">LOW</span>;
    }
  };

  const getLocationIcon = (location: Task['location']) => {
    switch (location) {
      case 'OFFICE':
        return (
          <span className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 px-1.5 py-0.5 rounded">
            <Building2 className="w-3 h-3" />
            <span>Office</span>
          </span>
        );
      case 'HOME':
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-1.5 py-0.5 rounded">
            <Home className="w-3 h-3" />
            <span>Home</span>
          </span>
        );
      case 'FIELD':
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-1.5 py-0.5 rounded">
            <Compass className="w-3 h-3" />
            <span>Field</span>
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // GRID / CARD STYLE VARIANT
  // -------------------------------------------------------------
  if (variant === 'grid') {
    return (
      <div
        className={`group relative rounded-2xl border flex flex-col justify-between transition-all duration-150 p-4 ${
          isCurrentTaskRunning
            ? 'bg-emerald-50/70 dark:bg-neutral-900/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
            : isCompleted
            ? 'bg-slate-50 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-75'
            : 'bg-white hover:bg-slate-50/90 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/90 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs'
        }`}
      >
        {/* Top Badges Row */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 truncate">
              {project && (
                <span
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-white flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded">
                {task.category}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {getPriorityBadge(task.priority)}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 rounded transition"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                autoFocus
                onBlur={handleTitleSubmit}
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-neutral-950 border border-indigo-500 rounded text-slate-900 dark:text-white focus:outline-none"
              />
              <button type="submit" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Done
              </button>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                className={`text-sm font-semibold leading-snug cursor-pointer select-text ${
                  isCompleted ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition p-0.5 mt-0.5"
                title="Edit Title"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Tags & Location */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {getLocationIcon(task.location)}
            {task.tags && task.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700/50"
              >
                <Hash className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-500" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer: Checkbox + Live Stopwatch Controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-2 mt-auto">
          {/* Checkbox */}
          <button
            onClick={() => toggleTaskComplete(task.id)}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-500 dark:text-neutral-500 dark:group-hover:text-neutral-300" />
            )}
            <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
          </button>

          {/* Stopwatch Controls */}
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-semibold tabular-nums ${
                isCurrentTaskRunning ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-neutral-400'
              }`}
            >
              {isCurrentTaskRunning && activeTimer ? (
                formatDuration(activeTimer.elapsedSeconds)
              ) : totalSeconds > 0 ? (
                formatDurationCompact(totalSeconds)
              ) : (
                '0m'
              )}
            </span>

            {!isCompleted && (
              <button
                onClick={() => {
                  if (isCurrentTaskRunning) {
                    stopTimer();
                  } else {
                    startTimer(task.id);
                  }
                }}
                title={isCurrentTaskRunning ? 'Stop Timer' : 'Start Timer'}
                className={`p-1.5 rounded-lg transition shadow-xs ${
                  isCurrentTaskRunning
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-emerald-600 dark:hover:text-white'
                }`}
              >
                {isCurrentTaskRunning ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST STYLE VARIANT (Default)
  // -------------------------------------------------------------
  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150 ${
        isCurrentTaskRunning
          ? 'bg-emerald-50/70 dark:bg-neutral-900/90 border-emerald-500 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/30'
          : isCompleted
          ? 'bg-slate-50 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-75'
          : 'bg-white hover:bg-slate-50/80 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/80 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs'
      }`}
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleTaskComplete(task.id)}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:text-neutral-500 dark:hover:text-emerald-400 transition flex-shrink-0"
          title={isCompleted ? 'Mark as incomplete' : 'Mark as done'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-500 dark:text-neutral-500 dark:group-hover:text-neutral-300" />
          )}
        </button>

        {/* Task Body */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Project Badge, Category, Location, Priority */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {project && (
              <span
                className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-white flex-shrink-0"
                style={{ backgroundColor: project.color }}
              >
                {project.name}
              </span>
            )}

            <span className="text-[11px] font-medium text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded">
              {task.category}
            </span>

            {getLocationIcon(task.location)}
            {getPriorityBadge(task.priority)}

            {/* Created / Completed Date */}
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 ml-auto flex items-center gap-1">
              {isCompleted && task.completedAt ? (
                <span>Done {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              ) : (
                <span>{new Date(task.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              )}
            </span>
          </div>

          {/* Title row */}
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
              <button type="submit" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Done
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                className={`text-sm font-medium leading-snug cursor-pointer select-text ${
                  isCompleted ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                {task.title}
              </span>

              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition p-1"
                title="Edit Title"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Description or Notes if present */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {task.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700/50"
                >
                  <Hash className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-500" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Timer & Play/Pause Button */}
        <div className="flex items-center gap-2 flex-shrink-0 self-center">
          {/* Duration Display */}
          <div className="text-right">
            <div
              className={`font-mono text-xs font-semibold tabular-nums ${
                isCurrentTaskRunning ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-neutral-400'
              }`}
            >
              {isCurrentTaskRunning && activeTimer ? (
                formatDuration(activeTimer.elapsedSeconds)
              ) : totalSeconds > 0 ? (
                formatDurationCompact(totalSeconds)
              ) : (
                <span className="text-slate-400 dark:text-neutral-600">0m</span>
              )}
            </div>
            {isCurrentTaskRunning && (
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500 tracking-wider">
                Active
              </span>
            )}
          </div>

          {/* Start/Stop Stopwatch Button */}
          {!isCompleted && (
            <button
              onClick={() => {
                if (isCurrentTaskRunning) {
                  stopTimer();
                } else {
                  startTimer(task.id);
                }
              }}
              title={isCurrentTaskRunning ? 'Stop Timer' : 'Start Timer on this task'}
              className={`p-2 rounded-xl transition shadow-xs ${
                isCurrentTaskRunning
                  ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 dark:hover:bg-amber-500/30'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-500'
              }`}
            >
              {isCurrentTaskRunning ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => deleteTask(task.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-950/40 rounded-lg transition"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
