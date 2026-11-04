import { supabase } from './supabase';
import { Task, Project, TimeEntry } from '@/types';

export interface CloudData {
  projects: Project[];
  tasks: Task[];
}

export async function fetchUserDataFromCloud(userId: string): Promise<CloudData | null> {
  if (!supabase) return null;

  try {
    // 1. Fetch projects
    const { data: projectRows, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (projError) {
      console.error('Error fetching projects from Supabase:', projError);
      throw projError;
    }

    // 2. Fetch tasks
    const { data: taskRows, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (taskError) {
      console.error('Error fetching tasks from Supabase:', taskError);
      throw taskError;
    }

    // 3. Fetch time entries
    const { data: entryRows, error: entryError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (entryError) {
      console.error('Error fetching time entries from Supabase:', entryError);
      throw entryError;
    }

    // Map projects
    const projects: Project[] = (projectRows || []).map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      isArchived: r.is_archived,
    }));

    // Map time entries by taskId
    const entriesByTaskId = new Map<string, TimeEntry[]>();
    (entryRows || []).forEach(r => {
      const entry: TimeEntry = {
        id: r.id,
        taskId: r.task_id,
        startTime: r.start_time,
        endTime: r.end_time || undefined,
        durationSeconds: r.duration_seconds,
        isManualEntry: r.is_manual_entry,
        date: r.date,
      };
      const existing = entriesByTaskId.get(r.task_id) || [];
      existing.push(entry);
      entriesByTaskId.set(r.task_id, existing);
    });

    // Map tasks
    const tasks: Task[] = (taskRows || []).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      category: r.category,
      location: r.location,
      priority: r.priority,
      projectId: r.project_id || '',
      tags: r.tags || [],
      status: r.status,
      createdAt: r.created_at,
      dueDate: r.due_date || undefined,
      completedAt: r.completed_at || undefined,
      completionNote: r.completion_note || undefined,
      totalDurationSeconds: r.total_duration_seconds || 0,
      timeEntries: entriesByTaskId.get(r.id) || [],
    }));

    return { projects, tasks };
  } catch (err) {
    console.error('Failed to load user cloud data:', err);
    return null;
  }
}

// Upsert a task and its time entries to Supabase
export async function syncTaskToCloud(userId: string, task: Task): Promise<void> {
  if (!supabase) return;

  try {
    const { error: taskError } = await supabase.from('tasks').upsert({
      id: task.id,
      user_id: userId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description || null,
      category: task.category,
      location: task.location,
      priority: task.priority,
      status: task.status,
      tags: task.tags || [],
      due_date: task.dueDate || null,
      created_at: task.createdAt,
      completed_at: task.completedAt || null,
      completion_note: task.completionNote || null,
      total_duration_seconds: task.totalDurationSeconds || 0,
    });

    if (taskError) {
      console.error('Error syncing task to Supabase:', taskError);
      return;
    }

    // Upsert any time entries that exist on the task
    if (task.timeEntries && task.timeEntries.length > 0) {
      const entryPayload = task.timeEntries.map(e => ({
        id: e.id,
        user_id: userId,
        task_id: task.id,
        start_time: e.startTime,
        end_time: e.endTime || null,
        duration_seconds: e.durationSeconds,
        is_manual_entry: e.isManualEntry,
        date: e.date,
      }));

      const { error: entryError } = await supabase.from('time_entries').upsert(entryPayload);
      if (entryError) {
        console.error('Error syncing time entries to Supabase:', entryError);
      }
    }
  } catch (err) {
    console.error('Failed to sync task:', err);
  }
}

// Delete task from Supabase
export async function deleteCloudTask(taskId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task from Supabase:', error);
  } catch (err) {
    console.error('Failed to delete cloud task:', err);
  }
}

// Upsert a project to Supabase
export async function syncProjectToCloud(userId: string, project: Project): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('projects').upsert({
      id: project.id,
      user_id: userId,
      name: project.name,
      color: project.color,
      is_archived: project.isArchived,
    });
    if (error) console.error('Error syncing project to Supabase:', error);
  } catch (err) {
    console.error('Failed to sync project:', err);
  }
}

// Migrate local projects and tasks to cloud on initial setup
export async function migrateLocalDataToCloud(
  userId: string,
  projects: Project[],
  tasks: Task[]
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Projects
    if (projects.length > 0) {
      const projPayload = projects.map(p => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        color: p.color,
        is_archived: p.isArchived,
      }));
      const { error: pErr } = await supabase.from('projects').upsert(projPayload);
      if (pErr) throw pErr;
    }

    // 2. Tasks
    if (tasks.length > 0) {
      const taskPayload = tasks.map(t => ({
        id: t.id,
        user_id: userId,
        project_id: t.projectId || null,
        title: t.title,
        description: t.description || null,
        category: t.category,
        location: t.location,
        priority: t.priority,
        status: t.status,
        tags: t.tags || [],
        due_date: t.dueDate || null,
        created_at: t.createdAt,
        completed_at: t.completedAt || null,
        completion_note: t.completionNote || null,
        total_duration_seconds: t.totalDurationSeconds || 0,
      }));
      const { error: tErr } = await supabase.from('tasks').upsert(taskPayload);
      if (tErr) throw tErr;

      // 3. Time entries
      const allEntries = tasks.flatMap(t =>
        (t.timeEntries || []).map(e => ({
          id: e.id,
          user_id: userId,
          task_id: t.id,
          start_time: e.startTime,
          end_time: e.endTime || null,
          duration_seconds: e.durationSeconds,
          is_manual_entry: e.isManualEntry,
          date: e.date,
        }))
      );

      if (allEntries.length > 0) {
        const { error: eErr } = await supabase.from('time_entries').upsert(allEntries);
        if (eErr) throw eErr;
      }
    }

    return true;
  } catch (err) {
    console.error('Migration to Supabase failed:', err);
    return false;
  }
}

