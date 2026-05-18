import React, { useEffect, useState } from 'react';
import { METRIC_LABEL, Icons } from '../../App';
import { api } from '../../services/apiService';

export type SecurityFeed = {
  id: string;
  location: string;
  isActive?: boolean;
  propertyId?: string;
  propertyName?: string;
};

type SecurityState = {
  status: string;
  feeds: SecurityFeed[];
  recentAlerts?: { id: string; message: string; time: string; severity?: string }[];
};

export const SecurityWall: React.FC = () => {
  const [state, setState] = useState<SecurityState | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getOwnerSecurity()
      .then((data) => {
        if (!cancelled) {
          setState(data as SecurityState);
          setErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Security unavailable');
          setState(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{err}</p>
    );
  }

  if (!state) {
    return <div className="animate-pulse h-48 rounded-[2rem] bg-slate-100 dark:bg-white/5" />;
  }

  if (!state.feeds?.length || state.status === 'NO_CAMERAS_CONFIGURED') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-8 text-center space-y-3">
        <Icons.Video className="mx-auto text-slate-300 dark:text-slate-600" size={40} />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No camera channels configured</p>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
          Set <span className="text-amber-600">CCTV count</span> on each property under Properties to reserve monitoring slots. Streams are not simulated in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className={METRIC_LABEL}>Security wall (all properties)</span>
        <span className="text-[9px] font-black uppercase px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
          {state.status}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {state.feeds.map((feed) => (
          <div key={feed.id} className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.Video className="text-white/20" size={32} />
            </div>
            <div className="absolute top-3 left-3 right-3 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shrink-0" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest truncate">
                  {feed.propertyName ? `${feed.propertyName} · ` : ''}{feed.location}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {state.recentAlerts && state.recentAlerts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2">
          <span className={METRIC_LABEL}>Recent alerts</span>
          {state.recentAlerts.slice(0, 6).map((a) => (
            <p key={a.id} className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              {a.message} <span className="opacity-60">{a.time}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
