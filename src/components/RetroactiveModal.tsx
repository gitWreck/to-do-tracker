import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCategory, WorkLocation, TaskPriority } from '@/types';
import { getTodayDateString, getDatesInRange } from '@/lib/time';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { X, Clock } from 'lucide-react';

interface RetroactiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetroactiveModal: React.FC<RetroactiveModalProps> = ({ isOpen, onClose }) => {
  const { projects, addRetroactiveEntry } = useTasks();
  const { shouldRender, isEntered } = useModalAnimation(isOpen, { onClose });

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [category, setCategory] = useState<TaskCategory>('PROGRAMMING');
  const [location, setLocation] = useState<WorkLocation>('OFFICE');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [date, setDate] = useState(getTodayDateString());
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [markCompleted, setMarkCompleted] = useState(true);

  if (!shouldRender) return null;

  // Calculate daily duration in hours
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Log Past Work (Retroactive)</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Record previously completed work intervals for accomplishment reports</p>
            </div>
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
              Task Description <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Manuscript Workshop Follow-up Email"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Date, Range Toggle, Start Time, End Time Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                Date & Daily Schedule
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-amber-700 dark:text-amber-400 select-none">
                <input
                  type="checkbox"
                  checked={isMultiDay}
                  onChange={e => {
                    setIsMultiDay(e.target.checked);
                    if (e.target.checked && endDate < date) {
                      setEndDate(date);
                    }
                  }}
                  className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 bg-slate-100 dark:bg-neutral-950 border-slate-300 dark:border-neutral-800"
                />
                Multi-day work deliverable
              </label>
            </div>

            <div className={`grid grid-cols-1 ${isMultiDay ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1">
                  {isMultiDay ? 'Start Date' : 'Date'}
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
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1">
                  Daily Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Computed Duration Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              {isMultiDay && dayCount > 1
                ? `Total Elapsed across ${dayCount} Days (${dailyHours.toFixed(2)}h/day):`
                : 'Calculated Time Elapsed:'}
            </span>
            <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{totalHours} Hours</span>
          </div>

          {/* Project, Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                Project
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="PROGRAMMING">Programming</option>
                <option value="ADMIN">Admin Task</option>
                <option value="MEETING">Meeting</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Location & Completed checkbox */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-neutral-400 mb-1">
                Location
              </label>
              <div className="flex items-center gap-1">
                {(['OFFICE', 'HOME', 'FIELD'] as WorkLocation[]).map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      location === loc
                        ? 'bg-amber-600 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/40'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-3 sm:mt-0 select-none">
              <input
                type="checkbox"
                checked={markCompleted}
                onChange={e => setMarkCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-100 dark:bg-neutral-950 border-slate-300 dark:border-neutral-800"
              />
              <span className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Mark as [DONE] immediately</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition"
            >
              Log Work
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
