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

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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
