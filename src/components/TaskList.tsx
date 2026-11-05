import React, { useState, useMemo } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCard } from './TaskCard';
import { getDateGroupMeta, getTodayDateString } from '@/lib/time';
import {
  Search,
  Plus,
  CheckCircle2,
  ListTodo,
  Calendar,
  Sparkles,
  Inbox,
  LayoutList,
  LayoutGrid,
  Clock,
  AlertCircle,
  Archive,
  Star,
} from 'lucide-react';

interface TaskListProps {
  onOpenCreateModal: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onOpenCreateModal }) => {
  const {
    tasks,
    filteredTasks,
    projects,
    filters,
    setFilters,
    createTask,
    reorderTasks,
  } = useTasks();

  const [quickTitle, setQuickTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [taskDragTarget, setTaskDragTarget] = useState<{ id: string; edge: 'top' | 'bottom' } | null>(null);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    createTask({
      title: quickTitle,
      projectId: filters.selectedProjectId !== 'ALL' ? filters.selectedProjectId : undefined,
      category: filters.selectedCategory !== 'ALL' ? filters.selectedCategory : 'PROGRAMMING',
      location: filters.selectedLocation !== 'ALL' ? filters.selectedLocation : 'OFFICE',
    });

    setQuickTitle('');
  };

  const isCompletedTab = filters.statusTab === 'COMPLETED';
  const isArchivedTab = filters.statusTab === 'ARCHIVED';
  const isGrid = filters.layoutStyle === 'GRID';
  const todayStr = getTodayDateString();

  // Pinned top focus tasks for Today ("The Big 3")
  const pinnedTasks = useMemo(() => {
    if (isCompletedTab || isArchivedTab) return [];
    return filteredTasks.filter(t => t.isPinned);
  }, [filteredTasks, isCompletedTab, isArchivedTab]);

  // Group tasks by date for PENDING, COMPLETED, and ARCHIVED views
  const groupedSections = useMemo(() => {
    if (isArchivedTab) {
      // Archived groups (grouped by createdAt date, newest first)
      const groups: Record<
        string,
        {
          label: string;
          tasks: typeof filteredTasks;
          badge?: string;
          badgeType: 'today' | 'yesterday' | 'overdue' | 'upcoming';
          sortOrder: number;
        }
      > = {};

      filteredTasks.forEach(task => {
        const dateKey = task.createdAt ? task.createdAt.split('T')[0] : 'Historical';
        if (!groups[dateKey]) {
          const meta = getDateGroupMeta(dateKey);
          groups[dateKey] = {
            label: meta.label,
            badge: 'Archived',
            badgeType: 'today',
            sortOrder: meta.sortOrder,
            tasks: [],
          };
        }
        groups[dateKey].tasks.push(task);
      });

      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    } else if (isCompletedTab) {
      // Completed history groups (grouped by completedAt date)
      const groups: Record<
        string,
        {
          label: string;
          tasks: typeof filteredTasks;
          badge?: string;
          badgeType: 'today' | 'yesterday' | 'overdue' | 'upcoming';
          sortOrder: number;
        }
      > = {};

      filteredTasks.forEach(task => {
        const dateKey = task.completedAt ? task.completedAt.split('T')[0] : 'Earlier';
        if (!groups[dateKey]) {
          const meta = getDateGroupMeta(dateKey);
          groups[dateKey] = {
            label: meta.label,
            badge: meta.badge,
            badgeType: meta.badgeType,
            sortOrder: meta.sortOrder,
            tasks: [],
          };
        }
        groups[dateKey].tasks.push(task);
      });

      // Sort completed groups by date descending (most recent first)
      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    } else {
      // PENDING & Today groups (grouped by dueDate or createdAt)
      const groups: Record<
        string,
        {
          label: string;
          tasks: typeof filteredTasks;
          badge?: string;
          badgeType: 'today' | 'yesterday' | 'overdue' | 'upcoming';
          sortOrder: number;
        }
      > = {};

      filteredTasks.forEach(task => {
        const dateKey = task.dueDate || 'NO_DUE_DATE';
        if (!groups[dateKey]) {
          const meta = getDateGroupMeta(dateKey);
          groups[dateKey] = {
            label: meta.label,
            badge: meta.badge,
            badgeType: meta.badgeType,
            sortOrder: meta.sortOrder,
            tasks: [],
          };
        }
        groups[dateKey].tasks.push(task);
      });

      // Sort pending groups:
      // Overdue / Prior Days first (needs attention!), then Yesterday, then Today, then Upcoming
      return Object.entries(groups).sort((a, b) => {
        if (a[1].sortOrder !== b[1].sortOrder) {
          return a[1].sortOrder - b[1].sortOrder;
        }
        // Within the same bucket, sort by date
        return a[0].localeCompare(b[0]);
      });
    }
  }, [filteredTasks, isCompletedTab, isArchivedTab, todayStr]);

  const getSectionBadgeStyle = (badgeType: 'today' | 'yesterday' | 'overdue' | 'upcoming') => {
    switch (badgeType) {
      case 'overdue':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80';
      case 'yesterday':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800/80';
      case 'today':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/80';
    }
  };

  const getSectionIcon = (badgeType: 'today' | 'yesterday' | 'overdue' | 'upcoming', label?: string) => {
    if (label && label.includes('No Due Date')) {
      return <Inbox className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
    }
    switch (badgeType) {
      case 'overdue':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
      case 'yesterday':
        return <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
      case 'today':
        return <Calendar className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
      case 'upcoming':
        return <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-3.5 sm:py-5 max-w-6xl mx-auto w-full transition-colors">
      {/* Top Search & Filter Bar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, or #tags..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Layout Toggle (List vs Grid/Card style) */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs flex-shrink-0">
          <button
            onClick={() => setFilters(prev => ({ ...prev, layoutStyle: 'LIST' }))}
            className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              !isGrid
                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="List View"
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, layoutStyle: 'GRID' }))}
            className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              isGrid
                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Card / Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar (Only on Pending tab) */}
      {!isCompletedTab && !isArchivedTab && (
        <form onSubmit={handleQuickAdd} className="mb-6">
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
            <input
              type="text"
              placeholder="Add task... (e.g. Implement Auth Endpoint #CSAR) — press Enter"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-2 py-1 text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
              title="Open full task creator modal"
            >
              More Options
            </button>
            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="p-1.5 rounded-lg bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white transition flex-shrink-0"
              title="Add Task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* 🎯 The Big 3 (Today's Top Focus Tasks) */}
      {!isCompletedTab && !isArchivedTab && pinnedTasks.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-300 dark:border-amber-800/80 mb-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500 text-white font-bold text-xs shadow-xs">
                ★
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  The Big 3 — Today's Focus
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  High-impact priorities ({pinnedTasks.length}/3 pinned). Star any task to focus here.
                </p>
              </div>
            </div>
          </div>

          <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2.5'}>
            {pinnedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                project={projectMap.get(task.projectId)}
                variant={isGrid ? 'grid' : 'list'}
              />
            ))}
          </div>
        </div>
      )}

      {/* List Header */}
      <div className="flex items-center justify-between mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          {isArchivedTab ? (
            <Archive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          ) : isCompletedTab ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          )}
          <span>
            {isArchivedTab
              ? 'Archived Tasks Vault'
              : isCompletedTab
              ? 'Completed Accomplishments'
              : 'Pending & Active Tasks'}
          </span>
        </div>
        <span>{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</span>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-300 dark:border-neutral-800 rounded-2xl bg-slate-50/50 dark:bg-neutral-900/20">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-neutral-600">
            {isArchivedTab ? (
              <Archive className="w-6 h-6 text-purple-500" />
            ) : isCompletedTab ? (
              <Inbox className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
            {isArchivedTab
              ? 'No archived tasks found'
              : isCompletedTab
              ? 'No completed tasks found'
              : 'All caught up!'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1 max-w-sm mx-auto">
            {isArchivedTab
              ? 'Archived tasks preserve historical logged hours for reports while keeping active boards clean.'
              : isCompletedTab
              ? 'Complete tasks from the pending list to build your accomplishment log.'
              : 'Add your high-priority items above or start a stopwatch to begin your workday.'}
          </p>
        </div>
      ) : (
        /* Date-Divided Sections (Pending, Completed, & Archived) */
        <div className="space-y-7">
          {groupedSections.map(([dateKey, group]) => (
            <div key={dateKey} className="space-y-3">
              {/* Distinct Section Divider Header */}
              <div className="flex items-center justify-between gap-3 pt-2 pb-1.5 border-b border-slate-200 dark:border-neutral-800/80">
                <div className="flex items-center gap-2">
                  {getSectionIcon(group.badgeType, group.label)}
                  <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                    {group.label}
                  </h3>

                  {group.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSectionBadgeStyle(
                        group.badgeType
                      )}`}
                    >
                      {group.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">
                  {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              {/* Task Items (List or Grid/Cards layout with drag-and-drop) */}
              <div
                className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5' : 'space-y-2.5'}
                onDragLeave={e => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setTaskDragTarget(null);
                }}
              >
                {group.tasks.map(task => {
                  const isDragged = draggedTaskId === task.id;
                  const isTargetTop = taskDragTarget?.id === task.id && taskDragTarget.edge === 'top';
                  const isTargetBottom = taskDragTarget?.id === task.id && taskDragTarget.edge === 'bottom';
                  const canDrag = !isCompletedTab && !isArchivedTab;

                  return (
                    <div
                      key={task.id}
                      draggable={canDrag}
                      onDragStart={e => {
                        if (!canDrag) return;
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(task.id);
                      }}
                      onDragOver={e => {
                        if (!canDrag || !draggedTaskId || draggedTaskId === task.id) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        const rect = e.currentTarget.getBoundingClientRect();
                        const edge: 'top' | 'bottom' =
                          e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
                        if (!taskDragTarget || taskDragTarget.id !== task.id || taskDragTarget.edge !== edge) {
                          setTaskDragTarget({ id: task.id, edge });
                        }
                      }}
                      onDragLeave={e => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (taskDragTarget?.id === task.id) {
                          setTaskDragTarget(null);
                        }
                      }}
                      onDrop={e => {
                        if (!canDrag || !draggedTaskId || draggedTaskId === task.id) return;
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const edge: 'top' | 'bottom' =
                          taskDragTarget?.id === task.id
                            ? taskDragTarget.edge
                            : e.clientY < rect.top + rect.height / 2
                            ? 'top'
                            : 'bottom';

                        const srcIdx = tasks.findIndex(t => t.id === draggedTaskId);
                        let dstIdx = tasks.findIndex(t => t.id === task.id);
                        if (srcIdx >= 0 && dstIdx >= 0) {
                          if (edge === 'bottom') dstIdx += 1;
                          if (srcIdx < dstIdx) dstIdx -= 1;
                          if (srcIdx !== dstIdx) {
                            reorderTasks(srcIdx, dstIdx);
                          }
                        }
                        setDraggedTaskId(null);
                        setTaskDragTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setTaskDragTarget(null);
                      }}
                      className={`relative transition-all ${
                        isDragged ? 'opacity-30 scale-[0.99]' : ''
                      }`}
                    >
                      {/* Insertion line top */}
                      {isTargetTop && (
                        <div className="absolute -top-[3px] left-0 right-0 h-[2px] bg-indigo-500 rounded-full z-20 pointer-events-none flex items-center shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 -ml-1 ring-2 ring-white dark:ring-neutral-900 shadow-xs" />
                        </div>
                      )}

                      {/* Insertion line bottom */}
                      {isTargetBottom && (
                        <div className="absolute -bottom-[3px] left-0 right-0 h-[2px] bg-indigo-500 rounded-full z-20 pointer-events-none flex items-center shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 -ml-1 ring-2 ring-white dark:ring-neutral-900 shadow-xs" />
                        </div>
                      )}

                      <TaskCard
                        task={task}
                        project={projectMap.get(task.projectId)}
                        variant={isGrid ? 'grid' : 'list'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
