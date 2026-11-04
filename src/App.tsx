import { useState, useEffect, useCallback } from 'react';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { ActiveTaskDock } from '@/components/ActiveTaskDock';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { CalendarView } from '@/components/CalendarView';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { RetroactiveModal } from '@/components/RetroactiveModal';
import { AccomplishmentReportModal } from '@/components/AccomplishmentReportModal';
import { CommitCompletionModal } from '@/components/CommitCompletionModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { Toast } from '@/components/Toast';
import { MiniWidgetOverlay } from '@/components/MiniWidgetOverlay';
import { openMiniWidgetPip, closeMiniWidgetPip, updateMiniWidgetPip, isDocumentPipSupported } from '@/lib/pip';
import { formatDuration } from '@/lib/time';
import { CheckSquare } from 'lucide-react';

function MainApp() {
  const {
    activeTask,
    activeTimer,
    stopTimer,
    startTimer,
    toggleTaskComplete,
    projects,
    filters,
    pendingCommitTask,
    cancelTaskComplete,
    commitTaskComplete,
    pendingDeleteTask,
    cancelTaskDelete,
    confirmPermanentDelete,
    archiveTask,
    toast,
    dismissToast,
  } = useTasks();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createPresetDate, setCreatePresetDate] = useState<string | undefined>(undefined);
  const [isRetroOpen, setIsRetroOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMiniWidgetOpen, setIsMiniWidgetOpen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync PiP floating window DOM
  const renderPipContent = useCallback((container: HTMLElement) => {
    const project = projects.find(p => p.id === activeTask?.projectId);
    const timeFormatted = activeTimer ? formatDuration(activeTimer.elapsedSeconds) : '00:00:00';
    const taskTitle = activeTask ? activeTask.title : 'No active task';

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#111;color:#fff;font-family:system-ui,-apple-system,sans-serif;height:100%;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${activeTimer ? '#10b981' : '#6b7280'};flex-shrink:0;"></span>
          <div style="min-width:0;flex:1;">
            <div style="font-size:11px;font-weight:600;color:${project?.color || '#3b82f6'};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">
              ${project?.name || 'General'}
            </div>
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f3f4f6;" title="${taskTitle}">
              ${taskTitle}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-left:12px;flex-shrink:0;">
          <div style="font-family:monospace;font-size:15px;font-weight:700;color:#34d399;background:#050505;padding:4px 8px;border-radius:6px;border:1px solid #1f2937;">
            ${timeFormatted}
          </div>
          ${
            activeTask
              ? `
            <button id="pip-toggle-btn" style="background:#262626;border:1px solid #404040;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;">
              ${activeTimer ? '⏸' : '▶'}
            </button>
            <button id="pip-done-btn" style="background:#065f46;border:1px solid #059669;color:#34d399;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;">
              ✓
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    const toggleBtn = container.querySelector('#pip-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (!activeTask) return;
        if (activeTimer) {
          stopTimer();
        } else {
          startTimer(activeTask.id);
        }
      });
    }

    const doneBtn = container.querySelector('#pip-done-btn');
    if (doneBtn && activeTask) {
      doneBtn.addEventListener('click', () => {
        toggleTaskComplete(activeTask.id);
      });
    }
  }, [activeTask, activeTimer, projects, startTimer, stopTimer, toggleTaskComplete]);

  // Keep PiP updated whenever activeTimer, activeTask, or projects change
  useEffect(() => {
    if (isPipActive) {
      updateMiniWidgetPip(renderPipContent);
    }
  }, [isPipActive, activeTimer?.elapsedSeconds, activeTask, renderPipContent]);

  const handleTogglePip = useCallback(async () => {
    if (isPipActive) {
      closeMiniWidgetPip();
      setIsPipActive(false);
    } else {
      if (isDocumentPipSupported()) {
        const win = await openMiniWidgetPip(renderPipContent, () => {
          setIsPipActive(false);
        });
        if (win) {
          setIsPipActive(true);
        } else {
          // Fallback to in-app overlay
          setIsMiniWidgetOpen(true);
        }
      } else {
        // Fallback to in-app overlay if Document PiP isn't supported
        setIsMiniWidgetOpen(true);
      }
    }
  }, [isPipActive, renderPipContent]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+T: Toggle Mini-Widget
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        handleTogglePip();
      }
      // Ctrl+N: New Task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setCreatePresetDate(undefined);
        setIsCreateOpen(true);
      }
      // Ctrl+L: Log past work
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !e.shiftKey) {
        e.preventDefault();
        setIsRetroOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePip]);

  const handleOpenCreateWithDate = (dateStr: string) => {
    setCreatePresetDate(dateStr);
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Dock Header */}
      <ActiveTaskDock
        onOpenCreateModal={() => {
          setCreatePresetDate(undefined);
          setIsCreateOpen(true);
        }}
        onOpenRetroModal={() => setIsRetroOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
        onTogglePip={handleTogglePip}
        isPipActive={isPipActive}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Workspace: Sidebar + Task Board / Calendar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Mobile Slide-Out Drawer Navigation */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Off-canvas drawer */}
            <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full">
              <Sidebar
                isMobileDrawer={true}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-neutral-950">
          {filters.statusTab === 'CALENDAR' ? (
            <CalendarView onOpenCreateWithDate={handleOpenCreateWithDate} />
          ) : (
            <TaskList
              onOpenCreateModal={() => {
                setCreatePresetDate(undefined);
                setIsCreateOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <CreateTaskModal
        key={createPresetDate || 'new-task'}
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreatePresetDate(undefined);
        }}
        initialDate={createPresetDate}
      />

      <RetroactiveModal
        isOpen={isRetroOpen}
        onClose={() => setIsRetroOpen(false)}
      />

      <AccomplishmentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Commit Completion Prompt Modal */}
      <CommitCompletionModal
        key={pendingCommitTask?.id || 'commit-modal'}
        task={pendingCommitTask}
        project={projects.find(p => p.id === pendingCommitTask?.projectId)}
        activeTimerSeconds={activeTimer?.taskId === pendingCommitTask?.id ? (activeTimer?.elapsedSeconds ?? 0) : 0}
        isTimerRunningOnTask={activeTimer?.taskId === pendingCommitTask?.id}
        isOpen={!!pendingCommitTask}
        onClose={cancelTaskComplete}
        onCommit={commitTaskComplete}
      />

      {/* Delete Confirmation Prompt Modal */}
      <DeleteConfirmationModal
        key={pendingDeleteTask?.id || 'delete-modal'}
        task={pendingDeleteTask}
        isOpen={!!pendingDeleteTask}
        onClose={cancelTaskDelete}
        onConfirmPermanentDelete={confirmPermanentDelete}
        onArchive={archiveTask}
      />

      <MiniWidgetOverlay
        isOpen={isMiniWidgetOpen}
        onClose={() => setIsMiniWidgetOpen(false)}
        onOpenPip={handleTogglePip}
      />

      {/* Quality of life Undo Toast Notification */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function AppGate() {
  const { user, isLoading, isAuthorized, isOfflineMode } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-pulse shadow-md shadow-indigo-500/20">
            <CheckSquare className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">Loading DevTracker...</p>
        </div>
      </div>
    );
  }

  // If not running in offline mode, enforce authentication & owner whitelist
  if (!isOfflineMode && (!user || !isAuthorized)) {
    return <LoginPage />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <AppGate />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
