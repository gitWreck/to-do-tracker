-- ==============================================================================
-- DevTracker Supabase Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create Projects Table
create table if not exists public.projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#3b82f6',
  is_archived boolean not null default false,
  created_at timestamptz default now()
);

-- 2. Create Tasks Table
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id text references public.projects(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'PROGRAMMING',
  location text not null default 'OFFICE',
  priority text not null default 'MEDIUM',
  status text not null default 'PENDING',
  tags text[] default '{}',
  due_date text,
  created_at timestamptz default now(),
  completed_at timestamptz,
  completion_note text,
  total_duration_seconds integer not null default 0
);

-- 3. Create Time Entries Table
create table if not exists public.time_entries (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id text references public.tasks(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds integer not null default 0,
  is_manual_entry boolean not null default false,
  date text not null,
  created_at timestamptz default now()
);

-- 4. Create Performance Indexes
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_time_entries_user_id on public.time_entries(user_id);
create index if not exists idx_time_entries_task_id on public.time_entries(task_id);
create index if not exists idx_time_entries_date on public.time_entries(date);

-- 5. Enable Row Level Security (RLS) on all tables
-- This guarantees that each user can strictly and solely read/write their own records!
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.time_entries enable row level security;

-- 6. RLS Policies for Projects
drop policy if exists "Users can manage own projects" on public.projects;
create policy "Users can manage own projects"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. RLS Policies for Tasks
drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks"
  on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. RLS Policies for Time Entries
drop policy if exists "Users can manage own time entries" on public.time_entries;
create policy "Users can manage own time entries"
  on public.time_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
