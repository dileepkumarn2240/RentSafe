import React, { useMemo } from 'react';
import { METRIC_LABEL } from '../../App';
import { PortfolioSummary, UnitRevenueDTO } from '../../types';

type Props = {
  portfolio: PortfolioSummary | null;
  historicalRevenue: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  unitRevenues: UnitRevenueDTO[];
};

function num(v: unknown, fb = 0): number {
  if (v == null) return fb;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fb;
}

/** Paid bill cash application by month (last 6 months) — values from ledger-backed API only. */
export const CashApplicationTrendChart: React.FC<{ historicalRevenue: Record<string, number> }> = ({
  historicalRevenue,
}) => {
  const entries = useMemo(() => Object.entries(historicalRevenue), [historicalRevenue]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const w = 320;
  const h = 120;
  const pad = 8;
  const pts = entries.map(([label, val], i) => {
    const x = pad + (i / Math.max(entries.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (val / max) * (h - pad * 2);
    return { x, y, label, val };
  });
  const d = pts.length
    ? `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <div className="space-y-4">
      <p className={METRIC_LABEL}>Cash application trend</p>
      <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest leading-relaxed">
        Sum of paid utility / recurring charges by paid date (rolling six months).
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No paid bill history in range.</p>
      ) : (
        <div className="relative group p-4 bg-white/5 rounded-3xl border border-white/5 shadow-inner backdrop-blur-md transition-all hover:bg-white/10">
          <svg viewBox={`0 0 ${w} ${h + 28}`} className="w-full h-44 drop-shadow-xl overflow-visible">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {pts.length > 1 && (
              <path
                d={`${d} L ${pts[pts.length - 1].x},${h - pad} L ${pts[0].x},${h - pad} Z`}
                fill="url(#lineGrad)"
                className="animate-pulse opacity-70 group-hover:opacity-100 transition-opacity duration-700"
              />
            )}
            {d && (
              <path 
                d={d} 
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}
            {pts.map((p) => (
              <g key={p.label} className="cursor-pointer transition-transform hover:-translate-y-1 hover:scale-110">
                <circle cx={p.x} cy={p.y} r="5" className="fill-amber-400 stroke-white dark:stroke-[#0f1419]" strokeWidth="2.5" />
                <circle cx={p.x} cy={p.y} r="8" className="fill-amber-400/0 stroke-amber-400/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping" strokeWidth="1" />
                <text x={p.x} y={h + 16} textAnchor="middle" className="fill-slate-500 text-[9px] font-black uppercase tracking-widest transition-colors group-hover:fill-slate-900 dark:group-hover:fill-white">
                  {p.label.replace('-', ' ')}
                </text>
                <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[10px] font-black italic opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  ₹{p.val}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

/** Occupied vs vacant unit capacity (portfolio-level). */
export const PortfolioOccupancyDonut: React.FC<{ portfolio: PortfolioSummary }> = ({ portfolio }) => {
  const occ = portfolio.occupiedUnits;
  const vac = portfolio.vacantUnits;
  const total = Math.max(occ + vac, 1);
  const occPct = (occ / total) * 100;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (occPct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-8 group w-full">
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <svg viewBox="0 0 140 140" className="w-32 h-32 drop-shadow-lg relative z-10">
          <circle cx="70" cy="70" r={r} fill="none" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="16" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            className="stroke-amber-400 transition-all duration-1000 ease-out"
            strokeWidth="16"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 70 70)"
            strokeLinecap="round"
          />
          <text x="70" y="78" textAnchor="middle" className="fill-slate-900 dark:fill-white text-3xl font-black italic tracking-tighter">
            {Math.round(occPct)}%
          </text>
        </svg>
      </div>
      <div className="space-y-3 text-sm w-full">
        <p className={`${METRIC_LABEL} text-center mb-2`}>Occupancy mix</p>
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Occupied</span>
          </div>
          <span className="font-black text-amber-600 dark:text-amber-400 text-lg italic">{occ}</span>
        </div>
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Vacant</span>
          </div>
          <span className="font-black text-slate-700 dark:text-slate-400 text-lg italic">{vac}</span>
        </div>
      </div>
    </div>
  );
};

/** Contractual monthly rent / lease consideration by unit (rental monthly rent, lease capitalized amount). */
export const UnitRentrollBarChart: React.FC<{ rows: UnitRevenueDTO[] }> = ({ rows }) => {
  const data = useMemo(
    () =>
      rows
        .map((r) => ({
          id: r.unitId,
          label: `${r.propertyName.slice(0, 12)}${r.propertyName.length > 12 ? '…' : ''} · ${r.unitName}`,
          amount: r.agreementType === 'LEASE' ? num(r.leaseAmount) : num(r.monthlyRent),
        }))
        .sort((a, b) => b.amount - a.amount),
    [rows]
  );
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      <p className={METRIC_LABEL}>Rent roll by unit</p>
      <div className="space-y-4 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
        {data.map((d, idx) => (
          <div key={d.id} className="group p-3 rounded-2xl bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/5 hover:border-amber-400/30 transition-colors shadow-sm dark:shadow-none">
            <div className="flex justify-between items-end mb-2">
              <span className="truncate max-w-[70%] text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{d.label}</span>
              <span className="text-amber-600 dark:text-amber-400 text-lg font-black italic tracking-tighter">₹{d.amount.toLocaleString()}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-all duration-1000 ease-out"
                style={{ width: `${(d.amount / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Posted bill-type mix (current model aggregates bill lines on units). */
export const BillTypeMixChart: React.FC<{ expenseBreakdown: Record<string, number> }> = ({ expenseBreakdown }) => {
  const entries = useMemo(
    () =>
      Object.entries(expenseBreakdown)
        .map(([k, v]) => ({ k, v: num(v) }))
        .filter((e) => e.v > 0)
        .sort((a, b) => b.v - a.v),
    [expenseBreakdown]
  );
  const max = Math.max(...entries.map((e) => e.v), 1);

  if (entries.length === 0) {
    return (
      <div>
        <p className={METRIC_LABEL}>Bill-type exposure</p>
        <p className="text-sm text-slate-500 mt-2">No bill lines on file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className={METRIC_LABEL}>Bill-type exposure (posted amounts)</p>
      <div className="space-y-4">
        {entries.map((e, idx) => {
          const colors = ['from-indigo-500 to-violet-500', 'from-sky-400 to-indigo-400', 'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500'];
          return (
            <div key={e.k} className="group p-3 rounded-2xl bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none hover:border-violet-400/30 transition-colors">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{e.k}</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 italic tracking-tighter">₹{e.v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(139,92,246,0.3)]`}
                  style={{ width: `${(e.v / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ExecutiveFinancialViz: React.FC<Props> = ({
  portfolio,
  historicalRevenue,
  expenseBreakdown,
  unitRevenues,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-6 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-[#0c1017]/80 dark:to-[#0f1419]/80 backdrop-blur-xl p-10 shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15">
        <CashApplicationTrendChart historicalRevenue={historicalRevenue} />
      </div>
      <div className="xl:col-span-3 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl p-10 shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15 flex items-center">
        {portfolio ? (
          <PortfolioOccupancyDonut portfolio={portfolio} />
        ) : (
          <p className="text-sm text-slate-500 text-center w-full">Portfolio metrics unavailable.</p>
        )}
      </div>
      <div className="xl:col-span-3 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl p-10 shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15">
        <BillTypeMixChart expenseBreakdown={expenseBreakdown} />
      </div>
      <div className="xl:col-span-12 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl p-10 shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15">
        <UnitRentrollBarChart rows={unitRevenues} />
      </div>
    </div>
  );
};
