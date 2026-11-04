# TickTick Clone: Full Engineering Roadmap & Checklist

A comprehensive specification and step-by-step checklist to build a lightweight, developer-focused work and task tracker featuring real-time stopwatches, persistent pending tasks, floating overlay widgets, and spreadsheet exports.

---

## 1. System Architecture & Tech Stack

```
+-------------------------------------------------------------+
|               Client Presentation Layer                     |
|  - Next.js 15 / React 19 + Tailwind CSS + Lucide Icons     |
|  - Floating Mini-Widget / Tray Window: Tauri v2 (Rust)      |
+-------------------------------------------------------------+
                              |
                     IPC / REST / WebSocket
                              |
+-------------------------------------------------------------+
|                  Application Logic Layer                    |
|  - State Management: Zustand (with local storage persist)   |
|  - Global Timer Engine: Web Worker / Background Thread      |
|  - Filter Engine: Work vs. Home context, tags, priorities   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                      Data Persistence                       |
|  - Local-first: SQLite / Turso via Drizzle ORM (or Prisma)  |
|  - Backup / Sync: Local SQLite file or optional Postgres DB |
+-------------------------------------------------------------+
```

### Recommended Stack Breakdown
* **Desktop Runtime:** [Tauri v2](https://v2.tauri.app/) (Lightweight, ~10MB RAM vs. 200MB+ for Electron; supports system tray, always-on-top floating mini-windows, and native hotkeys).
* **Frontend:** React + Next.js (or Vite + React) with TypeScript, Tailwind CSS, and `shadcn/ui`.
* **State / Timer:** Zustand (`persist` middleware) paired with a dedicated Web Worker so the timer keeps ticking even when the window is hidden or throttled.
* **Database:** SQLite via Drizzle ORM (runs locally on your PC so no government work data ever touches a remote server without your permission).

---

## 2. Core Data Models

```typescript
// Task Definition
export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'PROGRAMMING' | 'ADMIN' | 'MEETING' | 'OTHER';
  location: 'OFFICE' | 'HOME' | 'FIELD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  tags: string[];
  
  // Status & Lifecycle
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;       // ISO Timestamp
  dueDate?: string;        // ISO Date (YYYY-MM-DD)
  completedAt?: string;    // ISO Timestamp when marked [DONE]
  
  // Time Tracking Logs
  timeEntries: TimeEntry[];
  totalDurationSeconds: number;
}

// Time Segment
export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;       // ISO Timestamp
  endTime?: string;        // null if currently active
  durationSeconds: number;
  isManualEntry: boolean;  // true if logged retroactively
}

// Project Container
export interface Project {
  id: string;
  name: string;            // e.g. "CSAR", "FOR 200"
  color: string;
  isArchived: boolean;
}
```

---

## 3. Development Checklist

### Phase 1: Environment Setup & Project Foundations
- [ ] Initialize repository (Git, `.gitignore`, ESLint, Prettier).
- [ ] Set up **Tauri v2** with **Vite + React (TypeScript)** or Next.js.
- [ ] Install and configure **Tailwind CSS** and **shadcn/ui** components.
- [ ] Configure local database layer:
  - [ ] Initialize SQLite database (`work_tracker.db`).
  - [ ] Set up Drizzle ORM schema migrations for `projects`, `tasks`, and `time_entries`.
- [ ] Set up Zustand store for client state with local storage persistence.

---

### Phase 2: Core Task Management Engine
- [ ] **Task CRUD Operations:**
  - [ ] Create task dialog with title, project picker, category (`Programming` vs `Admin`), and location context (`Office` vs `Home`).
  - [ ] Inline task title edit and notes textarea.
  - [ ] Delete / Soft-delete (Archive) task operations.
- [ ] **Day-to-Day Task Persistence:**
  - [ ] Build default view: **"Pending / Today"** list that automatically queries:
    $$\text{Status} \in \{\text{PENDING}, \text{IN\_PROGRESS}\}$$
  - [ ] Ensure tasks from prior days roll over seamlessly without manual date reassignment.
  - [ ] Add explicit "Mark as Done" action:
    - [ ] Sets `status = 'COMPLETED'`.
    - [ ] Stops any active timer.
    - [ ] Writes `completedAt` timestamp.
    - [ ] Removes task from active pending view into the "Completed Today / History" panel.

---

### Phase 3: Active Timer & Top-Docked Mini Widget
- [ ] **Timer Logic:**
  - [ ] Implement Web Worker or background heartbeat (`setInterval` drift-resilient timer using delta: `now - startTime`).
  - [ ] Only permit **one** actively running task at any given time (auto-pause active task if a new task is started).
- [ ] **App Header Active Task Dock:**
  - [ ] Pinned top bar in the main application showing:
    - Currently active task name & project color badge.
    - Live ticking stopwatch (`HH:MM:SS`).
    - Quick Pause / Stop button.
    - Quick "Mark Complete" checkmark button.
- [ ] **Floating Overlay (Always-On-Top Mini Widget):**
  - [ ] Create a secondary compact Tauri window (`width: 320px`, `height: 52px`).
  - [ ] Set window properties: `alwaysOnTop: true`, `decorations: false`, `transparent: true`.
  - [ ] Connect inter-process communication (IPC) to sync active task and timer with the main window.
  - [ ] Add global shortcut (e.g., `Cmd/Ctrl + Shift + T`) to toggle floating mini-timer visibility.

---

### Phase 4: Retroactive Entry & Historical Editing
- [ ] Create "Log Past Work" modal:
  - [ ] Date picker to choose past work dates.
  - [ ] Inputs for start time (`HH:MM`) and end time (`HH:MM`).
  - [ ] Ability to directly mark retroactive task as already `[DONE]`.
- [ ] Create daily log inspector (History View) to edit or remove incorrect time intervals.

---

### Phase 5: Categorization, Contexts & Filtering
- [ ] **Work Context Switcher:**
  - [ ] Segmented control in sidebar: `[All] | [Office] | [Home/WFH]`.
  - [ ] Quick filter tasks based on current physical work environment.
- [ ] **Functional Category Filter:**
  - [ ] Filter pills for `Programming`, `Admin Task`, `Meetings`.
- [ ] **Tagging System:**
  - [ ] Inline hashtag parser in task input (e.g., typing `#CSAR` auto-tags the task).

---

### Phase 6: Reporting & Spreadsheet Export Engine
- [ ] **Export to CSV / Excel:**
  - [ ] Generate date-range filtered `.csv` file with standard government accomplishment report columns:
    * `Date`
    * `Project / Tag`
    * `Task Description`
    * `Category (Dev / Admin)`
    * `Work Location (Office / Home)`
    * `Start Time`
    * `Finish Time`
    * `Total Duration (Hours)`
    * `Status`
- [ ] **Accomplishment Report Generator:**
  - [ ] One-click "Weekly Summary" markdown or rich-text preview ready to paste into weekly office submissions.
  - [ ] Daily time breakdown chart (hours coded vs. hours on admin duties).

---

## 4. Example Output: Accomplishment Report CSV Format

```csv
Date,Project,Category,Location,Task,Start Time,End Time,Duration (Hrs),Status
2026-11-02,CSAR,Programming,Home,Curriculum Update API Endpoint,08:30,11:45,3.25,DONE
2026-11-02,Admin,Office,FOR 200: Manuscript Workshop Non Attendance Email,13:00,14:15,1.25,DONE
2026-11-03,CSAR,Programming,Office,Database Schema Migration & Tests,09:00,12:00,3.00,DONE
```

---

## 5. First Sprint Priorities (Minimum Viable Product)

To get this running quickly so you can stop manually modifying your Google Calendar:

1. **Sprint 1 (Day 1-2):** Single SQLite table, task creation form, and a persistent list showing pending items until checked off.
2. **Sprint 2 (Day 3-4):** Start/Stop button on each task card that writes `startTime` and `endTime` rows, with the running task pinned to the top header.
3. **Sprint 3 (Day 5):** "Export to CSV" button that groups completed tasks by date for your periodic accomplishment reports.