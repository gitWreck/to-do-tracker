import { Task, Project } from '@/types';
import { formatTimeOnly, formatDecimalHours } from './time';

export interface AccomplishmentRow {
  date: string;
  project: string;
  category: string;
  location: string;
  task: string;
  startTime: string;
  endTime: string;
  durationHrs: string;
  status: string;
}

export function buildAccomplishmentRows(tasks: Task[], projects: Project[]): AccomplishmentRow[] {
  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const rows: AccomplishmentRow[] = [];

  tasks.forEach(task => {
    const projectName = projectMap.get(task.projectId) || 'General';
    const statusText = task.status === 'COMPLETED' ? 'DONE' : task.status;

    const extraInfo = [
      task.completionNote ? `Note: ${task.completionNote}` : '',
      task.description ? task.description.replace(/\n+/g, ' • ') : '',
    ].filter(Boolean).join(' | ');

    const taskTitleWithNote = extraInfo ? `${task.title} [${extraInfo}]` : task.title;

    if (task.timeEntries && task.timeEntries.length > 0) {
      task.timeEntries.forEach(entry => {
        const rowDate = entry.date || (entry.startTime ? entry.startTime.split('T')[0] : '');
        rows.push({
          date: rowDate,
          project: projectName,
          category: task.category,
          location: task.location,
          task: taskTitleWithNote,
          startTime: formatTimeOnly(entry.startTime),
          endTime: entry.endTime ? formatTimeOnly(entry.endTime) : 'In Progress',
          durationHrs: formatDecimalHours(entry.durationSeconds),
          status: statusText,
        });
      });
    } else {
      // If task has no separate time logs but has total duration or completed
      const rowDate = task.completedAt ? task.completedAt.split('T')[0] : task.createdAt.split('T')[0];
      rows.push({
        date: rowDate,
        project: projectName,
        category: task.category,
        location: task.location,
        task: taskTitleWithNote,
        startTime: '--:--',
        endTime: '--:--',
        durationHrs: formatDecimalHours(task.totalDurationSeconds || 0),
        status: statusText,
      });
    }
  });

  // Sort by date descending, then project
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export function exportToCSV(rows: AccomplishmentRow[], filename = 'accomplishment_report.csv') {
  const headers = ['Date', 'Project', 'Category', 'Location', 'Task', 'Start Time', 'End Time', 'Duration (Hrs)', 'Status'];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => [
      `"${r.date}"`,
      `"${r.project.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.location}"`,
      `"${r.task.replace(/"/g, '""')}"`,
      `"${r.startTime}"`,
      `"${r.endTime}"`,
      r.durationHrs,
      `"${r.status}"`
    ].join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateWeeklySummaryMarkdown(rows: AccomplishmentRow[]): string {
  if (rows.length === 0) return 'No accomplishments logged for this period.';

  // Group by date
  const groupedByDate: Record<string, AccomplishmentRow[]> = {};
  rows.forEach(r => {
    if (!groupedByDate[r.date]) groupedByDate[r.date] = [];
    groupedByDate[r.date].push(r);
  });

  const dates = Object.keys(groupedByDate).sort().reverse();

  let markdown = `# Weekly Accomplishment Summary\n\n`;

  let grandTotalSeconds = 0;

  dates.forEach(date => {
    markdown += `### ${date}\n`;
    const dateRows = groupedByDate[date];
    let dailyHours = 0;

    dateRows.forEach(row => {
      const hrs = parseFloat(row.durationHrs) || 0;
      dailyHours += hrs;
      grandTotalSeconds += hrs * 3600;
      markdown += `- **[${row.project}]** ${row.task} (${row.category} / ${row.location}) — *${row.durationHrs} hrs* [${row.status}]\n`;
    });

    markdown += `\n*Daily Total: ${dailyHours.toFixed(2)} hrs*\n\n`;
  });

  markdown += `---\n**Total Time Logged:** ${(grandTotalSeconds / 3600).toFixed(2)} hours\n`;
  return markdown;
}

