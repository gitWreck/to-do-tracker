import { Task, Project, ActiveTimerState } from '@/types';

const TASKS_STORAGE_KEY = 'ticktick_clone_tasks_v1';
const PROJECTS_STORAGE_KEY = 'ticktick_clone_projects_v1';
const TIMER_STORAGE_KEY = 'ticktick_clone_active_timer_v1';

export const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-csar', name: 'CSAR', color: '#3b82f6', isArchived: false },
  { id: 'proj-for200', name: 'FOR 200', color: '#10b981', isArchived: false },
  { id: 'proj-admin', name: 'Administrative', color: '#f59e0b', isArchived: false },
  { id: 'proj-general', name: 'General Dev', color: '#8b5cf6', isArchived: false },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Curriculum Update API Endpoint & Unit Tests #CSAR',
    description: 'Implement backend validation and tests for curriculum updates',
    category: 'PROGRAMMING',
    location: 'HOME',
    priority: 'HIGH',
    projectId: 'proj-csar',
    tags: ['CSAR', 'Backend'],
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 11700000).toISOString(),
    totalDurationSeconds: 11700, // 3.25 hrs
    timeEntries: [
      {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(Date.now() - 86400000 * 2 + 30600000).toISOString(), // 08:30
        endTime: new Date(Date.now() - 86400000 * 2 + 42300000).toISOString(),   // 11:45
        durationSeconds: 11700,
        isManualEntry: false,
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      }
    ],
  },
  {
    id: 'task-2',
    title: 'Manuscript Workshop Non-Attendance Email Follow-up',
    description: 'Email committee regarding absences and minutes',
    category: 'ADMIN',
    location: 'OFFICE',
    priority: 'MEDIUM',
    projectId: 'proj-for200',
    tags: ['FOR200', 'Email'],
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 51300000).toISOString(),
    totalDurationSeconds: 4500, // 1.25 hrs
    timeEntries: [
      {
        id: 'entry-2',
        taskId: 'task-2',
        startTime: new Date(Date.now() - 86400000 * 2 + 46800000).toISOString(), // 13:00
        endTime: new Date(Date.now() - 86400000 * 2 + 51300000).toISOString(),   // 14:15
        durationSeconds: 4500,
        isManualEntry: true,
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      }
    ],
  },
  {
    id: 'task-3',
    title: 'Database Schema Migration & Integration Verification',
    description: 'Run migrations for the task tables and verify indexes',
    category: 'PROGRAMMING',
    location: 'OFFICE',
    priority: 'HIGH',
    projectId: 'proj-csar',
    tags: ['CSAR', 'Database'],
    status: 'PENDING',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    totalDurationSeconds: 0,
    timeEntries: [],
  },
  {
    id: 'task-4',
    title: 'Weekly Team Standup & Sync',
    description: 'Review blocked items and upcoming roadmap deliverables',
    category: 'MEETING',
    location: 'OFFICE',
    priority: 'MEDIUM',
    projectId: 'proj-admin',
    tags: ['Standup'],
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    totalDurationSeconds: 0,
    timeEntries: [],
  }
];

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return INITIAL_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to storage:', err);
  }
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      saveTasks(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load tasks from storage:', err);
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to storage:', err);
  }
}

export function loadActiveTimer(): ActiveTimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveActiveTimer(state: ActiveTimerState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } else {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error('Failed to save timer state:', err);
  }
}

export function exportBackupJSON(): void {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: loadProjects(),
    tasks: loadTasks(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todo_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
