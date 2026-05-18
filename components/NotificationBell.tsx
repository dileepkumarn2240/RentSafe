import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '../types';
import { api } from '../services/apiService';
import { Icons } from '../App';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await api.getNotifications();
      setItems(list);
    } catch {
      setError('Could not load alerts');
    }
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const unread = items.length;

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setItems(prev => prev.filter(n => n.id !== id));
    } catch {
      setError('Could not dismiss alert');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-amber-400/20 hover:border-amber-400/40 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] cursor-default bg-transparent"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-3 z-[70] w-[min(100vw-2rem,22rem)] max-h-[70vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1419] shadow-2xl py-2">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alerts & reminders</span>
              <button
                type="button"
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase"
                onClick={() => navigate('/finance')}
              >
                Billing
              </button>
            </div>
            {error && <p className="px-4 py-3 text-xs text-rose-600">{error}</p>}
            {items.length === 0 && !error ? (
              <div className="px-4 py-6 text-center space-y-3">
                <p className="text-xs text-slate-500">No new alerts. Rent and bill reminders appear here when your landlord creates bills or payments are recorded.</p>
                <p className="text-[10px] text-slate-400 leading-snug">Direct owner–tenant chat is not in this build—use Maintenance or Documents for structured communication.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {items.map(n => (
                  <li key={n.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className="flex justify-between gap-2 items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">{n.message}</p>
                        {n.createdAt && (
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="shrink-0 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400"
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};
