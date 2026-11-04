import React from 'react';
import { useTasks } from '@/context/TaskContext';
import { formatDuration } from '@/lib/time';
import { Play, Square, CheckCircle2, X, ExternalLink, Move } from 'lucide-react';

interface MiniWidgetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPip: () => void;
  isPipActive: boolean;
}

export const MiniWidgetOverlay: React.FC<MiniWidgetOverlayProps> = ({
  isOpen,
  onClose,
  onOpenPip,
  isPipActive,
}) => {
  const { activeTask, activeTimer, stopTimer, startTimer, toggleTaskComplete, projects } = useTasks();

  if (!isOpen) return null;

  const project = projects.find(p => p.id === activeTask?.projectId);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-3 shadow-2xl shadow-black/60 flex items-center gap-3 w-84">
        {/* Pulsing indicator */}
        <span className="relative flex h-3 w-3 flex-shrink-0">
          {activeTask && activeTimer ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neutral-600"></span>
          )}
        </span>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {project && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
            )}
            <span className="text-xs font-semibold text-neutral-200 truncate">
              {activeTask ? activeTask.title : 'No active task'}
            </span>
          </div>

          <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
            {activeTimer ? formatDuration(activeTimer.elapsedSeconds) : '00:00:00'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {activeTask && (
            <>
              <button
                onClick={() => {
                  if (activeTimer) {
                    stopTimer();
                  } else {
                    startTimer(activeTask.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
                title={activeTimer ? 'Pause Stopwatch' : 'Resume Stopwatch'}
              >
                {activeTimer ? <Square className="w-3.5 h-3.5 text-amber-400 fill-current" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => toggleTaskComplete(activeTask.id)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition"
                title="Mark Completed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onOpenPip}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 transition"
            title="Pop out Always-On-Top PiP Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
            title="Dismiss Overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
