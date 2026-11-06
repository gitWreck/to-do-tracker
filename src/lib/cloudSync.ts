import { supabase } from './supabase';
import { Task, Project, TimeEntry, ActiveTimerState } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CloudData {
  projects: Project[];
  tasks: Task[];
}

export interface QueuedMutation {
  id: string;
  timestamp: number;
  type: 'UPSERT_TASK' | 'DELETE_TASK' | 'UPSERT_PROJECT' | 'DELETE_PROJECT';
  userId: string;
  payload: any;
}

const OFFLINE_QUEUE_KEY = 'devtracker_offline_queue_v1';

function getDeviceId(): string {
  try {
    if (typeof sessionStorage !== 'undefined') {
      let id = sessionStorage.getItem('devtracker_device_id');
      if (!id) {
        id = `dev-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('devtracker_device_id', id);
      }
      return id;
    }
  } catch {
    // ignore storage access restrictions
  }
  return `dev-${Math.random().toString(36).substring(2, 9)}`;
}

const DEVICE_ID = getDeviceId();

// ------------------------------------------------------------------
// OFFLINE MUTATION QUEUE
// ------------------------------------------------------------------

export function getOfflineQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedMutation[]): void {
  try {
    if (queue.length === 0) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } else {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('devtracker:queue_change', { detail: queue.length }));
    }
  } catch (err) {
    console.warn('Failed to save offline queue:', err);
  }
}

export function enqueueMutation(
  userId: string,
  type: QueuedMutation['type'],
  payload: any
): void {
  const current = getOfflineQueue();
  // If mutation for same task/project already queued, replace it
  const filtered = current.filter(m => {
    if (type === 'UPSERT_TASK' || type === 'DELETE_TASK') {
      const targetId = type === 'DELETE_TASK' ? payload : payload.id;
      const currentTargetId = m.type === 'DELETE_TASK' ? m.payload : m.payload?.id;
      return currentTargetId !== targetId;
    }
    if (type === 'UPSERT_PROJECT') {
      return m.payload?.id !== payload.id;
    }
    return true;
  });

  const newMutation: QueuedMutation = {
    id: `mutation-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    type,
    userId,
    payload,
  };

  saveOfflineQueue([...filtered, newMutation]);
}

let isFlushingQueue = false;
let hasPinnedColumnSupport = true;

function buildTaskUpsertData(userId: string, task: Task, withPinned: boolean) {
  const payload: Record<string, any> = {
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
  };
  if (withPinned) {
    payload.is_pinned = !!task.isPinned;
  }
  return payload;
}

export async function flushOfflineQueue(): Promise<{ flushed: number; remaining: number }> {
  if (isFlushingQueue) {
    return { flushed: 0, remaining: getOfflineQueue().length };
  }
  if (!supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { flushed: 0, remaining: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  isFlushingQueue = true;
  let flushedCount = 0;
  const remaining: QueuedMutation[] = [];

  try {
    for (const item of queue) {
      try {
        if (item.type === 'UPSERT_TASK') {
          const task: Task = item.payload;
          let upsertPayload = buildTaskUpsertData(item.userId, task, hasPinnedColumnSupport);
          let { error } = await supabase.from('tasks').upsert(upsertPayload);

          if (error && hasPinnedColumnSupport && (error.message?.includes('is_pinned') || error.code === 'PGRST204')) {
            hasPinnedColumnSupport = false;
            upsertPayload = buildTaskUpsertData(item.userId, task, false);
            const retryRes = await supabase.from('tasks').upsert(upsertPayload);
            error = retryRes.error;
          }
          if (error) throw error;

          if (task.timeEntries && task.timeEntries.length > 0) {
            const entryPayload = task.timeEntries.map(e => ({
              id: e.id,
              user_id: item.userId,
              task_id: task.id,
              start_time: e.startTime,
              end_time: e.endTime || null,
              duration_seconds: e.durationSeconds,
              is_manual_entry: e.isManualEntry,
              date: e.date,
            }));
            await supabase.from('time_entries').upsert(entryPayload);
          }
          flushedCount++;
        } else if (item.type === 'DELETE_TASK') {
          const taskId: string = item.payload;
          // Delete foreign-key child entries first to prevent FK violation
          await supabase.from('time_entries').delete().eq('task_id', taskId);
          const { error } = await supabase.from('tasks').delete().eq('id', taskId);
          if (error) throw error;
          flushedCount++;
        } else if (item.type === 'UPSERT_PROJECT') {
          const project: Project = item.payload;
          const { error } = await supabase.from('projects').upsert({
            id: project.id,
            user_id: item.userId,
            name: project.name,
            color: project.color,
            is_archived: project.isArchived,
          });
          if (error) throw error;
          flushedCount++;
        } else if (item.type === 'DELETE_PROJECT') {
          const projectId: string = item.payload;
          const { error } = await supabase.from('projects').delete().eq('id', projectId);
          if (error) throw error;
          flushedCount++;
        }
      } catch (err) {
        console.warn('Could not flush queued mutation, retaining:', err);
        remaining.push(item);
      }
    }
  } finally {
    saveOfflineQueue(remaining);
    isFlushingQueue = false;
  }

  return { flushed: flushedCount, remaining: remaining.length };
}

// ------------------------------------------------------------------
// DATA FETCHING & SYNCHRONIZATION
// ------------------------------------------------------------------

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
      isPinned: typeof r.is_pinned === 'boolean' ? r.is_pinned : undefined,
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
  // Broadcast update immediately to other tabs/devices
  broadcastTaskChange(userId, task);

  // If currently offline, queue it immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueMutation(userId, 'UPSERT_TASK', task);
    return;
  }

  if (!supabase) return;

  try {
    let upsertPayload = buildTaskUpsertData(userId, task, hasPinnedColumnSupport);
    let { error: taskError } = await supabase.from('tasks').upsert(upsertPayload);

    if (taskError && hasPinnedColumnSupport && (taskError.message?.includes('is_pinned') || taskError.code === 'PGRST204')) {
      hasPinnedColumnSupport = false;
      upsertPayload = buildTaskUpsertData(userId, task, false);
      const retryRes = await supabase.from('tasks').upsert(upsertPayload);
      taskError = retryRes.error;
    }

    if (taskError) {
      console.warn('Network error syncing task to Supabase, queuing mutation:', taskError);
      enqueueMutation(userId, 'UPSERT_TASK', task);
      return;
    }

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
        console.warn('Network error syncing entries to Supabase:', entryError);
      }
    }

    // Flush any pending items if network is healthy
    flushOfflineQueue();
  } catch {
    enqueueMutation(userId, 'UPSERT_TASK', task);
  }
}

