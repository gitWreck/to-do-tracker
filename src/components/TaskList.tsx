import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCard } from './TaskCard';
import {
  Search,
  Plus,
  CheckCircle2,
  ListTodo,
  Calendar,
  Sparkles,
  Inbox,
  LayoutList,
  LayoutGrid
} from 'lucide-react';

interface TaskListProps {
  onOpenCreateModal: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onOpenCreateModal }) => {
  const {
    filteredTasks,
    projects,
    filters,
    setFilters,
    createTask,
  } = useTasks();

  const [quickTitle, setQuickTitle] = useState('');

  const projectMap = new Map(projects.map(p => [p.id, p]));

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

  // Group completed tasks by date if on completed tab
  const isCompletedTab = filters.statusTab === 'COMPLETED';
  const isGrid = filters.layoutStyle === 'GRID';

  const groupedTasks = React.useMemo(() => {
    if (!isCompletedTab) return null;

    const groups: Record<string, typeof filteredTasks> = {};
    filteredTasks.forEach(task => {
      const dateKey = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Earlier';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });
    return groups;
  }, [filteredTasks, isCompletedTab]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 max-w-6xl mx-auto w-full transition-colors">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, or #tags..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
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
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs flex-shrink-0">
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
      {!isCompletedTab && (
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

      {/* List Header */}
      <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          {isCompletedTab ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          )}
          <span>{isCompletedTab ? 'Completed Accomplishments' : 'Pending & Active Tasks'}</span>
        </div>
        <span>{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</span>
      </div>

      {/* Tasks List / Grid */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-300 dark:border-neutral-800 rounded-2xl bg-slate-50/50 dark:bg-neutral-900/20">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-neutral-600">
            {isCompletedTab ? <Inbox className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-amber-500" />}
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
            {isCompletedTab ? 'No completed tasks found' : 'All caught up!'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1 max-w-sm mx-auto">
            {isCompletedTab
              ? 'Complete tasks from the pending list to build your accomplishment log.'
              : 'Add your high-priority items above or start a stopwatch to begin your workday.'}
          </p>
        </div>
      ) : isCompletedTab && groupedTasks ? (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([dateLabel, tasksInDate]) => (
            <div key={dateLabel} className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 pt-2 border-b border-slate-200 dark:border-neutral-800 pb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                <span>{dateLabel}</span>
                <span className="text-[11px] text-slate-400 dark:text-neutral-600">({tasksInDate.length})</span>
              </div>
              <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5' : 'space-y-2'}>
                {tasksInDate.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={projectMap.get(task.projectId)}
                    variant={isGrid ? 'grid' : 'list'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5' : 'space-y-2.5'}>
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              project={projectMap.get(task.projectId)}
              variant={isGrid ? 'grid' : 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
