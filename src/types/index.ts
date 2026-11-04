export type TaskCategory = 'PROGRAMMING' | 'ADMIN' | 'MEETING' | 'OTHER';
export type WorkLocation = 'OFFICE' | 'HOME' | 'FIELD';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;       // ISO Timestamp
  endTime?: string;        // ISO Timestamp, null/undefined if active
  durationSeconds: number;
  isManualEntry: boolean;  // true if logged retroactively
  date: string;            // YYYY-MM-DD for reporting aggregation
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  location: WorkLocation;
  priority: TaskPriority;
  projectId: string;
  tags: string[];

  // Status & Lifecycle
  status: TaskStatus;
  createdAt: string;       // ISO Timestamp
  dueDate?: string;        // YYYY-MM-DD
  completedAt?: string;    // ISO Timestamp when marked DONE
  completionNote?: string; // Summary of deliverables or accomplishments on completion

  // Time Tracking
  timeEntries: TimeEntry[];
  totalDurationSeconds: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;           // Hex or Tailwind color
  isArchived: boolean;
}

export type ViewLayout = 'LIST' | 'GRID';
export type NavigationTab = 'PENDING' | 'CALENDAR' | 'COMPLETED';

export interface FilterState {
  searchQuery: string;
  selectedProjectId: string | 'ALL';
  selectedLocation: WorkLocation | 'ALL';
  selectedCategory: TaskCategory | 'ALL';
  selectedTag: string | 'ALL';
  statusTab: NavigationTab;
  layoutStyle: ViewLayout;
}

export interface ActiveTimerState {
  taskId: string | null;
  entryId: string | null;
  startTime: number | null; // Milliseconds timestamp (Date.now())
  elapsedSeconds: number;   // Total accumulated seconds (baseSeconds + sessionSeconds)
  sessionSeconds?: number;  // Duration of current running session
  baseSeconds?: number;     // Task accumulated seconds prior to starting this session
}
