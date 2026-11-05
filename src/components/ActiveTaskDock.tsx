import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { formatDuration, formatDurationCompact, getTodayDateString } from '@/lib/time';
import {
  Square,
  CheckCircle2,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Clock,
  Flame,
  Sun,
  Moon,
  Cloud,
  RefreshCw,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  HardDrive,
  Menu,
  WifiOff
} from 'lucide-react';

interface ActiveTaskDockProps {
  onOpenCreateModal: () => void;
  onOpenRetroModal: () => void;
  onOpenReportModal: () => void;
  onTogglePip: () => void;
  isPipActive: boolean;
  onToggleMobileMenu?: () => void;
}

export const ActiveTaskDock: React.FC<ActiveTaskDockProps> = ({
  onOpenCreateModal,
  onOpenRetroModal,
  onOpenReportModal,
  onTogglePip,
  isPipActive,
  onToggleMobileMenu,
}) => {
  const {
    activeTask,
    activeTimer,
    stopTimer,
    toggleTaskComplete,
    projects,
    tasks,
    isSyncing,
    isOnline,
    queuedMutationsCount,
    syncOfflineQueueNow,
  } = useTasks();
  const { isDark, toggleTheme } = useTheme();
  const { user, isOfflineMode, setOfflineMode, signOut, isConfigured } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Project for active task
  const activeProject = projects.find(p => p.id === activeTask?.projectId);

  // Calculate today's stats
  const todayStr = getTodayDateString();
  const todayCompletedCount = tasks.filter(
    t => t.status === 'COMPLETED' && t.completedAt && t.completedAt.startsWith(todayStr)
  ).length;

  // Calculate total seconds logged today across all tasks
  let todayTotalSeconds = 0;
  tasks.forEach(t => {
    (t.timeEntries || []).forEach(e => {
      if (e.date === todayStr) {
        todayTotalSeconds += e.durationSeconds;
      }
    });
  });
  if (activeTimer) {
    todayTotalSeconds += (activeTimer.sessionSeconds || 0);
  }

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userEmail = user?.email || '';

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-slate-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Mobile Drawer Trigger + Active Task or Idle Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition flex-shrink-0 cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {activeTask && activeTimer ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/80 rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-inner max-w-xl truncate min-w-0">
              {/* Pulsing indicator */}
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
              </span>

              {/* Project Badge */}
              <span
                className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md text-white flex-shrink-0"
                style={{ backgroundColor: activeProject?.color || '#3b82f6' }}
              >
                {activeProject?.name || 'General'}
              </span>

              {/* Task Title */}
              <span className="font-medium text-xs sm:text-sm text-slate-900 dark:text-neutral-100 truncate" title={activeTask.title}>
                {activeTask.title}
              </span>

              {/* Live Timer */}
              <div className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums px-1.5 sm:px-2 py-0.5 bg-white dark:bg-neutral-950/60 rounded border border-emerald-500/20 shadow-xs flex-shrink-0">
                {formatDuration(activeTimer.elapsedSeconds)}
              </div>

              {/* Quick Actions for active task */}
              <div className="flex items-center gap-0.5 sm:gap-1 border-l border-slate-300 dark:border-neutral-700 pl-1.5 sm:pl-2">
                <button
                  onClick={stopTimer}
                  title="Pause / Stop Timer"
                  className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 transition"
                >
                  <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-amber-500" />
                </button>
                <button
                  onClick={() => toggleTaskComplete(activeTask.id)}
                  title="Mark Task Completed"
                  className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs sm:text-sm bg-slate-100 dark:bg-neutral-950/40 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 truncate">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 flex-shrink-0" />
              <span className="truncate">Select a task below to start tracking.</span>
            </div>
          )}

          {/* Today's Quick Summary Metric */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 border-l border-slate-200 dark:border-neutral-800 pl-3">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-neutral-300">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Today: <span className="text-slate-900 dark:text-white font-mono">{formatDurationCompact(todayTotalSeconds)}</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Done: <span className="text-slate-900 dark:text-white font-semibold">{todayCompletedCount}</span>
            </span>
          </div>
        </div>

        {/* Right: Functional Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Cloud Sync Status Indicator */}
          {!isOfflineMode && user ? (
            !isOnline ? (
              <button
                onClick={syncOfflineQueueNow}
                title="Device is offline. Changes are saved locally and will auto-sync when connection returns. Tap to retry."
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="hidden sm:inline">Offline</span>
                {queuedMutationsCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100">
                    {queuedMutationsCount}
                  </span>
                )}
              </button>
            ) : isSyncing || queuedMutationsCount > 0 ? (
              <button
                onClick={syncOfflineQueueNow}
                title="Syncing offline changes to Supabase Cloud..."
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
                <span className="hidden sm:inline">Syncing...</span>
                {queuedMutationsCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-200/80 dark:bg-indigo-800/80 text-indigo-900 dark:text-indigo-100">
                    {queuedMutationsCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={syncOfflineQueueNow}
                title="Live Realtime Multi-Device Sync Active. Click to verify & force sync now."
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
              >
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="hidden lg:inline text-slate-700 dark:text-neutral-200">Live Sync</span>
              </button>
            )
          ) : (
            <div
              title="Running in Local Offline Storage"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="hidden sm:inline">Local Offline</span>
            </div>
          )}

          {/* Theme Toggle (Light / Dark mode) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-300 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Always-on-top Mini-Widget button (Desktop only) */}
          <button
            onClick={onTogglePip}
            title={isPipActive ? 'Close Floating Mini-Widget' : 'Pop out Always-On-Top Floating Mini-Widget'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              isPipActive
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-600/30 dark:border-indigo-500 dark:text-indigo-300'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-700'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mini Widget</span>
          </button>

          {/* Log Past Work (Retroactive modal) */}
          <button
            onClick={onOpenRetroModal}
            title="Log past hours retroactively"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Log Past Work</span>
          </button>

          {/* Accomplishment Report & CSV Export */}
          <button
            onClick={onOpenReportModal}
            title="Export Government Accomplishment Report & CSV"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800/80 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-100 transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Report & CSV</span>
          </button>

          {/* New Task Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>

          {/* User Profile / Auth Button */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              title={user ? `Signed in as ${user.email}` : 'Account Settings'}
              className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userEmail}
                  className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-300 dark:ring-neutral-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                  {userEmail ? userEmail[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
            </button>

            {/* Profile Dropdown Popup */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-neutral-800">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={userEmail}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                            {userEmail[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {user?.user_metadata?.full_name || 'Owner'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate font-mono">
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Private Google-authenticated instance</span>
                      </div>

                      <button
                        onClick={async () => {
                          setShowProfileMenu(false);
                          await signOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-medium transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="pb-2 border-b border-slate-100 dark:border-neutral-800">
                        <p className="font-semibold text-slate-900 dark:text-white">Offline Mode</p>
                        <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                          Tasks and time are saved in local browser storage.
                        </p>
                      </div>
                      {isConfigured && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setOfflineMode(false);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          <span>Connect to Google / Cloud</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
