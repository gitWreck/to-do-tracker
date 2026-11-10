import React, { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCategory, WorkLocation, TaskPriority } from '@/types';
import { getTodayDateString, getDatesInRange } from '@/lib/time';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { X, Clock, Check } from 'lucide-react';

interface RetroactiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const RetroactiveModal: React.FC<RetroactiveModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { projects, addRetroactiveEntry } = useTasks();
  const { shouldRender, isEntered } = useModalAnimation(isOpen, { onClose });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [category, setCategory] = useState<TaskCategory>('PROGRAMMING');
  const [location, setLocation] = useState<WorkLocation>('OFFICE');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [date, setDate] = useState(initialDate || getTodayDateString());
  const [endDate, setEndDate] = useState(initialDate || getTodayDateString());
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [markCompleted, setMarkCompleted] = useState(true);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialDate]);

  if (!shouldRender) return null;

  const calculateDailyHours = () => {
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (endMinutes > startMinutes) {
        return (endMinutes - startMinutes) / 60;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const dailyHours = calculateDailyHours();
  const dayCount = isMultiDay && endDate > date ? getDatesInRange(date, endDate).length : 1;
  const totalHours = (dailyHours * dayCount).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addRetroactiveEntry({
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || projects[0]?.id || 'proj-general',
      category,
      location,
      priority,
      date,
      endDate: isMultiDay && endDate > date ? endDate : undefined,
      startTime,
      endTime,
      markCompleted,
    });

    onClose();
    setTitle('');
    setDescription('');
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">Log Past Work (Retroactive)</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Record previously completed work intervals for accomplishment reports</p>
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
            {/* Left Column (Primary Content: Title, Description, Completed flag) - 7 cols on desktop */}
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
                  placeholder="e.g. Manuscript Workshop Follow-up Email #CSAR"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Description / Notes */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                    Description / Deliverables / Notes
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    Ctrl+Enter to save
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Add details, deliverables, achievements, or reference notes...&#10;• Submitted report to dean&#10;• Deployed API v2.1"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full flex-1 min-h-[140px] px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y leading-relaxed font-sans"
                />
              </div>

              {/* Mark Completed Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-neutral-950/60 rounded-xl border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={markCompleted}
                    onChange={e => setMarkCompleted(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700"
                  />
                  <div>
                    <span className="text-xs text-slate-800 dark:text-neutral-200 font-semibold block">Mark as [DONE] immediately</span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">Moves task to completed history with tracked hours intact</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Column (Schedule & Metadata) - 5 cols on desktop */}
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="PROGRAMMING">Programming</option>
                    <option value="ADMIN">Admin Task</option>
                    <option value="MEETING">Meeting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                  Work Location
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-neutral-950 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                  {(['OFFICE', 'HOME', 'FIELD'] as WorkLocation[]).map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                        location === loc
                          ? 'bg-amber-600 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/40 shadow-2xs'
                          : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {loc.charAt(0) + loc.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-neutral-950 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(pr => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setPriority(pr)}
                      className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                        priority === pr
                          ? pr === 'LOW'
                            ? 'bg-emerald-600 text-white dark:bg-emerald-600/30 dark:text-emerald-300 shadow-2xs'
                            : pr === 'MEDIUM'
                            ? 'bg-blue-600 text-white dark:bg-blue-600/30 dark:text-blue-300 shadow-2xs'
                            : pr === 'HIGH'
                            ? 'bg-amber-600 text-white dark:bg-amber-600/30 dark:text-amber-300 shadow-2xs'
                            : 'bg-rose-600 text-white dark:bg-rose-600/30 dark:text-rose-300 shadow-2xs'
                          : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {pr === 'MEDIUM' ? 'Med' : pr.charAt(0) + pr.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Daily Schedule */}
              <div className="p-3 bg-slate-50 dark:bg-neutral-950/60 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                    Date & Schedule
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-amber-700 dark:text-amber-400 select-none">
                    <input
                      type="checkbox"
                      checked={isMultiDay}
                      onChange={e => {
                        setIsMultiDay(e.target.checked);
                        if (e.target.checked && endDate < date) {
                          setEndDate(date);
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700"
                    />
                    Multi-day span
                  </label>
                </div>

                <div className={`grid grid-cols-1 ${isMultiDay ? 'sm:grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1">
                      {isMultiDay ? 'Start Date' : 'Work Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => {
                        const newDate = e.target.value;
                        setDate(newDate);
                        if (isMultiDay && endDate < newDate) {
                          setEndDate(newDate);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {isMultiDay && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        min={date}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* Start & End Times */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1">
                      Daily Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1">
                      Daily End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Computed Duration Banner */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-xs mt-1">
                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                    {isMultiDay && dayCount > 1
                      ? `Total (${dayCount} days @ ${dailyHours.toFixed(2)}h/day):`
                      : 'Calculated Duration:'}
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{totalHours} Hours</span>
                </div>
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
                className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log Work</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
