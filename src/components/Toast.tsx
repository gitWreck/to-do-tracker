import React from 'react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

export interface ToastInfo {
  id: string;
  message: string;
  undoAction?: () => void;
}

interface ToastProps {
  toast: ToastInfo | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-slate-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 dark:border-neutral-200 text-xs font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
        <span className="max-w-xs truncate">{toast.message}</span>

        {toast.undoAction && (
          <button
            onClick={() => {
              if (toast.undoAction) toast.undoAction();
              onDismiss();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 dark:bg-neutral-100 hover:bg-slate-700 dark:hover:bg-neutral-200 text-indigo-400 dark:text-indigo-600 font-semibold transition ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        )}

        <button
          onClick={onDismiss}
          className="text-slate-400 dark:text-neutral-400 hover:text-white dark:hover:text-black ml-1 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