// Delete task from Supabase
export async function deleteCloudTask(userId: string, taskId: string): Promise<void> {
  broadcastTaskDelete(userId, taskId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueMutation(userId, 'DELETE_TASK', taskId);
    return;
  }

  if (!supabase) return;
  try {
    await supabase.from('time_entries').delete().eq('task_id', taskId);
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      enqueueMutation(userId, 'DELETE_TASK', taskId);
    }
  } catch {
    enqueueMutation(userId, 'DELETE_TASK', taskId);
  }
}

// Upsert a project to Supabase
export async function syncProjectToCloud(userId: string, project: Project): Promise<void> {
  broadcastProjectChange(userId, project);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueMutation(userId, 'UPSERT_PROJECT', project);
    return;
  }

  if (!supabase) return;
  try {
    const { error } = await supabase.from('projects').upsert({
      id: project.id,
      user_id: userId,
      name: project.name,
      color: project.color,
      is_archived: project.isArchived,
    });
    if (error) {
      enqueueMutation(userId, 'UPSERT_PROJECT', project);
    }
  } catch {
    enqueueMutation(userId, 'UPSERT_PROJECT', project);
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

    if (tasks.length > 0) {
      let taskPayload = tasks.map(t => buildTaskUpsertData(userId, t, hasPinnedColumnSupport));
      let { error: tErr } = await supabase.from('tasks').upsert(taskPayload);

      if (tErr && hasPinnedColumnSupport && (tErr.message?.includes('is_pinned') || tErr.code === 'PGRST204')) {
        hasPinnedColumnSupport = false;
        taskPayload = tasks.map(t => buildTaskUpsertData(userId, t, false));
        const retryRes = await supabase.from('tasks').upsert(taskPayload);
        tErr = retryRes.error;
      }
      if (tErr) throw tErr;

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

// ------------------------------------------------------------------
// SUPABASE REALTIME MULTI-DEVICE SYNCHRONIZATION
// ------------------------------------------------------------------

let activeSyncChannel: RealtimeChannel | null = null;

export function initRealtimeSync(
  userId: string,
  callbacks: {
    onTaskUpsert: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
    onProjectUpsert: (project: Project) => void;
    onProjectDelete?: (projectId: string) => void;
    onTimerBroadcast: (timerState: ActiveTimerState | null) => void;
    onRefreshRequested: () => void;
  }
): () => void {
  if (!supabase) return () => {};

  // Clean up any existing channel before subscribing
  if (activeSyncChannel) {
    supabase.removeChannel(activeSyncChannel);
    activeSyncChannel = null;
  }

  const channelName = `devtracker_sync_${userId}`;
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
    },
  });

  // 1. Instant WebSocket Broadcasts across devices
  channel
    .on('broadcast', { event: 'timer_state' }, ({ payload }) => {
      if (payload?.originDeviceId === DEVICE_ID) return;
      callbacks.onTimerBroadcast(payload?.timerState ?? null);
    })
    .on('broadcast', { event: 'task_upsert' }, ({ payload }) => {
      if (payload?.originDeviceId === DEVICE_ID) return;
      if (payload?.task) callbacks.onTaskUpsert(payload.task);
    })
    .on('broadcast', { event: 'task_delete' }, ({ payload }) => {
      if (payload?.originDeviceId === DEVICE_ID) return;
      if (payload?.taskId) callbacks.onTaskDelete(payload.taskId);
    })
    .on('broadcast', { event: 'project_upsert' }, ({ payload }) => {
      if (payload?.originDeviceId === DEVICE_ID) return;
      if (payload?.project) callbacks.onProjectUpsert(payload.project);
    })
    .on('broadcast', { event: 'project_delete' }, ({ payload }) => {
      if (payload?.originDeviceId === DEVICE_ID) return;
      if (payload?.projectId) callbacks.onProjectDelete?.(payload.projectId);
    })
    // 2. PostgreSQL Changes (for background/cold-start catch-up)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      () => {
        callbacks.onRefreshRequested();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` },
      () => {
        callbacks.onRefreshRequested();
      }
    )
    .subscribe();

  activeSyncChannel = channel;

  return () => {
    if (activeSyncChannel && supabase) {
      supabase.removeChannel(activeSyncChannel);
      activeSyncChannel = null;
    }
  };
}

export function broadcastTimerState(userId: string, timerState: ActiveTimerState | null): void {
  if (!activeSyncChannel) return;
  activeSyncChannel.send({
    type: 'broadcast',
    event: 'timer_state',
    payload: {
      userId,
      originDeviceId: DEVICE_ID,
      timerState,
    },
  });
}

export function broadcastTaskChange(userId: string, task: Task): void {
  if (!activeSyncChannel) return;
  activeSyncChannel.send({
    type: 'broadcast',
    event: 'task_upsert',
    payload: {
      userId,
      originDeviceId: DEVICE_ID,
      task,
    },
  });
}

export function broadcastTaskDelete(userId: string, taskId: string): void {
  if (!activeSyncChannel) return;
  activeSyncChannel.send({
    type: 'broadcast',
    event: 'task_delete',
    payload: {
      userId,
      originDeviceId: DEVICE_ID,
      taskId,
    },
  });
}

export function broadcastProjectChange(userId: string, project: Project): void {
  if (!activeSyncChannel) return;
  activeSyncChannel.send({
    type: 'broadcast',
    event: 'project_upsert',
    payload: {
      userId,
      originDeviceId: DEVICE_ID,
      project,
    },
  });
}

export function broadcastProjectDelete(userId: string, projectId: string): void {
  if (!activeSyncChannel) return;
  activeSyncChannel.send({
    type: 'broadcast',
    event: 'project_delete',
    payload: {
      userId,
      originDeviceId: DEVICE_ID,
      projectId,
    },
  });
}

// Delete project from Supabase
export async function deleteCloudProject(userId: string, projectId: string): Promise<void> {
  broadcastProjectDelete(userId, projectId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueMutation(userId, 'DELETE_PROJECT', projectId);
    return;
  }

  if (!supabase) return;
  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      enqueueMutation(userId, 'DELETE_PROJECT', projectId);
    }
  } catch {
    enqueueMutation(userId, 'DELETE_PROJECT', projectId);
  }
}
