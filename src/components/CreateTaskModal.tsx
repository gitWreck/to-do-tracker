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
  const [dueDate, setDueDate] = useState(initialDate || '');
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
      dueDate: dueDate ? dueDate : undefined,
      tags: extraTags,
    });

    onClose();
    setTitle('');
    setDescription('');
    setTagsInput('');
  };

  const selectedProject = projects.find(p => p.id === projectId) || projects[0];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-200 overflow-hidden ${
        isEntered ? 'opacity-100 ease-out' : 'opacity-0 ease-in pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isEntered
            ? 'opacity-100 scale-100 translate-y-0 ease-out'
            : 'opacity-0 scale-95 translate-y-2 ease-in'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">Create New Task</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Plan and track your development work deliverable</p>
            </div>
            {selectedProject && (
              <span
                className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md text-white shadow-2xs ml-2"
                style={{ backgroundColor: selectedProject.color }}
              >
                {selectedProject.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
            {/* Left Column (Primary Content: Title, Description, Tags) - 7 cols on desktop */}
            <div className="md:col-span-7 flex flex-col space-y-4">
              {/* Task Title */}
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
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Description / Notes */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                    Description / Notes
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    Ctrl+Enter to save
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Add details, steps, links, acceptance criteria, or technical notes...&#10;• Step 1&#10;• Step 2"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full flex-1 min-h-[140px] px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed font-sans"
                />
              </div>

              {/* Tags Input */}
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
            </div>

            {/* Right Column (Metadata: Project, Category, Location, Priority, Timeline) - 5 cols on desktop */}
            <div className="md:col-span-5 flex flex-col space-y-4">
              {/* Project & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                    Project
                  </label>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="PROGRAMMING">Programming</option>
                    <option value="ADMIN">Admin Task</option>
                    <option value="MEETING">Meeting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Work Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                  Work Location
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-neutral-950 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setLocation('OFFICE')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      location === 'OFFICE'
                        ? 'bg-blue-600 text-white dark:bg-blue-600/30 dark:text-blue-300 dark:border dark:border-blue-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocation('HOME')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      location === 'HOME'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocation('FIELD')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      location === 'FIELD'
                        ? 'bg-amber-600 text-white dark:bg-amber-600/30 dark:text-amber-300 dark:border dark:border-amber-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Field
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-neutral-950 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setPriority('LOW')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      priority === 'LOW'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('MEDIUM')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      priority === 'MEDIUM'
                        ? 'bg-blue-600 text-white dark:bg-blue-600/30 dark:text-blue-300 dark:border dark:border-blue-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Med
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('HIGH')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      priority === 'HIGH'
                        ? 'bg-amber-600 text-white dark:bg-amber-600/30 dark:text-amber-300 dark:border dark:border-amber-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('URGENT')}
                    className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      priority === 'URGENT'
                        ? 'bg-rose-600 text-white dark:bg-rose-600/30 dark:text-rose-300 dark:border dark:border-rose-500/50 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>

              {/* Date Range / Timeline */}
              <div className="p-3 bg-slate-50 dark:bg-neutral-950/60 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Timeline & Due Date
                  </label>
                  {/* Quick presets */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-lg border transition cursor-pointer ${
                        !dueDate
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400'
                      }`}
                    >
                      No Due
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = getTodayDateString();
                        setStartDate(today);
                        setDueDate(today);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-lg border transition cursor-pointer ${
                        dueDate === startDate
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400'
                      }`}
                    >
                      Today
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
                      className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition cursor-pointer"
                    >
                      +3d
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
                      className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-indigo-400 transition cursor-pointer"
                    >
                      +1w
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400">
                        Target Due Date
                      </span>
                      {dueDate && (
                        <button
                          type="button"
                          onClick={() => setDueDate('')}
                          className="text-[10px] text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={dueDate}
                      min={startDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Date Span Preview */}
                {startDate && dueDate ? (
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                    <span>
                      {startDate === dueDate ? (
                        'Same-day deliverable (1 day)'
                      ) : (
                        <>
                          Multi-day span: {Math.max(1, Math.round((new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} days scheduled
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                      {startDate === dueDate ? startDate : `${startDate} \u2192 ${dueDate}`}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 bg-slate-100/60 dark:bg-neutral-900/40 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-between">
                    <span>No target due date (open backlog task)</span>
                    <span className="text-[10px] text-slate-400 font-medium">Backlog</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex-shrink-0 mt-auto flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90 backdrop-blur-sm">
            <span className="text-xs text-slate-400 dark:text-neutral-500 hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded shadow-2xs">Esc</kbd> to cancel, <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded shadow-2xs">Ctrl+Enter</kbd> to save
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
