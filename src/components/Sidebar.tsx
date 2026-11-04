import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCategory } from '@/types';
import { exportBackupJSON } from '@/lib/storage';
import {
  ListTodo,
  CheckCircle2,
  Building2,
  Home,
  Code2,
  FileText,
  Users,
  FolderKanban,
  Download,
  Plus,
  Hash,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    tasks,
    projects,
    filters,
    setFilters,
    createProject,
  } = useTasks();

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [showAddProject, setShowAddProject] = useState(false);

  // Compute counts
  const pendingCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  // Extract all distinct tags from tasks
  const allTags = Array.from(
    new Set(tasks.flatMap(t => t.tags || []))
  ).filter(Boolean);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
    setShowAddProject(false);
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col h-[calc(100vh-57px)] select-none transition-colors">
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        
        {/* Work Context Switcher (Phase 5: Office vs Home) */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 block">
            Work Context
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
            <button
              onClick={() => setFilters(prev => ({ ...prev, selectedLocation: 'ALL' }))}
              className={`py-1.5 px-2 text-xs font-medium rounded-lg transition text-center ${
                filters.selectedLocation === 'ALL'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, selectedLocation: 'OFFICE' }))}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg transition ${
                filters.selectedLocation === 'OFFICE'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/30 dark:border-blue-500/50 dark:text-blue-300 font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Office
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, selectedLocation: 'HOME' }))}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg transition ${
                filters.selectedLocation === 'HOME'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-600/30 dark:border-emerald-500/50 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>
          </div>
        </div>

        {/* View Selection: Active / Today vs Completed History */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 block">
            Task Views
          </label>
          <div className="space-y-1">
            <button
              onClick={() => setFilters(prev => ({ ...prev, statusTab: 'PENDING' }))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition ${
                filters.statusTab === 'PENDING'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Pending / Today</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, statusTab: 'COMPLETED' }))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition ${
                filters.statusTab === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Completed History</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {completedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Functional Category Filter Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Category
            </label>
            {filters.selectedCategory !== 'ALL' && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, selectedCategory: 'ALL' }))}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All', icon: null },
              { id: 'PROGRAMMING', label: 'Programming', icon: Code2 },
              { id: 'ADMIN', label: 'Admin', icon: FileText },
              { id: 'MEETING', label: 'Meetings', icon: Users },
            ].map(cat => {
              const isSelected = filters.selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      selectedCategory: cat.id as TaskCategory | 'ALL',
                    }))
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition font-medium ${
                    isSelected
                      ? 'bg-slate-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Projects
            </label>
            <button
              onClick={() => setShowAddProject(!showAddProject)}
              className="p-1 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
              title="Add Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showAddProject && (
            <form onSubmit={handleCreateProject} className="mb-2.5 p-2 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-2">
              <input
                type="text"
                placeholder="Project Name (e.g. CSAR)"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                autoFocus
                className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectColor(color)}
                      className={`w-4 h-4 rounded-full transition ${
                        newProjectColor === color ? 'ring-2 ring-slate-800 dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-2 py-0.5 text-[11px] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-1">
            <button
              onClick={() => setFilters(prev => ({ ...prev, selectedProjectId: 'ALL' }))}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition font-medium ${
                filters.selectedProjectId === 'ALL'
                  ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                <span>All Projects</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">{tasks.length}</span>
            </button>

            {projects.map(project => {
              const count = tasks.filter(t => t.projectId === project.id).length;
              const isSelected = filters.selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      selectedProjectId: isSelected ? 'ALL' : project.id,
                    }))
                  }
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition font-medium ${
                    isSelected
                      ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 flex-shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags cloud */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                Tags
              </label>
              {filters.selectedTag !== 'ALL' && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, selectedTag: 'ALL' }))}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => {
                const isSelected = filters.selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        selectedTag: isSelected ? 'ALL' : tag,
                      }))
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Hash className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-500" />
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Footer: Data Backup */}
      <div className="p-3 border-t border-slate-200 dark:border-neutral-800/80 bg-slate-50 dark:bg-neutral-900/30">
        <button
          onClick={exportBackupJSON}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 shadow-xs transition"
          title="Download local JSON backup"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
          <span>Export Backup JSON</span>
        </button>
      </div>
    </aside>
  );
};
