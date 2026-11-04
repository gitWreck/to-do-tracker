# DevTracker: Developer Work & Time Tracker

A lightweight, developer-focused work and task tracker featuring real-time stopwatches, persistent day-to-day rollover with date dividers, interactive calendar scheduling, floating overlay mini-widgets, and government accomplishment spreadsheet (CSV) exports.

Based on the engineering specifications in [`ticktick_clone_roadmap.md`](./ticktick_clone_roadmap.md).

---

## Features Implemented

### 1. Day-to-Day Task Persistence & Date Dividers
- **Automatic Date Dividers in Pending & Completed:** Unfinished tasks from prior days ("way before") are clearly separated into distinct date sections with status badges:
  * **Prior Days (Carried Over)**: For tasks created or due before yesterday that seamlessly rolled over.
  * **Yesterday (Carried Over)**: Tasks from the previous workday.
  * **Today**: Items due or created today.
  * **Upcoming**: Tasks scheduled for future dates.
- **Commit Completion Prompt:** When marking done, a dialog opens to review tracked time, apply quick increments (`+5m`, `+15m`, `Round to 15m`), add accomplishment deliverable notes, and commit with celebration confetti.
- **Undo Toast:** Instant non-blocking notification with **[Undo]** button for task completions, re-openings, and deletions.
- **Local Persistence & Backup:** Tasks, projects, and active timer state persist locally in browser storage with backwards-compatible migration and one-click **Export Backup JSON**.

### 2. Live Stopwatch & Active Task Dock
- **Pinned Top Dock:** Always visible header showing the currently running task, project color badge, live ticking stopwatch (`HH:MM:SS`), and quick Pause/Done controls.
- **Single Active Task Rule:** Starting a timer on any task automatically commits and pauses the previous running task, ensuring no duplicate concurrent timers.
- **Drift-Resilient Engine:** Timer computes elapsed intervals via timestamp delta ($\Delta t = \text{now} - \text{startTime}$) rather than tick counting, preventing drift when windows are minimized or idle.

### 3. List vs. Card / Grid Layout Toggle
- One-click toggle in the toolbar between compact **List View** and multi-column **Card / Grid View**.
- Preference is remembered across browser sessions.

### 4. Interactive Month Calendar View
- Full monthly grid with daily time logged metrics ($\text{e.g. } \text{🔥 } 3.25\text{h}$) and task pills.
- Side inspector drawer to inspect, run timers, or add tasks for any specific date.

### 5. Floating Mini-Widget (Always-On-Top Overlay)
- **Document Picture-in-Picture (PiP) Window:** Pops out a compact, native OS-level floating window (`360x90px`) that stays pinned on top of your IDE / editor while you code.
- **In-App Floating Overlay:** Built-in floating pill dock fallback if PiP is minimized.

### 6. Categorization, Work Context & Hashtags
- **Work Context Switcher:** Segmented control to toggle between `[All]`, `[Office]`, and `[Home/WFH]`.
- **Functional Categories:** Filter by `Programming`, `Admin Task`, `Meetings`, and `Other`.
- **Hashtag Parsing:** Typing `#CSAR` or `#Backend` in task titles automatically extracts and indexes tags.

### 7. Retroactive Time Logging ("Log Past Work")
- Modal to record past work intervals with date picker, start time (`HH:MM`), end time (`HH:MM`), auto-calculated duration in decimal hours, and direct `[DONE]` marking.

### 8. Government Accomplishment Report & CSV Export
- Generates official accomplishment reports matching the exact CSV schema:
  ```csv
  Date,Project,Category,Location,Task,Start Time,End Time,Duration (Hrs),Status
  2026-11-02,CSAR,Programming,Home,Curriculum Update API Endpoint [Note: Deployed API],08:30,11:45,3.25,DONE
  ```
- **Weekly Markdown Summary:** One-click summary formatted for copying straight into weekly accomplishment emails.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + N` / `Cmd + N` | Open New Task modal |
| `Ctrl + L` / `Cmd + L` | Open Retroactive Work ("Log Past Work") modal |
| `Ctrl + Shift + T` | Toggle Always-On-Top Mini Widget |

---

## Getting Started

### 1. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Build for Production
```bash
npm run build
```

---

## Desktop Packaging (Tauri v2)
This Vite React application is 100% Tauri-ready. When Rust and C++ build tools are installed on your machine, package it into a standalone Windows `.exe` with:
```bash
npx tauri init
npx tauri build
```
