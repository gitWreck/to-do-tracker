import React, { useState, useEffect } from 'react';
import { Task, Project, TaskCategory, WorkLocation, TaskPriority } from '@/types';
import { useTasks } from '@/context/TaskContext';
import {
  formatDuration,
  formatDurationCompact,
  getTaskDateSpan,
  getTodayDateString,
} from '@/lib/time';
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
  Star,
  Archive,
  RotateCcw,
  X,
  ChevronDown,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project?: Project;
  variant?: 'list' | 'grid';
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, project, variant = 'list' }) => {
  const {
    projects,
    activeTimer,
    startTimer,
    stopTimer,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    unarchiveTask,
    togglePinTask,
  } = useTasks();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedProjectId, setEditedProjectId] = useState(task.projectId);
  const [editedCategory, setEditedCategory] = useState<TaskCategory>(task.category);
  const [editedLocation, setEditedLocation] = useState<WorkLocation>(task.location);
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task.priority);
  const [editedDueDate, setEditedDueDate] = useState<string>(task.dueDate || '');
  const [editedTagsInput, setEditedTagsInput] = useState<string>(task.tags ? task.tags.join(', ') : '');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const isCurrentTaskRunning = activeTimer?.taskId === task.id;
  const isCompleted = task.status === 'COMPLETED';
  const isArchived = task.status === 'ARCHIVED';
  const isPinned = !!task.isPinned && !isCompleted && !isArchived;
  const dateSpan = getTaskDateSpan(task);

  const selectedProject = projects.find(p => p.id === editedProjectId) || project;

  useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  const startEditing = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedProjectId(task.projectId);
    setEditedCategory(task.category);
    setEditedLocation(task.location);
    setEditedPriority(task.priority);
    setEditedDueDate(task.dueDate || '');
    setEditedTagsInput(task.tags && task.tags.length > 0 ? task.tags.join(', ') : '');
    setIsEditing(true);
  };

  const handleEditSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editedTitle.trim()) return;

    const extraTags = editedTagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    updateTask(task.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim() || undefined,
      projectId: editedProjectId,
      category: editedCategory,
      location: editedLocation,
      priority: editedPriority,
      dueDate: editedDueDate.trim() ? editedDueDate.trim() : undefined,
      tags: extraTags,
    });
    setIsEditing(false);
  };

  // Total duration including live active timer elapsed seconds if this task is active
  const totalSeconds = isCurrentTaskRunning && activeTimer
    ? activeTimer.elapsedSeconds
    : (task.totalDurationSeconds || 0);

  const DateBadge = (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${dateSpan.isMultiDay
        ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800/70 shadow-2xs'
        : 'text-slate-400 dark:text-neutral-500'
        }`}
      title={dateSpan.tooltip}
    >
      <Calendar
        className={`w-3 h-3 flex-shrink-0 ${dateSpan.isMultiDay ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-neutral-500'
          }`}
      />
      <span>{dateSpan.display}</span>
    </span>
  );

  const EditForm = (
    <form onSubmit={handleEditSubmit} className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Pencil className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
              Edit Task
            </h3>
            {selectedProject && (
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md text-white shadow-2xs"
                style={{ backgroundColor: selectedProject.color }}
              >
                {selectedProject.name}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
          Task Title <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={editedTitle}
          onChange={e => setEditedTitle(e.target.value)}
          onKeyDown={e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleEditSubmit();
            }
          }}
          placeholder="Task title..."
          className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-2xs"
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
            Description / Notes
          </label>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500">
            Enter for new line &bull; Ctrl+Enter to save
          </span>
        </div>
        <textarea
          rows={3}
          value={editedDescription}
          onChange={e => setEditedDescription(e.target.value)}
          onKeyDown={e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleEditSubmit();
            }
          }}
          placeholder="Add details, notes, links or deliverables..."
          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y min-h-[64px]"
        />
      </div>

      {/* Project & Category Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Project
            </label>
            {selectedProject && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-neutral-300">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="truncate max-w-[130px]">{selectedProject.name}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={editedProjectId}
              onChange={e => setEditedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 dark:text-neutral-500">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              value={editedCategory}
              onChange={e => setEditedCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="PROGRAMMING">Programming</option>
              <option value="ADMIN">Admin Task</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 dark:text-neutral-500">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Work Location */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
          Work Location
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-neutral-950 p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setEditedLocation('OFFICE')}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs rounded-lg font-medium transition cursor-pointer ${editedLocation === 'OFFICE'
              ? 'bg-blue-600 text-white dark:bg-blue-600/30 dark:text-blue-300 dark:border dark:border-blue-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Office</span>
          </button>
          <button
            type="button"
            onClick={() => setEditedLocation('HOME')}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs rounded-lg font-medium transition cursor-pointer ${editedLocation === 'HOME'
              ? 'bg-emerald-600 text-white dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <Home className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => setEditedLocation('FIELD')}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs rounded-lg font-medium transition cursor-pointer ${editedLocation === 'FIELD'
              ? 'bg-amber-600 text-white dark:bg-amber-600/30 dark:text-amber-300 dark:border dark:border-amber-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <Compass className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Field</span>
          </button>
        </div>
      </div>

      {/* Priority Level */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
          Priority Level
        </label>
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-neutral-950 p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setEditedPriority('LOW')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs rounded-lg font-medium transition cursor-pointer ${editedPriority === 'LOW'
              ? 'bg-emerald-600 text-white dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${editedPriority === 'LOW' ? 'bg-white dark:bg-emerald-300' : 'bg-emerald-500'}`} />
            <span>Low</span>
          </button>
          <button
            type="button"
            onClick={() => setEditedPriority('MEDIUM')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs rounded-lg font-medium transition cursor-pointer ${editedPriority === 'MEDIUM'
              ? 'bg-blue-600 text-white dark:bg-blue-600/30 dark:text-blue-300 dark:border dark:border-blue-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${editedPriority === 'MEDIUM' ? 'bg-white dark:bg-blue-300' : 'bg-blue-500'}`} />
            <span>Medium</span>
          </button>
          <button
            type="button"
            onClick={() => setEditedPriority('HIGH')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs rounded-lg font-medium transition cursor-pointer ${editedPriority === 'HIGH'
              ? 'bg-amber-600 text-white dark:bg-amber-600/30 dark:text-amber-300 dark:border dark:border-amber-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${editedPriority === 'HIGH' ? 'bg-white dark:bg-amber-300' : 'bg-amber-500'}`} />
            <span>High</span>
          </button>
          <button
            type="button"
            onClick={() => setEditedPriority('URGENT')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs rounded-lg font-medium transition cursor-pointer ${editedPriority === 'URGENT'
              ? 'bg-rose-600 text-white dark:bg-rose-600/30 dark:text-rose-300 dark:border dark:border-rose-500/50 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-900/60'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${editedPriority === 'URGENT' ? 'bg-white dark:bg-rose-300 animate-pulse' : 'bg-rose-500'}`} />
            <span>Urgent</span>
          </button>
        </div>
      </div>

      {/* Due Date & Quick Presets */}
      <div className="p-3 bg-slate-50 dark:bg-neutral-950/60 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Due Date
          </label>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setEditedDueDate('')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-lg border transition cursor-pointer ${!editedDueDate
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400'
                }`}
            >
              No Due Date
            </button>
            <button
              type="button"
              onClick={() => setEditedDueDate(getTodayDateString())}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-lg border transition cursor-pointer ${editedDueDate === getTodayDateString()
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400'
                }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                setEditedDueDate(`${y}-${m}-${day}`);
              }}
              className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition cursor-pointer"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                setEditedDueDate(`${y}-${m}-${day}`);
              }}
              className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition cursor-pointer"
            >
              +1 Week
            </button>
          </div>
        </div>
        <input
          type="date"
          value={editedDueDate}
          onChange={e => setEditedDueDate(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
          Tags <span className="font-normal text-slate-400 dark:text-neutral-500">(comma separated)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="frontend, urgent, bug"
            value={editedTagsInput}
            onChange={e => setEditedTagsInput(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleEditSubmit();
              }
            }}
            className="w-full pl-8 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-between pt-3.5 border-t border-slate-200 dark:border-neutral-800">
        {/* <div className="text-[11px] text-slate-400 dark:text-neutral-500 hidden sm:block">
          <kbd className="font-mono bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-neutral-700">Esc</kbd> cancel &bull; <kbd className="font-mono bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-neutral-700">Ctrl+Enter</kbd> save
        </div> */}
        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </form>
  );

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priorities: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const nextIdx = (priorities.indexOf(task.priority) + 1) % priorities.length;
    updateTask(task.id, { priority: priorities[nextIdx] });
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return (
          <button
            type="button"
            onClick={cyclePriority}
            title="Priority: Urgent (click to cycle)"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 uppercase tracking-wider hover:brightness-95 active:scale-95 transition cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Urgent</span>
          </button>
        );
      case 'HIGH':
        return (
          <button
            type="button"
            onClick={cyclePriority}
            title="Priority: High (click to cycle)"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 uppercase tracking-wider hover:brightness-95 active:scale-95 transition cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>High</span>
          </button>
        );
      case 'MEDIUM':
        return (
          <button
            type="button"
            onClick={cyclePriority}
            title="Priority: Medium (click to cycle)"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:brightness-95 active:scale-95 transition cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Med</span>
          </button>
        );
      case 'LOW':
        return (
          <button
            type="button"
            onClick={cyclePriority}
            title="Priority: Low (click to cycle)"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:brightness-95 active:scale-95 transition cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Low</span>
          </button>
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
  const CheckboxIcon = isArchived ? (
    <div
      className="flex items-center justify-center w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex-shrink-0"
      title="Archived Task"
    >
      <Archive className="w-3.5 h-3.5" />
    </div>
  ) : (
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
          {!isCompleted && !isArchived && (
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
        !isCompleted && !isArchived && (
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
  // QUICK ACTION ICONS: Restore, Star (Top 3), Edit & Delete
  // -----------------------------------------------------------------
  const QuickActions = (
    <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
      {isArchived ? (
        <button
          onClick={() => unarchiveTask(task.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
          title="Restore task to active board"
        >
          <RotateCcw className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span className="text-[11px]">Restore</span>
        </button>
      ) : (
        <>
          {!isCompleted && (
            <button
              onClick={e => {
                e.stopPropagation();
                togglePinTask(task.id);
              }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${task.isPinned
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-300 dark:ring-amber-800'
                : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:text-neutral-600 dark:hover:text-amber-400 dark:hover:bg-neutral-800'
                }`}
              title={task.isPinned ? "Unpin from Today's Top 3" : "Pin to Today's Top 3 (The Big 3)"}
            >
              <Star className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          )}

          <button
            onClick={startEditing}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-neutral-500 dark:hover:text-indigo-400 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Edit Task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </>
      )}

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
    if (isEditing) {
      return (
        <div className="relative rounded-2xl border border-indigo-400/80 dark:border-indigo-600/80 ring-2 ring-indigo-500/20 bg-white dark:bg-neutral-900 p-4 shadow-lg shadow-indigo-500/5 overflow-hidden transition-all">
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ backgroundColor: selectedProject?.color || '#3b82f6' }}
          />
          <div className="pl-1">
            {EditForm}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`group relative rounded-2xl border flex flex-col justify-between transition-all duration-150 p-4 overflow-hidden ${isCurrentTaskRunning
          ? 'bg-emerald-50/70 dark:bg-neutral-900/95 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
          : isArchived
            ? 'bg-slate-50/60 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-80'
            : isCompleted
              ? 'bg-slate-50/80 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-80'
              : isPinned
                ? 'bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-neutral-900/80 dark:to-neutral-900/80 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/40 shadow-xs'
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
              {isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 shadow-2xs">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Top 3</span>
                </span>
              )}
              {isArchived && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-300 dark:border-purple-800 shadow-2xs">
                  <Archive className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                  <span>Archived</span>
                </span>
              )}
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
              <h4
                onDoubleClick={startEditing}
                className={`text-sm font-semibold leading-snug cursor-pointer select-text ${isCompleted
                  ? 'line-through text-slate-400 dark:text-neutral-500'
                  : 'text-slate-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
                  }`}
              >
                {task.title}
              </h4>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mb-3 pl-8">
              <p
                className={`text-xs text-slate-600 dark:text-neutral-300 whitespace-pre-line leading-relaxed ${!isDescExpanded ? 'line-clamp-2' : ''
                  }`}
              >
                {task.description}
              </p>
              {(task.description.includes('\n') || task.description.length > 90) && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(prev => !prev)}
                  className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 block cursor-pointer"
                >
                  {isDescExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
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
  if (isEditing) {
    return (
      <div className="relative rounded-xl border border-indigo-400/80 dark:border-indigo-600/80 ring-2 ring-indigo-500/20 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-lg shadow-indigo-500/5 overflow-hidden transition-all">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: selectedProject?.color || '#3b82f6' }}
        />
        <div className="pl-1">
          {EditForm}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150 overflow-hidden ${isCurrentTaskRunning
        ? 'bg-emerald-50/70 dark:bg-neutral-900/95 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
        : isArchived
          ? 'bg-slate-50/60 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-80'
          : isCompleted
            ? 'bg-slate-50/70 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/60 opacity-80'
            : isPinned
              ? 'bg-gradient-to-r from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-neutral-900/80 dark:to-neutral-900/80 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/40 shadow-xs'
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

            {isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 shadow-2xs">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>Top 3</span>
              </span>
            )}

            {isArchived && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-300 dark:border-purple-800 shadow-2xs">
                <Archive className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                <span>Archived</span>
              </span>
            )}

            {getLocationBadge(task.location)}
            {getPriorityBadge(task.priority)}

            {/* Created or completed date indicator */}
            <div className="ml-auto hidden sm:flex items-center">
              {DateBadge}
            </div>
          </div>

          {/* Title Row */}
          <div className="flex items-center gap-2">
            <span
              onDoubleClick={startEditing}
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

          {/* Description or Notes if present */}
          {task.description && (
            <div className="mt-1">
              <p
                className={`text-xs text-slate-600 dark:text-neutral-300 whitespace-pre-line leading-relaxed ${!isDescExpanded ? 'line-clamp-2' : ''
                  }`}
              >
                {task.description}
              </p>
              {(task.description.includes('\n') || task.description.length > 120) && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(prev => !prev)}
                  className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 block cursor-pointer"
                >
                  {isDescExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
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
