import React, { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCategory, WorkLocation, TaskPriority } from '@/types';
import { getTodayDateString } from '@/lib/time';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { X, Plus, Calendar } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, initialDate }) => {
  const { projects, createTask } = useTasks();
  const { shouldRender, isEntered } = useModalAnimation(isOpen, { onClose });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [category, setCategory] = useState<TaskCategory>('PROGRAMMING');
  const [location, setLocation] = useState<WorkLocation>('OFFICE');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState(initialDate || getTodayDateString());
  const [dueDate, setDueDate] = useState(initialDate || getTodayDateString());
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (initialDate) {
      setStartDate(initialDate);
      setDueDate(initialDate);
    }
  }, [initialDate]);

  if (!shouldRender) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const extraTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const startIso = startDate === getTodayDateString() ? new Date().toISOString() : `${startDate}T09:00:00.000Z`;

    createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || projects[0]?.id || 'proj-general',
      category,
      location,
      priority,
      createdAt: startIso,
      dueDate,
      tags: extraTags,
    });

    onClose();
    setTitle('');
    setDescription('');
    setTagsInput('');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-200 ${
        isEntered ? 'opacity-100 ease-out' : 'opacity-0 ease-in pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-all duration-200 ${
          isEntered
            ? 'opacity-100 scale-100 translate-y-0 ease-out'
            : 'opacity-0 scale-95 translate-y-2 ease-in'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Create New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
              Task Title <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Implement curriculum endpoint #CSAR"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              placeholder="Add details, steps, links, or notes...&#10;• Step 1&#10;• Step 2"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y min-h-[72px]"
            />
          </div>

          {/* Grid: Project & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                Project
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="PROGRAMMING">Programming</option>
                <option value="ADMIN">Admin Task</option>
                <option value="MEETING">Meeting</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Location & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                Work Location
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-neutral-950 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setLocation('OFFICE')}
                  className={`py-1 text-xs rounded-lg font-medium transition ${location === 'OFFICE'
                      ? 'bg-blue-600 text-white dark:bg-blue-600/30 dark:text-blue-300 dark:border dark:border-blue-500/50'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Office
                </button>
                <button
                  type="button"
                  onClick={() => setLocation('HOME')}
                  className={`py-1 text-xs rounded-lg font-medium transition ${location === 'HOME'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/50'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setLocation('FIELD')}
                  className={`py-1 text-xs rounded-lg font-medium transition ${location === 'FIELD'
                      ? 'bg-amber-600 text-white dark:bg-amber-600/30 dark:text-amber-300 dark:border dark:border-amber-500/50'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Field
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Date Range: Start Date & Due Date */}
          <div className="p-3 bg-slate-50 dark:bg-neutral-950/60 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Date Range / Timeline
              </label>
              {/* Quick presets */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 dark:text-neutral-400 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    const today = getTodayDateString();
                    setStartDate(today);
                    setDueDate(today);
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition"
                >
                  1 Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(startDate || getTodayDateString());
                    d.setDate(d.getDate() + 3);
                    const y = d.getFullYear();
                    const m = (d.getMonth() + 1).toString().padStart(2, '0');
                    const day = d.getDate().toString().padStart(2, '0');
                    setDueDate(`${y}-${m}-${day}`);
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(startDate || getTodayDateString());
                    d.setDate(d.getDate() + 7);
                    const y = d.getFullYear();
                    const m = (d.getMonth() + 1).toString().padStart(2, '0');
                    const day = d.getDate().toString().padStart(2, '0');
                    setDueDate(`${y}-${m}-${day}`);
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition"
                >
                  +1 Week
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  Start Date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (dueDate && newStart > dueDate) {
                      setDueDate(newStart);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  Target Due Date
                </span>
                <input
                  type="date"
                  value={dueDate}
                  min={startDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Date Span Preview Indicator */}
            {startDate && dueDate && (
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <span>
                  {startDate === dueDate ? (
                    'Same-day deliverable (1 day)'
                  ) : (
                    <>
                      Multi-day span: {Math.max(1, Math.round((new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))} days scheduled
                    </>
                  )}
                </span>
                <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                  {startDate} &rarr; {dueDate}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Backend, CSAR, Review"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
