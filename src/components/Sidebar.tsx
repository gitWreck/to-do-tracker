import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskCategory } from '@/types';
import { exportBackupJSON } from '@/lib/storage';
import {
  ListTodo,
  CheckCircle2,
  Calendar,
  Building2,
  Home,
  Code2,
  FileText,
  Users,
  FolderKanban,
  Download,
  Plus,
  Hash,
  CheckSquare,
  X,
  Pencil,
  Trash2,
  Check,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, isMobileDrawer = false }) => {
  const {
    tasks,
    projects,
    filters,
    setFilters,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
  } = useTasks();

  const handleAction = (cb: () => void) => {
    cb();
    if (isMobileDrawer && onCloseMobile) {
      onCloseMobile();
    }
  };

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [showAddProject, setShowAddProject] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState('#3b82f6');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const [draggedProjId, setDraggedProjId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ id: string; edge: 'top' | 'bottom' } | null>(null);

  const startEditingProject = (p: { id: string; name: string; color: string }) => {
    setEditingProjectId(p.id);
    setEditProjectName(p.name);
    setEditProjectColor(p.color);
    setDeletingProjectId(null);
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !editProjectName.trim()) return;
    updateProject(editingProjectId, {
      name: editProjectName.trim(),
      color: editProjectColor,
    });
    setEditingProjectId(null);
  };

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
    <aside
      className={`${
        isMobileDrawer
          ? 'w-72 max-w-[85vw] h-full shadow-2xl border-r'
          : 'hidden md:flex w-64 border-r shrink-0 sticky top-0 h-full self-stretch'
      } border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col select-none transition-colors z-30`}
    >
      {/* Brand Header */}
      <div className="p-4 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs flex-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">DevTracker</h1>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium truncate">Work & Time Tracker</p>
          </div>
        </div>
        {isMobileDrawer && (
          <button
            onClick={onCloseMobile}
            className="ml-2 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        
        {/* Work Context Switcher (Phase 5: Office vs Home) */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 block">
            Work Context
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
            <button
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, selectedLocation: 'ALL' })))}
              className={`py-1.5 px-2 text-xs font-medium rounded-lg transition text-center ${
                filters.selectedLocation === 'ALL'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, selectedLocation: 'OFFICE' })))}
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
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, selectedLocation: 'HOME' })))}
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
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, statusTab: 'PENDING' })))}
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
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, statusTab: 'CALENDAR' })))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition ${
                filters.statusTab === 'CALENDAR'
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-600/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Calendar View</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, statusTab: 'COMPLETED' })))}
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
                    handleAction(() =>
                      setFilters(prev => ({
                        ...prev,
                        selectedCategory: cat.id as TaskCategory | 'ALL',
                      }))
                    )
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

          <div
            className="space-y-1"
            onDragLeave={e => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragTarget(null);
            }}
          >
            <button
              onClick={() => handleAction(() => setFilters(prev => ({ ...prev, selectedProjectId: 'ALL' })))}
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

            {projects.map((project, index) => {
              const count = tasks.filter(t => t.projectId === project.id).length;
              const isSelected = filters.selectedProjectId === project.id;
              const isEditingThis = editingProjectId === project.id;
              const isDeletingThis = deletingProjectId === project.id;
              const isDragged = draggedProjId === project.id;
              const isTargetTop = dragTarget?.id === project.id && dragTarget.edge === 'top';
              const isTargetBottom = dragTarget?.id === project.id && dragTarget.edge === 'bottom';

              if (isEditingThis) {
                return (
                  <form
                    key={project.id}
                    onSubmit={handleSaveProjectEdit}
                    className="p-2 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-indigo-400 dark:border-indigo-600 space-y-2 shadow-xs"
                  >
                    <input
                      type="text"
                      value={editProjectName}
                      onChange={e => setEditProjectName(e.target.value)}
                      autoFocus
                      placeholder="Project name..."
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditProjectColor(color)}
                            className={`w-3.5 h-3.5 rounded-full transition ${
                              editProjectColor === color ? 'ring-2 ring-slate-800 dark:ring-white scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProjectId(null)}
                          className="px-2 py-0.5 text-[10px] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                );
              }

              if (isDeletingThis) {
                return (
                  <div
                    key={project.id}
                    className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1.5"
                  >
                    <p className="text-[11px] text-red-700 dark:text-red-300 font-medium leading-tight">
                      Delete "{project.name}"? Tasks will move to General.
                    </p>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDeletingProjectId(null)}
                        className="px-2 py-0.5 text-[10px] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteProject(project.id);
                          setDeletingProjectId(null);
                        }}
                        className="px-2.5 py-0.5 text-[10px] font-semibold bg-red-600 hover:bg-red-500 text-white rounded shadow-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={project.id}
                  draggable={!isEditingThis && !isDeletingThis}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', project.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedProjId(project.id);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (!draggedProjId || draggedProjId === project.id) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const edge: 'top' | 'bottom' = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
                    if (!dragTarget || dragTarget.id !== project.id || dragTarget.edge !== edge) {
                      setDragTarget({ id: project.id, edge });
                    }
                  }}
                  onDragLeave={e => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragTarget?.id === project.id) {
                      setDragTarget(null);
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (!draggedProjId || draggedProjId === project.id) {
                      setDragTarget(null);
                      setDraggedProjId(null);
                      return;
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    const edge: 'top' | 'bottom' =
                      dragTarget?.id === project.id
                        ? dragTarget.edge
                        : e.clientY < rect.top + rect.height / 2
                        ? 'top'
                        : 'bottom';

                    const srcIdx = projects.findIndex(p => p.id === draggedProjId);
                    let dstIdx = projects.findIndex(p => p.id === project.id);
                    if (srcIdx >= 0 && dstIdx >= 0) {
                      if (edge === 'bottom') {
                        dstIdx += 1;
                      }
                      if (srcIdx < dstIdx) {
                        dstIdx -= 1;
                      }
                      if (srcIdx !== dstIdx) {
                        reorderProjects(srcIdx, dstIdx);
                      }
                    }
                    setDraggedProjId(null);
                    setDragTarget(null);
                  }}
                  onDragEnd={() => {
                    setDraggedProjId(null);
                    setDragTarget(null);
                  }}
                  className={`group/proj relative w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition font-medium select-none ${
                    isDragged
                      ? 'opacity-30 scale-[0.98]'
                      : isSelected
                      ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  {/* Insertion Line (Top between projects) */}
                  {isTargetTop && (
                    <div className="absolute -top-[3px] left-0 right-0 h-[2px] bg-indigo-500 rounded-full z-20 pointer-events-none flex items-center shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 -ml-1 ring-2 ring-white dark:ring-neutral-900 shadow-xs" />
                    </div>
                  )}

                  {/* Insertion Line (Bottom between projects) */}
                  {isTargetBottom && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[2px] bg-indigo-500 rounded-full z-20 pointer-events-none flex items-center shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 -ml-1 ring-2 ring-white dark:ring-neutral-900 shadow-xs" />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-neutral-600 group-hover/proj:text-slate-500 dark:group-hover/proj:text-neutral-400 transition-colors shrink-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    <button
                      onClick={() =>
                        handleAction(() =>
                          setFilters(prev => ({
                            ...prev,
                            selectedProjectId: isSelected ? 'ALL' : project.id,
                          }))
                        )
                      }
                      className="flex items-center gap-2 truncate flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                    {/* Action buttons revealed on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/proj:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            reorderProjects(index, index - 1);
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-neutral-700 transition cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {index < projects.length - 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            reorderProjects(index, index + 1);
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-neutral-700 transition cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          startEditingProject(project);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-neutral-700 transition cursor-pointer"
                        title="Edit Project Name & Color"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setDeletingProjectId(project.id);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-neutral-700 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-neutral-500 tabular-nums">
                      {count}
                    </span>
                  </div>
                </div>
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
                  onClick={() => handleAction(() => setFilters(prev => ({ ...prev, selectedTag: 'ALL' })))}
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
                      handleAction(() =>
                        setFilters(prev => ({
                          ...prev,
                          selectedTag: isSelected ? 'ALL' : tag,
                        }))
                      )
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
