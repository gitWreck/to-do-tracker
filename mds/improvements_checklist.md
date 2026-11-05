# DevTracker: Improvements & Feature Checklist

Use this checklist to track and select upcoming enhancements for **DevTracker**. Each feature is designed to elevate mobile ergonomics, developer workflow, cross-device sync, or reporting accuracy.

---

## 📱 1. Mobile & "Access Anywhere" (Completed ✅)

- [x] **PWA (Progressive Web App) "Install to Home Screen"**
  - Added `public/manifest.json`, Web App Manifest meta tags in `index.html`, Apple touch icons, and mobile status bar settings.
  - Supports full-screen standalone mode on iOS (Safari *Add to Home Screen*) and Android (Chrome *Install App*), running without browser address bars for a native app feel.

- [x] **Responsive Mobile Drawer & Smooth Slide Nav Animations**
  - On screens `< 768px`, the sidebar smoothly transforms into an off-canvas slide-out drawer with a backdrop overlay and CSS slide transitions (`-translate-x-full` ↔ `translate-x-0`).
  - Added dedicated hamburger button, Escape key dismissal, and seamless auto-close on selection.

- [x] **Pop-In / Pop-Out Modal Animations & Ergonomics**
  - Built `useModalAnimation` hook with smooth spring zoom transitions (`scale-95 -> scale-100` / `scale-100 -> scale-95`), delayed unmounting, and Escape key dismissal across all modals without content flickering.

- [x] **Touch Optimizations & Mobile Action Affordances**
  - Task card action icons (Edit, Delete, Start Timer) are always visible and comfortably tappable on mobile screens where hover states do not exist.
  - Search toolbar and layout toggles maintain single-row alignment on mobile without horizontal clipping or multiline crowding.
  - Calendar view features a responsive vertical split on mobile with an integrated scrollable day inspector drawer.

---

## ⚡ 2. Real-Time Multi-Device Sync & Offline Resilience (Completed ✅)

- [x] **Supabase Realtime Cross-Device Synchronization**
  - Subscribed to Supabase Realtime WebSocket broadcast channels (`devtracker_sync_${userId}`) with per-device session isolation (`DEVICE_ID`) and fallback PostgreSQL change listeners.
  - When you create, edit, archive, or complete a task on your phone, desktop and laptop tabs reflect the update immediately in real-time without refreshing.
  - Cross-device dock timer sync: starting a task timer on desktop displays and ticks in real-time on your phone dock (and vice versa); stopping on one device commits the entry and stops on all devices.

- [x] **Offline Mutation Queue & Auto-Flush on Reconnect**
  - Local mutation queue (`devtracker_offline_queue_v1`) stores pending task upserts, deletes, and project modifications if network drops (offline mode, airplane, subway, dead zone).
  - Listens to browser `online` and `visibilitychange` events to automatically flush queued mutations in the background and pull latest cloud changes when foregrounded.
  - Reactive sync pill in `ActiveTaskDock`: shows `Live Sync` with active pulse dot when connected, `Offline (N queued)` badge when offline, and `Syncing...` during queue flushes. Tap pill to trigger an immediate verification & manual flush.

- [x] **Multi-Day Task Date Ranges & Retroactive Range Logging**
  - Full multi-day span intelligence (`getTaskDateSpan`): tasks completed or worked on across multiple days display rich date badges (e.g. `Nov 2 – Nov 5 (3 days)` with detailed hover tooltip breakdown).
  - Create Task Modal features Start Date, Target Due Date, quick presets (`1 Day`, `+3 Days`, `+1 Week`), and live range indicator.
  - Retroactive Modal supports multi-day work deliverables, creating distinct calendar day time logs for accomplishment reports.

---

## ⏱️ 3. Time Tracking & Goal Enhancements

- [ ] **Daily & Weekly Work Target Progress Bar (e.g. 8h Daily Goal)**
  - Display a clean progress metric in the top dock: `Today: 5.5h / 8.0h (68%)`.
  - Configurable target (e.g. 8h/day or 40h/week) with celebration confetti or visual milestone badge when hitting your daily goal.

- [ ] **Pomodoro Interval Timer Mode (Optional Toggle)**
  - Add an optional Pomodoro mode to the stopwatch: 25-minute focus session followed by a 5-minute break chime/alert.
  - Ability to seamlessly switch between free-form open stopwatch and structured Pomodoro cycles.

- [ ] **Custom Date Range for Accomplishment Reports**
  - Add a custom Date Picker (`Start Date` to `End Date`) to the Accomplishment Report modal, alongside the existing 7-day and 30-day presets.
  - Enables generating exact calendar-month government accomplishment reports (e.g., *“Nov 1 – Nov 30”*).

---

## 🗃️ 4. Task Management & Archive Navigation

- [ ] **Dedicated "Archived Tasks" Tab in Sidebar**
  - Create an "Archived" section in the sidebar to browse all archived tasks.
  - Allows inspecting historical hours on old tasks, with an **[Unarchive / Restore]** button to revive tasks back to the active board if needed.

- [ ] **Task Reordering & "Priority Pinning" (Today's Top 3)**
  - Drag-and-drop task sorting within the Today section.
  - Star or pin up to 3 high-impact tasks to the top of the day ("The Big 3" / "Eat the Frog").

---

## 🛠️ 5. Developer Workflow & Export Integrations

- [ ] **Git Branch & PR Tag Linking**
  - Add an optional task field to link a Git branch (e.g. `feature/oauth-flow`) or PR number (e.g. `#14`).
  - Automatically incorporates Git branches into the generated Weekly Accomplishment Markdown export for clean dev team updates.

- [ ] **Official Printable PDF Accomplishment Format**
  - Add a dedicated print stylesheet (`@media print`) and PDF download button.
  - Generates a cleanly formatted government accomplishment sheet with standard signatures block (*“Prepared by:”*, *“Approved by:”*).

