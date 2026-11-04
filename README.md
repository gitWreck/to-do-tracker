# TickTick Clone: Developer Work & Time Tracker

A lightweight, developer-focused work and task tracker featuring real-time stopwatches, persistent day-to-day task rollover, floating overlay mini-widgets, and government accomplishment spreadsheet (CSV) exports.

Based on the engineering specifications in [`ticktick_clone_roadmap.md`](./ticktick_clone_roadmap.md).

---

## Features Implemented

### 1. Day-to-Day Task Persistence & Rollover
- **Zero-Rescheduling Rollover:** Uncompleted tasks (`PENDING` or `IN_PROGRESS`) automatically carry over day-to-day without having to manually move dates.
- **Completion Flow:** Clicking the checkmark marks the task `[COMPLETED]`, records an ISO completion timestamp, stops any active timer, triggers celebration confetti, and moves it to the "Completed History" log.
- **Local Persistence & Backup:** Tasks, projects, and active timer state persist locally in browser storage with one-click **Export Backup JSON**.

### 2. Live Stopwatch & Active Task Dock
- **Pinned Top Dock:** Always visible header showing the currently running task, project color badge, live ticking stopwatch (`HH:MM:SS`), and quick Pause/Done controls.
- **Single Active Task Rule:** Starting a timer on any task automatically commits and pauses the previous running task, ensuring no duplicate concurrent timers.
- **Drift-Resilient Engine:** Timer computes elapsed intervals via timestamp delta ($\Delta t = \text{now} - \text{startTime}$) rather than tick counting, preventing drift when windows are minimized or idle.

### 3. Floating Mini-Widget (Always-On-Top Overlay)
- **Document Picture-in-Picture (PiP) Window:** Pops out a compact, native OS-level floating window (`360x90px`) that stays pinned on top of your IDE / editor while you code.
- **In-App Floating Overlay:** Built-in floating pill dock fallback if PiP is minimized.

### 4. Categorization, Work Context & Hashtags
- **Work Context Switcher:** Segmented control to toggle between `[All]`, `[Office]`, and `[Home/WFH]`.
- **Functional Categories:** Filter by `Programming`, `Admin Task`, `Meetings`, and `Other`.
- **Hashtag Parsing:** Typing `#CSAR` or `#Backend` in task titles automatically extracts and indexes tags.

### 5. Retroactive Time Logging ("Log Past Work")
- Modal to record past work intervals with date picker, start time (`HH:MM`), end time (`HH:MM`), auto-calculated duration in decimal hours, and direct `[DONE]` marking.

### 6. Government Accomplishment Report & CSV Export
- Generates official accomplishment reports matching the exact CSV schema:
  ```csv
  Date,Project,Category,Location,Task,Start Time,End Time,Duration (Hrs),Status
  2026-11-02,CSAR,Programming,Home,Curriculum Update API Endpoint,08:30,11:45,3.25,DONE
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
This Vite React application is 100% Tauri-ready. When Rust and the C++ build tools are installed on your machine, you can package it into a standalone lightweight Windows `.exe` by running:
```bash
npx tauri init
npx tauri build
```
