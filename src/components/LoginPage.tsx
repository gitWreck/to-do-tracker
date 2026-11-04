import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CheckSquare, ShieldAlert, LogOut, Sun, Moon, HardDrive, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, isAuthorized, allowedEmail, signInWithGoogle, signOut, setOfflineMode } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMessage(err.message || 'Failed to initiate Google sign-in. Please try again.');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 transition-colors relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle corner button */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
        title="Toggle Theme"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 relative z-10 backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 mb-4">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            DevTracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Personal Developer Work & Time Tracker
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-3 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Private Single-User Instance
          </div>
        </div>

        {/* State A: User is logged in with an unauthorized Google account */}
        {user && !isAuthorized ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
              <div className="flex items-center gap-2 mb-2 font-semibold text-rose-900 dark:text-rose-100">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>Access Restricted</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                You are currently signed in as <strong className="font-mono text-rose-950 dark:text-white">{user.email}</strong>. 
                However, this private workspace is strictly locked to its designated owner.
              </p>
              {allowedEmail && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-200 dark:border-rose-900/60 text-xs">
                  Authorized Owner: <span className="font-mono font-medium">{allowedEmail}</span>
                </div>
              )}
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-sm transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        ) : (
          /* State B: Not signed in yet */
          <div className="space-y-5">
            <p className="text-xs text-center text-slate-600 dark:text-neutral-400 leading-relaxed px-2">
              Sign in with your Google account to synchronize your tasks, active stopwatches, and accomplishment reports anywhere in the world.
            </p>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white hover:bg-slate-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white font-medium text-sm transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Offline Local Storage Fallback */}
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
              <button
                onClick={() => setOfflineMode(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Continue Offline (Local Storage Mode)</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-[11px] text-slate-400 dark:text-neutral-500">
          Powered by Supabase Row-Level Security & Vercel
        </div>
      </div>
    </div>
  );
};
