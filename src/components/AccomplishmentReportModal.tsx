import React, { useState, useMemo } from 'react';
import { useTasks } from '@/context/TaskContext';
import {
  buildAccomplishmentRows,
  exportToCSV,
  generateWeeklySummaryMarkdown,
  AccomplishmentRow,
} from '@/lib/export';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Calendar,
  Filter,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';

interface AccomplishmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccomplishmentReportModal: React.FC<AccomplishmentReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, projects } = useTasks();

  const [dateRange, setDateRange] = useState<'ALL' | '7DAYS' | '30DAYS'>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'TABLE' | 'MARKDOWN'>('TABLE');
  const [copied, setCopied] = useState(false);

  // Compute accomplishment rows
  const allRows = useMemo(() => {
    return buildAccomplishmentRows(tasks, projects);
  }, [tasks, projects]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      // Project filter
      if (selectedProjectId !== 'ALL') {
        const project = projects.find(p => p.id === selectedProjectId);
        if (project && row.project !== project.name) return false;
      }

      // Date filter
      if (dateRange === '7DAYS') {
        const rowTime = new Date(row.date).getTime();
        const cutoff = Date.now() - 7 * 86400000;
        if (rowTime < cutoff) return false;
      } else if (dateRange === '30DAYS') {
        const rowTime = new Date(row.date).getTime();
        const cutoff = Date.now() - 30 * 86400000;
        if (rowTime < cutoff) return false;
      }

      return true;
    });
  }, [allRows, selectedProjectId, dateRange, projects]);

  // Compute total duration
  const totalHours = useMemo(() => {
    const sum = filteredRows.reduce((acc, r) => acc + (parseFloat(r.durationHrs) || 0), 0);
    return sum.toFixed(2);
  }, [filteredRows]);

  const markdownSummary = useMemo(() => {
    return generateWeeklySummaryMarkdown(filteredRows);
  }, [filteredRows]);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(filteredRows, `Accomplishment_Report_${dateStr}.csv`);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Accomplishment Report & Spreadsheet Export
              </h2>
              <p className="text-xs text-neutral-400">
                Generate official time logs, CSV tables, and weekly accomplishment summaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Filters & Views */}
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveTab('TABLE')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'TABLE' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Table Preview
              </button>
              <button
                onClick={() => setActiveTab('MARKDOWN')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'MARKDOWN' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Weekly Summary (Markdown)
              </button>
            </div>

            {/* Date range filter */}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Time</option>
              <option value="7DAYS">Past 7 Days</option>
              <option value="30DAYS">Past 30 Days</option>
            </select>

            {/* Project filter */}
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 mr-2">
              Total Logged: <strong className="text-emerald-400 font-mono">{totalHours} hrs</strong>
            </span>

            {activeTab === 'MARKDOWN' ? (
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
            ) : null}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'TABLE' ? (
            filteredRows.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 text-sm">
                No accomplishment rows found for the selected filters.
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3.5">Task Description</th>
                      <th className="py-3 px-3 text-center">Start</th>
                      <th className="py-3 px-3 text-center">End</th>
                      <th className="py-3 px-3 text-right">Duration (Hrs)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/60 font-mono">
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/50 transition">
                        <td className="py-2.5 px-3.5 text-neutral-300 font-sans whitespace-nowrap">{row.date}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-white">{row.project}</td>
                        <td className="py-2.5 px-3 font-sans text-neutral-400">{row.category}</td>
                        <td className="py-2.5 px-3 font-sans text-neutral-400">{row.location}</td>
                        <td className="py-2.5 px-3.5 font-sans text-neutral-200 max-w-xs truncate" title={row.task}>
                          {row.task}
                        </td>
                        <td className="py-2.5 px-3 text-center text-neutral-400">{row.startTime}</td>
                        <td className="py-2.5 px-3 text-center text-neutral-400">{row.endTime}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{row.durationHrs}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'DONE'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Formatted weekly report preview ready for email / submission:</span>
              </div>
              <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {markdownSummary}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
