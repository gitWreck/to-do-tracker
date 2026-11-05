export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatDurationCompact(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatDecimalHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(2);
}

export function formatTimeOnly(isoString?: string): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--:--';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateOnly(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = (curr.getMonth() + 1).toString().padStart(2, '0');
    const d = curr.getDate().toString().padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startDateStr];
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface TaskDateSpanInfo {
  display: string;
  tooltip: string;
  isMultiDay: boolean;
  daySpan: number;
  type: 'completed-multi-day' | 'completed-same-day' | 'pending-range' | 'pending-due' | 'pending-created';
}

export function getTaskDateSpan(task: {
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  status: string;
  timeEntries?: Array<{ date?: string; startTime: string }>;
}): TaskDateSpanInfo {
  const formatShortDate = (d: Date) => {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const formatFullDate = (d: Date) => {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine Start Date (earliest of earliest time entry date, or task.createdAt)
  const createdDate = new Date(task.createdAt);
  let startDate = createdDate;

  if (task.timeEntries && task.timeEntries.length > 0) {
    const sortedDates = task.timeEntries
      .map(e => e.date || (e.startTime ? e.startTime.split('T')[0] : ''))
      .filter(Boolean)
      .sort();
    if (sortedDates.length > 0) {
      const firstEntryDate = new Date(sortedDates[0] + 'T00:00:00');
      if (firstEntryDate < startDate) {
        startDate = firstEntryDate;
      }
    }
  }

  const startDayStr = startDate.toISOString().split('T')[0];

  // 1. Completed Task
  if (task.status === 'COMPLETED' && task.completedAt) {
    const completedDate = new Date(task.completedAt);
    const completedDayStr = completedDate.toISOString().split('T')[0];

    const startMs = new Date(startDayStr + 'T00:00:00').getTime();
    const endMs = new Date(completedDayStr + 'T00:00:00').getTime();
    const diffDays = Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
    const daySpan = diffDays + 1;

    if (diffDays > 0) {
      const dayWord = diffDays === 1 ? '1 day' : `${diffDays} days`;
      return {
        display: `${formatShortDate(startDate)} – ${formatShortDate(completedDate)} (${dayWord})`,
        tooltip: `Started: ${formatFullDate(startDate)}\nCompleted: ${formatFullDate(completedDate)} at ${formatTime(completedDate)}\nTotal span: ${dayWord} (${daySpan} calendar days)`,
        isMultiDay: true,
        daySpan,
        type: 'completed-multi-day',
      };
    } else {
      return {
        display: `${formatShortDate(completedDate)} • Done ${formatTime(completedDate)}`,
        tooltip: `Completed on ${formatFullDate(completedDate)} at ${formatTime(completedDate)}`,
        isMultiDay: false,
        daySpan: 1,
        type: 'completed-same-day',
      };
    }
  }

  // 2. Pending / In Progress Task with Due Date
  if (task.dueDate) {
    const dueDayStr = task.dueDate.split('T')[0];
    const dueDateObj = new Date(dueDayStr + 'T00:00:00');
    const startMs = new Date(startDayStr + 'T00:00:00').getTime();
    const dueMs = new Date(dueDayStr + 'T00:00:00').getTime();
    const diffDays = Math.round((dueMs - startMs) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const dayWord = diffDays === 1 ? '1d' : `${diffDays}d`;
      return {
        display: `${formatShortDate(startDate)} – Due ${formatShortDate(dueDateObj)} (${dayWord})`,
        tooltip: `Created: ${formatFullDate(startDate)}\nTarget Due Date: ${formatFullDate(dueDateObj)} (${diffDays} days scheduled span)`,
        isMultiDay: true,
        daySpan: diffDays + 1,
        type: 'pending-range',
      };
    } else if (diffDays === 0) {
      return {
        display: `Due ${formatShortDate(dueDateObj)}`,
        tooltip: `Due on ${formatFullDate(dueDateObj)}`,
        isMultiDay: false,
        daySpan: 1,
        type: 'pending-due',
      };
    } else {
      return {
        display: `${formatShortDate(startDate)} – Overdue (${formatShortDate(dueDateObj)})`,
        tooltip: `Created: ${formatFullDate(startDate)}\nWas due: ${formatFullDate(dueDateObj)}`,
        isMultiDay: true,
        daySpan: 1,
        type: 'pending-due',
      };
    }
  }

  // 3. Pending Task with work logged across multiple days
  if (task.timeEntries && task.timeEntries.length > 0) {
    const dates = Array.from(new Set(task.timeEntries.map(e => e.date || e.startTime.split('T')[0]).filter(Boolean))).sort();
    if (dates.length > 1) {
      const firstDate = new Date(dates[0] + 'T00:00:00');
      const lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');
      const spanDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        display: `Worked ${formatShortDate(firstDate)} – ${formatShortDate(lastDate)} (${spanDays}d)`,
        tooltip: `First work session: ${formatFullDate(firstDate)}\nLatest work session: ${formatFullDate(lastDate)}\nActive across ${dates.length} days`,
        isMultiDay: true,
        daySpan: spanDays,
        type: 'pending-range',
      };
    }
  }

  // 4. Default: Created date
  return {
    display: formatShortDate(createdDate),
    tooltip: `Created on ${formatFullDate(createdDate)} at ${formatTime(createdDate)}`,
    isMultiDay: false,
    daySpan: 1,
    type: 'pending-created',
  };
}

export function calculateSecondsBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 1000);
}

export interface DateGroupMeta {
  key: string;
  label: string;
  badge?: string;
  badgeType: 'today' | 'yesterday' | 'overdue' | 'upcoming';
  sortOrder: number; // For ordering: overdue first, then yesterday, today, upcoming
}

export function getDateGroupMeta(dateStr: string): DateGroupMeta {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (dateStr === today) {
    const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return {
      key: dateStr,
      label: `Today • ${formatted}`,
      badge: 'Today',
      badgeType: 'today',
      sortOrder: 2,
    };
  }

  if (dateStr === yesterday) {
    const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return {
      key: dateStr,
      label: `Yesterday • ${formatted}`,
      badge: 'Carried Over',
      badgeType: 'yesterday',
      sortOrder: 1,
    };
  }

  if (dateStr < today) {
    const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return {
      key: dateStr,
      label: formatted,
      badge: 'Prior Days (Carried Over)',
      badgeType: 'overdue',
      sortOrder: 0,
    };
  }

  // Future dates
  const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return {
    key: dateStr,
    label: formatted,
    badge: 'Upcoming',
    badgeType: 'upcoming',
    sortOrder: 3,
  };
}
