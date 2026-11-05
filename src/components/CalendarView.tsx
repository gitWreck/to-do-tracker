import React, { useState, useMemo } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types';
import { formatDurationCompact, formatDecimalHours, getTodayDateString, getTaskDateSpan } from '@/lib/time';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  CheckCircle2,
  Play,
  Square,
  Clock,
  Circle,
} from 'lucide-react';

interface CalendarViewProps {
  onOpenCreateWithDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenCreateWithDate }) => {
  const { tasks, projects, activeTimer, startTimer, stopTimer, toggleTaskComplete } = useTasks();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  // Aggregate tasks and time entries by date string (YYYY-MM-DD)
  const dateDataMap = useMemo(() => {
    const map = new Map<string, { tasks: Task[]; totalSeconds: number; completedCount: number }>();

    const getOrCreate = (date: string) => {
      let entry = map.get(date);
      if (!entry) {
        entry = { tasks: [], totalSeconds: 0, completedCount: 0 };
        map.set(date, entry);
      }
      return entry;
    };

    tasks.forEach(task => {
      // 1. Task created date & due date
      const createdDate = task.createdAt.split('T')[0];
      const entryCreated = getOrCreate(createdDate);
      if (!entryCreated.tasks.some(t => t.id === task.id)) {
        entryCreated.tasks.push(task);
      }

      if (task.dueDate && task.dueDate !== createdDate) {
        const dueEntry = getOrCreate(task.dueDate);
        if (!dueEntry.tasks.some(t => t.id === task.id)) {
          dueEntry.tasks.push(task);
        }
      }

      if (task.status === 'COMPLETED') {
        const completedDate = task.completedAt ? task.completedAt.split('T')[0] : (task.dueDate || createdDate);
        const compEntry = getOrCreate(completedDate);
        if (!compEntry.tasks.some(t => t.id === task.id)) {
          compEntry.tasks.push(task);
        }
        compEntry.completedCount += 1;
      }

      // 2. Time entries for this task
      (task.timeEntries || []).forEach(te => {
        const entryDate = te.date || te.startTime.split('T')[0];
        const dayEntry = getOrCreate(entryDate);
        dayEntry.totalSeconds += te.durationSeconds;
        if (!dayEntry.tasks.some(t => t.id === task.id)) {
          dayEntry.tasks.push(task);
        }
      });
    });

    return map;
  }, [tasks]);

  // Calendar grid matrix: 7 days x 5-6 weeks
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = getTodayDateString();

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const dateStr = thisDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill a complete 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Selected date tasks
  const selectedDayData = dateDataMap.get(selectedDateStr) || { tasks: [], totalSeconds: 0, completedCount: 0 };

  // Calculate monthly stats
  const monthStats = useMemo(() => {
    let monthlySeconds = 0;
    let monthlyCompleted = 0;

    tasks.forEach(t => {
      (t.timeEntries || []).forEach(te => {
        const d = te.date || te.startTime.split('T')[0];
        if (d.startsWith(`${year}-${(month + 1).toString().padStart(2, '0')}`)) {
          monthlySeconds += te.durationSeconds;
        }
      });
      if (t.status === 'COMPLETED' && t.completedAt?.startsWith(`${year}-${(month + 1).toString().padStart(2, '0')}`)) {
        monthlyCompleted += 1;
      }
    });

    return {
      totalHours: formatDecimalHours(monthlySeconds),
      completedCount: monthlyCompleted,
    };
  }, [tasks, year, month]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] overflow-hidden transition-colors">
      {/* Calendar Header Controls */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{monthNames[month]} {year}</span>
          </h2>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToday}
              className="px-2 py-0.5 text-xs font-semibold rounded-md text-slate-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-md text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
            <span className="hidden sm:inline">Month Hours:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{monthStats.totalHours} hrs</strong>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            <span className="hidden sm:inline">Completed:</span>
            <strong className="text-slate-900 dark:text-white">{monthStats.completedCount}</strong>
          </span>
          <button
            onClick={() => onOpenCreateWithDate(selectedDateStr)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add on Date</span>
          </button>
        </div>
      </div>

      {/* Main Grid + Day Inspector Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Month Calendar Grid */}
        <div className="flex-1 flex flex-col p-2.5 sm:p-4 overflow-y-auto min-w-0">
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 flex-1 min-h-[480px]">
            {calendarDays.map(day => {
              const dayData = dateDataMap.get(day.dateStr);
              const isSelected = selectedDateStr === day.dateStr;
              const hasHours = dayData && dayData.totalSeconds > 0;
              const taskCount = dayData ? dayData.tasks.length : 0;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`flex flex-col p-2 rounded-xl border text-left cursor-pointer transition relative min-h-[90px] ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20'
                      : day.isCurrentMonth
                      ? 'bg-white dark:bg-neutral-900/70 border-slate-200 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700'
                      : 'bg-slate-50/60 dark:bg-neutral-950/40 border-slate-100 dark:border-neutral-900 text-slate-400 dark:text-neutral-600'
                  }`}
                >
                  {/* Day header: Day number and hours pill */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold flex items-center justify-center w-6 h-6 rounded-full ${
                        day.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : day.isCurrentMonth
                          ? 'text-slate-800 dark:text-neutral-200'
                          : 'text-slate-400 dark:text-neutral-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {hasHours && (
                      <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1 py-0.2 rounded border border-orange-200 dark:border-orange-800/50">
                        {formatDecimalHours(dayData.totalSeconds)}h
                      </span>
                    )}
                  </div>

                  {/* Tasks Preview Pills inside Day Cell */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayData?.tasks.slice(0, 3).map(task => {
                      const proj = projectMap.get(task.projectId);
                      const isTaskCompleted = task.status === 'COMPLETED';
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate ${
                            isTaskCompleted
                              ? 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 line-through'
                              : 'bg-slate-100 dark:bg-neutral-800/90 text-slate-800 dark:text-neutral-200 font-medium'
                          }`}
                          title={task.title}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: proj?.color || '#3b82f6' }}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}

                    {taskCount > 3 && (
                      <div className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 pl-1">
                        +{taskCount - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector Sidebar Panel */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col p-4 overflow-y-auto max-h-72 lg:max-h-none flex-shrink-0">
          {/* Day Inspector Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {selectedDayData.tasks.length} {selectedDayData.tasks.length === 1 ? 'task' : 'tasks'} &bull;{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatDecimalHours(selectedDayData.totalSeconds)} hrs
                </strong>{' '}
                logged
              </p>
            </div>

            <button
              onClick={() => onOpenCreateWithDate(selectedDateStr)}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition"
              title="Create Task for this date"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List of Tasks on Selected Date */}
          {selectedDayData.tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-neutral-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tasks or time logs for this date.</p>
              <button
                onClick={() => onOpenCreateWithDate(selectedDateStr)}
                className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                + Add task for this day
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayData.tasks.map(task => {
                const project = projectMap.get(task.projectId);
                const isCurrentTaskRunning = activeTimer?.taskId === task.id;
                const isCompleted = task.status === 'COMPLETED';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isCurrentTaskRunning
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500'
                        : isCompleted
                        ? 'bg-slate-50 dark:bg-neutral-900/40 border-slate-200 dark:border-neutral-800/80 opacity-70'
                        : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:text-neutral-500 dark:hover:text-emerald-400 flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {project && (
                            <span
                              className="px-1.5 py-0.2 text-[10px] font-semibold rounded text-white"
                              style={{ backgroundColor: project.color }}
                            >
                              {project.name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                            {task.category}
                          </span>
                        </div>

                        <div
                          className={`font-semibold truncate ${
                            isCompleted
                              ? 'line-through text-slate-400 dark:text-neutral-500'
                              : 'text-slate-900 dark:text-neutral-100'
                          }`}
                        >
                          {task.title}
                        </div>

                        {(() => {
                          const dateSpan = getTaskDateSpan(task);
                          return (
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                              <span
                                title={dateSpan.tooltip}
                                className={`truncate ${
                                  dateSpan.isMultiDay
                                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-500 dark:text-neutral-400'
                                }`}
                              >
                                {dateSpan.display}
                              </span>
                              {(isCurrentTaskRunning && activeTimer ? activeTimer.elapsedSeconds : task.totalDurationSeconds) > 0 && (
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-1">
                                  {formatDurationCompact(isCurrentTaskRunning && activeTimer ? activeTimer.elapsedSeconds : task.totalDurationSeconds)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {!isCompleted && (
                        <button
                          onClick={() => {
                            if (isCurrentTaskRunning) {
                              stopTimer();
                            } else {
                              startTimer(task.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            isCurrentTaskRunning
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                          title={isCurrentTaskRunning ? 'Stop Timer' : 'Start Timer'}
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
