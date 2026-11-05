import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task, Project, ActiveTimerState, FilterState, TimeEntry } from '@/types';
import { ToastInfo } from '@/components/Toast';
import {
  loadTasks,
  saveTasks,
  loadProjects,
  saveProjects,
  loadActiveTimer,
  saveActiveTimer
} from '@/lib/storage';
import {
  fetchUserDataFromCloud,
  syncTaskToCloud,
  deleteCloudTask,
  syncProjectToCloud,
  migrateLocalDataToCloud,
  initRealtimeSync,
  broadcastTimerState,
  flushOfflineQueue,
  getOfflineQueue,
} from '@/lib/cloudSync';
import { useAuth } from './AuthContext';
import { getTodayDateString, getDatesInRange } from '@/lib/time';
import confetti from 'canvas-confetti';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  activeTimer: ActiveTimerState | null;
  activeTask: Task | null;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredTasks: Task[];
  isSyncing: boolean;
  isOnline: boolean;
  queuedMutationsCount: number;
  syncOfflineQueueNow: () => Promise<void>;

  // Completion commit modal state
  pendingCommitTask: Task | null;
  requestTaskComplete: (taskId: string) => void;
  commitTaskComplete: (taskId: string, options?: { note?: string; additionalSeconds?: number }) => void;
  cancelTaskComplete: () => void;
  toggleTaskComplete: (taskId: string) => void;

  // Delete confirmation modal state
  pendingDeleteTask: Task | null;
  requestTaskDelete: (taskId: string) => void;
  confirmPermanentDelete: (taskId: string) => void;
  cancelTaskDelete: () => void;
  archiveTask: (taskId: string) => void;

  // Toast notifications
  toast: ToastInfo | null;
  dismissToast: () => void;

  // Actions
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  toggleTimer: (taskId: string) => void;
  createTask: (data: Partial<Task> & { title: string }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addRetroactiveEntry: (data: {
    title: string;
    description?: string;
    projectId: string;
    category: Task['category'];
    location: Task['location'];
    priority: Task['priority'];
    date: string;
    endDate?: string;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    markCompleted: boolean;
  }) => void;
  createProject: (name: string, color: string) => Project;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthorized, isOfflineMode } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedMutationsCount, setQueuedMutationsCount] = useState<number>(() => {
    return typeof window !== 'undefined' ? getOfflineQueue().length : 0;
  });
  const hasLoadedFromCloud = useRef(false);

  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(loadActiveTimer);

  const [pendingCommitTaskId, setPendingCommitTaskId] = useState<string | null>(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedProjectId: 'ALL',
    selectedLocation: 'ALL',
    selectedCategory: 'ALL',
    selectedTag: 'ALL',
    statusTab: 'PENDING',
    layoutStyle: (typeof localStorage !== 'undefined' && 
      ((localStorage.getItem('devtracker_view_layout') || localStorage.getItem('ticktick_view_layout')) as 'LIST' | 'GRID')) || 'LIST',
  });

  // On cloud authentication, load data from Supabase (or migrate local to cloud on first setup)
  useEffect(() => {
    if (!user || !isAuthorized || isOfflineMode) return;
    if (hasLoadedFromCloud.current) return;

    const cancelledRef = { current: false };
    setIsSyncing(true);

    fetchUserDataFromCloud(user.id).then(async data => {
      if (cancelledRef.current) return;
      if (data && (data.tasks.length > 0 || data.projects.length > 0)) {
        setProjects(data.projects);
        setTasks(data.tasks);
      } else {
        // First-time sync: push local data to Supabase
        const currentProjects = loadProjects();
        const currentTasks = loadTasks();
        if (currentProjects.length > 0 || currentTasks.length > 0) {
          await migrateLocalDataToCloud(user.id, currentProjects, currentTasks);
        }
      }
      hasLoadedFromCloud.current = true;
      setIsSyncing(false);
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [user, isAuthorized, isOfflineMode]);

  // Persist layout style
  useEffect(() => {
    try {
      localStorage.setItem('devtracker_view_layout', filters.layoutStyle);
    } catch {
      // Ignore storage errors
    }
  }, [filters.layoutStyle]);

  // Supabase Realtime multi-device synchronization
  useEffect(() => {
    if (!user || !isAuthorized || isOfflineMode) return;

    const cleanupRealtime = initRealtimeSync(user.id, {
      onTaskUpsert: (incomingTask) => {
        setTasks(prev => {
          const index = prev.findIndex(t => t.id === incomingTask.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = incomingTask;
            return next;
          }
          return [incomingTask, ...prev];
        });
      },
      onTaskDelete: (deletedTaskId) => {
        setTasks(prev => prev.filter(t => t.id !== deletedTaskId));
        setActiveTimer(prev => (prev?.taskId === deletedTaskId ? null : prev));
      },
      onProjectUpsert: (incomingProj) => {
        setProjects(prev => {
          const index = prev.findIndex(p => p.id === incomingProj.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = incomingProj;
            return next;
          }
          return [...prev, incomingProj];
        });
      },
      onTimerBroadcast: (remoteTimer) => {
        setActiveTimer(remoteTimer);
      },
      onRefreshRequested: () => {
        fetchUserDataFromCloud(user.id).then(data => {
          if (data) {
            if (data.projects.length > 0) setProjects(data.projects);
            if (data.tasks.length > 0) setTasks(data.tasks);
          }
        });
      },
    });

    return () => {
      cleanupRealtime();
    };
  }, [user?.id, isAuthorized, isOfflineMode]);

  // Network reconnect & offline queue auto-flushing
  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    if (!user || !isAuthorized || isOfflineMode) return;

    setIsSyncing(true);
    try {
      const { flushed } = await flushOfflineQueue();
      setQueuedMutationsCount(getOfflineQueue().length);
      if (flushed > 0) {
        setToast({
          id: `flush-${Date.now()}`,
          message: `Reconnected! Synced ${flushed} offline ${flushed === 1 ? 'change' : 'changes'}.`,
        });
      }
      const cloudData = await fetchUserDataFromCloud(user.id);
      if (cloudData) {
        if (cloudData.projects.length > 0) setProjects(cloudData.projects);
        if (cloudData.tasks.length > 0) setTasks(cloudData.tasks);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, isAuthorized, isOfflineMode]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setQueuedMutationsCount(
        typeof customEvent.detail === 'number' ? customEvent.detail : getOfflineQueue().length
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('devtracker:queue_change', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('devtracker:queue_change', handleQueueChange);
    };
  }, [handleOnline, handleOffline]);

  // Tab foregrounding auto-flush & cloud refresh
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        setIsOnline(true);
        if (user && isAuthorized && !isOfflineMode) {
          const { flushed } = await flushOfflineQueue();
          setQueuedMutationsCount(getOfflineQueue().length);
          if (flushed > 0) {
            setToast({
              id: `flush-vis-${Date.now()}`,
              message: `Synced ${flushed} queued ${flushed === 1 ? 'change' : 'changes'}.`,
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAuthorized, isOfflineMode]);

  const syncOfflineQueueNow = useCallback(async () => {
    if (!navigator.onLine) {
      setToast({
        id: `offline-warn-${Date.now()}`,
        message: 'Device is offline. Changes are saved locally and will auto-sync when connected.',
      });
      return;
    }
    setIsSyncing(true);
    try {
      const { flushed } = await flushOfflineQueue();
      setQueuedMutationsCount(getOfflineQueue().length);
      if (user && isAuthorized && !isOfflineMode) {
        const cloudData = await fetchUserDataFromCloud(user.id);
        if (cloudData) {
          if (cloudData.projects.length > 0) setProjects(cloudData.projects);
          if (cloudData.tasks.length > 0) setTasks(cloudData.tasks);
        }
      }
      setToast({
        id: `manual-sync-${Date.now()}`,
        message: flushed > 0 ? `Synced ${flushed} offline ${flushed === 1 ? 'change' : 'changes'}!` : 'All data is up to date with cloud.',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, isAuthorized, isOfflineMode]);

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

  // High precision timer interval (calculates delta against Date.now())
  useEffect(() => {
    if (!activeTimer?.startTime) return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev?.startTime) return null;
        const sessionElapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        const base = prev.baseSeconds || 0;
        return {
          ...prev,
          sessionSeconds: sessionElapsed,
          elapsedSeconds: base + sessionElapsed,
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [activeTimer?.startTime]);

  const activeTask = useMemo(() => {
    if (!activeTimer?.taskId) return null;
    return tasks.find(t => t.id === activeTimer.taskId) || null;
  }, [activeTimer, tasks]);

  const pendingCommitTask = useMemo(() => {
    if (!pendingCommitTaskId) return null;
    return tasks.find(t => t.id === pendingCommitTaskId) || null;
  }, [pendingCommitTaskId, tasks]);

  const pendingDeleteTask = useMemo(() => {
    if (!pendingDeleteTaskId) return null;
    return tasks.find(t => t.id === pendingDeleteTaskId) || null;
  }, [pendingDeleteTaskId, tasks]);

  // Toast dismiss timer
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const dismissToast = () => setToast(null);

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
          const updatedTask: Task = {
            ...t,
            timeEntries: updatedEntries,
            totalDurationSeconds: newTotal,
            status: t.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
          };
          if (user && isAuthorized && !isOfflineMode) {
            syncTaskToCloud(user.id, updatedTask);
          }
          return updatedTask;
        }
        return t;
      })
    );

    setActiveTimer(null);
    if (user && isAuthorized && !isOfflineMode) {
      broadcastTimerState(user.id, null);
    }
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
    const baseSeconds = target.totalDurationSeconds || 0;

    const nextTimer: ActiveTimerState = {
      taskId,
      entryId,
      startTime: now,
      baseSeconds,
      sessionSeconds: 0,
      elapsedSeconds: baseSeconds,
    };

    setActiveTimer(nextTimer);
    if (user && isAuthorized && !isOfflineMode) {
      broadcastTimerState(user.id, nextTimer);
    }

    // Mark task as IN_PROGRESS if it was PENDING
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId && t.status === 'PENDING') {
          const updated: Task = { ...t, status: 'IN_PROGRESS' };
          if (user && isAuthorized && !isOfflineMode) {
            syncTaskToCloud(user.id, updated);
          }
          return updated;
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

  // Step 1: Prompt before marking done
  const requestTaskComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If task is ALREADY completed, clicking checkbox reopens it immediately with an Undo toast
    if (task.status === 'COMPLETED') {
      const prevCompletedAt = task.completedAt;
      const reopenedTask: Task = { ...task, status: 'PENDING', completedAt: undefined };
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? reopenedTask : t))
      );
      if (user && isAuthorized && !isOfflineMode) {
        syncTaskToCloud(user.id, reopenedTask);
      }
      setToast({
        id: `reopen-${Date.now()}`,
        message: `Reopened "${task.title}"`,
        undoAction: () => {
          const revertedTask: Task = { ...task, status: 'COMPLETED', completedAt: prevCompletedAt };
          setTasks(prev =>
            prev.map(t => (t.id === taskId ? revertedTask : t))
          );
          if (user && isAuthorized && !isOfflineMode) {
            syncTaskToCloud(user.id, revertedTask);
          }
        },
      });
      return;
    }

    // Otherwise, open the Commit Completion Modal!
    setPendingCommitTaskId(taskId);
  };

  const cancelTaskComplete = () => {
    setPendingCommitTaskId(null);
  };

  // Step 2: Confirmed commit of task completion
  const commitTaskComplete = (taskId: string, options?: { note?: string; additionalSeconds?: number }) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If active timer is on this task, stop the timer and commit it
    if (activeTimer?.taskId === taskId) {
      stopTimer();
    }

    const previousTaskState = { ...task };
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];

    const extraSeconds = options?.additionalSeconds || 0;
    let updatedEntries = [...(task.timeEntries || [])];

    if (extraSeconds > 0) {
      const extraEntry: TimeEntry = {
        id: `extra-entry-${Date.now()}`,
        taskId,
        startTime: nowIso,
        endTime: nowIso,
        durationSeconds: extraSeconds,
        isManualEntry: true,
        date: dateStr,
      };
      updatedEntries.push(extraEntry);
    }

    const newTotalSeconds = (task.totalDurationSeconds || 0) + extraSeconds;
    const completedTask: Task = {
      ...task,
      status: 'COMPLETED',
      completedAt: nowIso,
      completionNote: options?.note || task.completionNote,
      timeEntries: updatedEntries,
      totalDurationSeconds: newTotalSeconds,
    };

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return completedTask;
        }
        return t;
      })
    );

    if (user && isAuthorized && !isOfflineMode) {
      syncTaskToCloud(user.id, completedTask);
    }

    setPendingCommitTaskId(null);

    // Celebratory Confetti!
    try {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // Safe fallback
    }

    // Set Undo Toast
    setToast({
      id: `complete-${Date.now()}`,
      message: `Committed "${task.title}" as DONE!`,
      undoAction: () => {
        setTasks(prev => prev.map(t => (t.id === taskId ? previousTaskState : t)));
        if (user && isAuthorized && !isOfflineMode) {
          syncTaskToCloud(user.id, previousTaskState);
        }
      },
    });
  };

  // Keep toggleTaskComplete as an alias to requestTaskComplete so all existing controls show the prompt!
  const toggleTaskComplete = requestTaskComplete;

  const createTask = (data: Partial<Task> & { title: string }): Task => {
    // Hashtag parser: e.g. "Fix API #CSAR #Backend"
    const parsedTags: string[] = [...(data.tags || [])];
    const hashRegex = /#([a-zA-Z0-9_-]+)/g;
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
      createdAt: data.createdAt || new Date().toISOString(),
      timeEntries: [],
      totalDurationSeconds: 0,
      dueDate: data.dueDate || getTodayDateString(),
    };

    setTasks(prev => [newTask, ...prev]);

    if (user && isAuthorized && !isOfflineMode) {
      syncTaskToCloud(user.id, newTask);
    }

    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, ...updates };
          if (user && isAuthorized && !isOfflineMode) {
            syncTaskToCloud(user.id, updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Request delete prompt modal
  const requestTaskDelete = (taskId: string) => {
    setPendingDeleteTaskId(taskId);
  };

  const cancelTaskDelete = () => {
    setPendingDeleteTaskId(null);
  };

  // Archive task: remove from active board but keep hours intact for reports
  const archiveTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (activeTimer?.taskId === taskId) {
      stopTimer();
    }

    const archivedTask: Task = { ...task, status: 'ARCHIVED' };
    setTasks(prev => prev.map(t => (t.id === taskId ? archivedTask : t)));

    if (user && isAuthorized && !isOfflineMode) {
      syncTaskToCloud(user.id, archivedTask);
    }

    setPendingDeleteTaskId(null);

    setToast({
      id: `archive-${Date.now()}`,
      message: `Archived "${task.title}" (hours preserved)`,
      undoAction: () => {
        setTasks(prev => prev.map(t => (t.id === taskId ? task : t)));
        if (user && isAuthorized && !isOfflineMode) {
          syncTaskToCloud(user.id, task);
        }
      },
    });
  };

  // Confirm permanent deletion from local & Supabase database
  const confirmPermanentDelete = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    if (activeTimer?.taskId === taskId) {
      setActiveTimer(null);
      if (user && isAuthorized && !isOfflineMode) {
        broadcastTimerState(user.id, null);
      }
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));

    if (user && isAuthorized && !isOfflineMode) {
      deleteCloudTask(user.id, taskId);
    }

    setPendingDeleteTaskId(null);

    // Toast with Undo action for deletion
    setToast({
      id: `delete-${Date.now()}`,
      message: `Permanently deleted "${taskToDelete.title}"`,
      undoAction: () => {
        setTasks(prev => [taskToDelete, ...prev]);
        if (user && isAuthorized && !isOfflineMode) {
          syncTaskToCloud(user.id, taskToDelete);
        }
      },
    });
  };

  // Alias deleteTask to requestTaskDelete so all UI buttons trigger the prompt modal!
  const deleteTask = requestTaskDelete;

  const addRetroactiveEntry = (data: {
    title: string;
    description?: string;
    projectId: string;
    category: Task['category'];
    location: Task['location'];
    priority: Task['priority'];
    date: string;
    endDate?: string;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    markCompleted: boolean;
  }) => {
    const isRange = !!data.endDate && data.endDate > data.date;
    const targetDates = isRange ? getDatesInRange(data.date, data.endDate!) : [data.date];

    const startMs = new Date(`${data.date}T${data.startTime}:00`).getTime();
    const endMs = new Date(`${data.date}T${data.endTime}:00`).getTime();
    const durationPerDay = Math.max(60, Math.floor((endMs - startMs) / 1000));
    const totalDuration = durationPerDay * targetDates.length;

    const taskId = `task-${Date.now()}`;

    const entries: TimeEntry[] = targetDates.map((d, idx) => ({
      id: `manual-entry-${Date.now()}-${idx}`,
      taskId,
      startTime: new Date(`${d}T${data.startTime}:00`).toISOString(),
      endTime: new Date(`${d}T${data.endTime}:00`).toISOString(),
      durationSeconds: durationPerDay,
      isManualEntry: true,
      date: d,
    }));

    const firstIso = new Date(`${data.date}T${data.startTime}:00`).toISOString();
    const lastDayStr = isRange ? data.endDate! : data.date;
    const finalEndIso = new Date(`${lastDayStr}T${data.endTime}:00`).toISOString();

    // Extract hashtags from title and description
    const parsedTags: string[] = [];
    const hashRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    const combinedText = `${data.title} ${data.description || ''}`;
    while ((match = hashRegex.exec(combinedText)) !== null) {
      const tag = match[1];
      if (!parsedTags.includes(tag)) {
        parsedTags.push(tag);
      }
    }

    const newTask: Task = {
      id: taskId,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      category: data.category,
      location: data.location,
      priority: data.priority,
      projectId: data.projectId,
      tags: parsedTags,
      status: data.markCompleted ? 'COMPLETED' : 'PENDING',
      createdAt: firstIso,
      completedAt: data.markCompleted ? finalEndIso : undefined,
      dueDate: lastDayStr,
      timeEntries: entries,
      totalDurationSeconds: totalDuration,
    };

    setTasks(prev => [newTask, ...prev]);

    if (user && isAuthorized && !isOfflineMode) {
      syncTaskToCloud(user.id, newTask);
    }

    setToast({
      id: `retro-${Date.now()}`,
      message: isRange
        ? `Logged ${targetDates.length}-day work: "${data.title}"`
        : `Logged past work: "${data.title}"`,
    });
  };

  const createProject = (name: string, color: string): Project => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      color,
      isArchived: false,
    };
    setProjects(prev => [...prev, newProj]);

    if (user && isAuthorized && !isOfflineMode) {
      syncProjectToCloud(user.id, newProj);
    }

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
      // In CALENDAR view, include both pending and completed tasks (omit archived)
      else if (filters.statusTab === 'CALENDAR') {
        if (task.status === 'ARCHIVED') return false;
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
        isSyncing,
        isOnline,
        queuedMutationsCount,
        syncOfflineQueueNow,
        pendingCommitTask,
        requestTaskComplete,
        commitTaskComplete,
        cancelTaskComplete,
        toggleTaskComplete,
        pendingDeleteTask,
        requestTaskDelete,
        confirmPermanentDelete,
        cancelTaskDelete,
        archiveTask,
        toast,
        dismissToast,
        startTimer,
        stopTimer,
        toggleTimer,
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
