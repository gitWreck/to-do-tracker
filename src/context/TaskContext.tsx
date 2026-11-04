import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Task, Project, ActiveTimerState, FilterState, TimeEntry } from '@/types';
import {
  loadTasks,
  saveTasks,
  loadProjects,
  saveProjects,
  loadActiveTimer,
  saveActiveTimer
} from '@/lib/storage';
import { getTodayDateString } from '@/lib/time';
import confetti from 'canvas-confetti';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  activeTimer: ActiveTimerState | null;
  activeTask: Task | null;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredTasks: Task[];
  
  // Actions
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  toggleTimer: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  createTask: (data: Partial<Task> & { title: string }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addRetroactiveEntry: (data: {
    title: string;
    projectId: string;
    category: Task['category'];
    location: Task['location'];
    priority: Task['priority'];
    date: string;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    markCompleted: boolean;
  }) => void;
  createProject: (name: string, color: string) => Project;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(loadActiveTimer);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedProjectId: 'ALL',
    selectedLocation: 'ALL',
    selectedCategory: 'ALL',
    selectedTag: 'ALL',
    statusTab: 'PENDING',
  });

  // Keep ref for activeTimer so timer interval can access latest state without re-creating interval
  const activeTimerRef = useRef(activeTimer);
  activeTimerRef.current = activeTimer;

  // Persist tasks and projects whenever they change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveActiveTimer(activeTimer);
  }, [activeTimer]);

  // High precision timer interval (updates every 500ms based on real clock delta)
  useEffect(() => {
    if (!activeTimer?.startTime) return;

    const interval = setInterval(() => {
      if (!activeTimerRef.current?.startTime) return;
      const elapsed = Math.floor((Date.now() - activeTimerRef.current.startTime) / 1000);
      setActiveTimer(prev => (prev ? { ...prev, elapsedSeconds: elapsed } : null));
    }, 500);

    return () => clearInterval(interval);
  }, [activeTimer?.startTime]);

  const activeTask = useMemo(() => {
    if (!activeTimer?.taskId) return null;
    return tasks.find(t => t.id === activeTimer.taskId) || null;
  }, [activeTimer?.taskId, tasks]);

  // Stop running timer and commit time entry to the task
  const stopTimer = () => {
    if (!activeTimer || !activeTimer.taskId || !activeTimer.startTime) return;

    const now = Date.now();
    const durationSeconds = Math.max(1, Math.floor((now - activeTimer.startTime) / 1000));
    const nowIso = new Date(now).toISOString();
    const startIso = new Date(activeTimer.startTime).toISOString();
    const dateStr = startIso.split('T')[0];

    const completedEntry: TimeEntry = {
      id: activeTimer.entryId || `entry-${Date.now()}`,
      taskId: activeTimer.taskId,
      startTime: startIso,
      endTime: nowIso,
      durationSeconds,
      isManualEntry: false,
      date: dateStr,
    };

    setTasks(prev =>
      prev.map(t => {
        if (t.id === activeTimer.taskId) {
          const updatedEntries = [...(t.timeEntries || []), completedEntry];
          const newTotal = (t.totalDurationSeconds || 0) + durationSeconds;
          return {
            ...t,
            timeEntries: updatedEntries,
            totalDurationSeconds: newTotal,
            // Keep IN_PROGRESS or revert to PENDING if not completed
            status: t.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
          };
        }
        return t;
      })
    );

    setActiveTimer(null);
  };

  // Start timer for a task. Enforces single active task rule!
  const startTimer = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    // If another timer is active, stop it first
    if (activeTimer && activeTimer.taskId !== taskId) {
      stopTimer();
    }

    const now = Date.now();
    const entryId = `entry-${now}-${Math.random().toString(36).substring(2, 7)}`;

    setActiveTimer({
      taskId,
      entryId,
      startTime: now,
      elapsedSeconds: 0,
    });

    // Mark task as IN_PROGRESS if it was PENDING
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId && t.status === 'PENDING') {
          return { ...t, status: 'IN_PROGRESS' };
        }
        return t;
      })
    );
  };

  const toggleTimer = (taskId: string) => {
    if (activeTimer?.taskId === taskId) {
      stopTimer();
    } else {
      startTimer(taskId);
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const willBeCompleted = task.status !== 'COMPLETED';

    // If active timer is on this task and we mark it complete, stop the timer first
    if (activeTimer?.taskId === taskId) {
      stopTimer();
    }

    if (willBeCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        // Safe fallback if confetti isn't available
      }
    }

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: willBeCompleted ? 'COMPLETED' : 'PENDING',
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const createTask = (data: Partial<Task> & { title: string }): Task => {
    // Hashtag parser: e.g. "Fix API #CSAR #Backend"
    const parsedTags: string[] = [...(data.tags || [])];
    const hashRegex = /#([a-zA-Z0-9_\-]+)/g;
    let match;
    while ((match = hashRegex.exec(data.title)) !== null) {
      const tag = match[1];
      if (!parsedTags.includes(tag)) {
        parsedTags.push(tag);
      }
    }

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      description: data.description?.trim(),
      category: data.category || 'PROGRAMMING',
      location: data.location || 'OFFICE',
      priority: data.priority || 'MEDIUM',
      projectId: data.projectId || projects[0]?.id || 'proj-general',
      tags: parsedTags,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      timeEntries: [],
      totalDurationSeconds: 0,
      dueDate: data.dueDate || getTodayDateString(),
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    if (activeTimer?.taskId === taskId) {
      setActiveTimer(null);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addRetroactiveEntry = (data: {
    title: string;
    projectId: string;
    category: Task['category'];
    location: Task['location'];
    priority: Task['priority'];
    date: string;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    markCompleted: boolean;
  }) => {
    const startIso = new Date(`${data.date}T${data.startTime}:00`).toISOString();
    const endIso = new Date(`${data.date}T${data.endTime}:00`).toISOString();
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const durationSeconds = Math.max(60, Math.floor((endMs - startMs) / 1000));

    const entryId = `manual-entry-${Date.now()}`;
    const newEntry: TimeEntry = {
      id: entryId,
      taskId: '',
      startTime: startIso,
      endTime: endIso,
      durationSeconds,
      isManualEntry: true,
      date: data.date,
    };

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title.trim(),
      category: data.category,
      location: data.location,
      priority: data.priority,
      projectId: data.projectId,
      tags: [],
      status: data.markCompleted ? 'COMPLETED' : 'PENDING',
      createdAt: startIso,
      completedAt: data.markCompleted ? endIso : undefined,
      dueDate: data.date,
      timeEntries: [{ ...newEntry, taskId: `task-${Date.now()}` }],
      totalDurationSeconds: durationSeconds,
    };

    setTasks(prev => [newTask, ...prev]);
  };

  const createProject = (name: string, color: string): Project => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      color,
      isArchived: false,
    };
    setProjects(prev => [...prev, newProj]);
    return newProj;
  };

  // Filter tasks based on search, project, location, category, tag, and statusTab
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filters.statusTab === 'PENDING') {
        if (task.status === 'COMPLETED' || task.status === 'ARCHIVED') return false;
      } else if (filters.statusTab === 'COMPLETED') {
        if (task.status !== 'COMPLETED') return false;
      }

      // Project filter
      if (filters.selectedProjectId !== 'ALL' && task.projectId !== filters.selectedProjectId) {
        return false;
      }

      // Location filter (OFFICE vs HOME vs FIELD)
      if (filters.selectedLocation !== 'ALL' && task.location !== filters.selectedLocation) {
        return false;
      }

      // Category filter
      if (filters.selectedCategory !== 'ALL' && task.category !== filters.selectedCategory) {
        return false;
      }

      // Tag filter
      if (filters.selectedTag !== 'ALL' && !task.tags.includes(filters.selectedTag)) {
        return false;
      }

      // Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesTag = task.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        activeTimer,
        activeTask,
        filters,
        setFilters,
        filteredTasks,
        startTimer,
        stopTimer,
        toggleTimer,
        toggleTaskComplete,
        createTask,
        updateTask,
        deleteTask,
        addRetroactiveEntry,
        createProject,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
