# DevTracker: Developer Work & Time Tracker

A lightweight, developer-focused work and task tracker featuring real-time stopwatches, persistent day-to-day rollover with date dividers, "The Big 3" daily focus pinning, interactive calendar scheduling, floating overlay mini-widgets, and government accomplishment spreadsheet (CSV) exports.

Based on the engineering specifications in [`devtracker_roadmap.md`](./devtracker_roadmap.md).

---

## Features Implemented

### 1. Day-to-Day Task Persistence & Date Dividers
- **Automatic Date Dividers in Pending & Completed:** Unfinished tasks from prior days ("way before") are clearly separated into distinct date sections with status badges:
  * **Prior Days (Carried Over)**: For tasks created or due before yesterday that seamlessly rolled over.
  * **Yesterday (Carried Over)**: Tasks from the previous workday.
  * **Today**: Items due or created today.
  * **Upcoming**: Tasks scheduled for future dates.
  * **No Due Date (Backlog)**: Tasks without an explicit deadline are neatly grouped in a dedicated backlog section while preserving their original `createdAt` timestamp across calendar and history views.
- **"The Big 3" Priority Task Pinning:** Star / pin up to 3 high-focus daily tasks to the top of your board. Persists in both local storage and cloud Supabase (`is_pinned`), automatically unpinning when completed, archived, or deleted.
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

### 7. Sidebar Projects & Safe Reordering Mode
- **Custom Projects:** Create projects with custom color tags, edit names/colors, and track task counts.
- **Explicit Reorder Mode Toggle:** Toggle the Reorder (`⇅`) button in the Projects header to enable drag-and-drop or 1-click **▲ / ▼** move arrows. When locked (default), projects cannot be accidentally dragged while clicking.

### 8. Retroactive Time Logging ("Log Past Work")
- Modal to record past work intervals with date picker, start time (`HH:MM`), end time (`HH:MM`), auto-calculated duration in decimal hours, and direct `[DONE]` marking.

### 9. Government Accomplishment Report & CSV Export
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
| `Escape` | Close Mobile Drawer Menu |

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

## Cloud Sync, Vercel & Supabase Setup (Google Sign-In)

DevTracker supports **private single-user cloud sync** using **Supabase** and **Google Sign-In**, deployable to **Vercel** with one click.

### Security & Privacy Architecture
- **Single-User Email Whitelist:** The environment variable `VITE_ALLOWED_EMAIL` enforces that only your specific Google account can sign in. Any other Google account will be rejected and automatically signed out.
- **PostgreSQL Row-Level Security (RLS):** All tables (`projects`, `tasks`, `time_entries`) have RLS policies strictly isolating records by `auth.uid() = user_id`.
- **Offline / Local Mode Fallback:** If Supabase credentials are not configured, DevTracker functions completely offline using browser local storage without crashing.
- **Hybrid Pinned Task Persistence:** Pinned tasks are synced with both the `is_pinned` column in Supabase and local storage, ensuring smooth backwards-compatibility and persistence across page reloads.

---

### Step 1: Create Supabase Project & Run Schema

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard (left sidebar -> `SQL Editor` -> `New Query`).
3. Copy the contents of [`supabase_schema.sql`](./supabase_schema.sql) in this repository, paste it into the editor, and click **Run**.  
   *(If your database already has the tasks table, run: `alter table public.tasks add column if not exists is_pinned boolean not null default false;`)*
4. Go to **Project Settings** -> **API** and copy:
   - **Project URL** (`https://<project-id>.supabase.co`)
   - **Project API Anon Key** (`anon` `public`)

---

### Step 2: Configure Google OAuth in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a project (or select an existing one) and navigate to **APIs & Services** -> **Credentials**.
3. Click **Create Credentials** -> **OAuth client ID**.
4. Choose **Web application**.
5. Under **Authorized redirect URIs**, add your Supabase Auth callback URL:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
6. Click **Create** and copy your **Client ID** and **Client Secret**.
7. Return to your **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**:
   - Turn Google **ON**.
   - Paste your **Client ID** and **Client Secret**.
   - Click **Save**.

---

### Step 3: Deploy to Vercel

1. Push this repository to GitHub or GitLab:
   ```bash
   git add .
   git commit -m "feat: setup devtracker cloud sync"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) -> **Add New Project** -> Import your repository.
3. Under **Environment Variables**, add the following 3 variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (`https://<project-id>.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key
   - `VITE_ALLOWED_EMAIL`: Your personal Google email (`your.name@gmail.com`)
4. Click **Deploy**!
5. In your Supabase dashboard -> **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your Vercel deployment domain (e.g., `https://your-devtracker.vercel.app`).
   - Add `https://your-devtracker.vercel.app/**` under **Redirect URLs**.

You can now open DevTracker from any computer, tablet, or phone, click **Continue with Google**, and have your stopwatches, tasks, and accomplishment reports synchronized in real-time — with only your account permitted to access it!

---

## Desktop Packaging (Tauri v2)
This Vite React application is 100% Tauri-ready. When Rust and C++ build tools are installed on your machine, package it into a standalone Windows `.exe` with:
```bash
npx tauri init
npx tauri build
```
