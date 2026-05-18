import React from 'react';
import { Icons } from '../App';

export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ message, onRetry, retryLabel = 'Try again' }) => (
  <div
    role="alert"
    className="p-6 rounded-3xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center gap-4"
  >
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <Icons.AlertTriangle className="shrink-0 mt-0.5" size={20} />
      <p className="text-sm font-semibold leading-snug">{message}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors"
      >
        {retryLabel}
      </button>
    )}
  </div>
);
