import React from 'react';
import { Icons, METRIC_LABEL } from '../../App';

export type CommandCenterFilters = {
  unpaidChargesOnly: boolean;
  pendingRentOnly: boolean;
  leaseAgreementsOnly: boolean;
  excludeVacant: boolean;
};

const defaultFilters: CommandCenterFilters = {
  unpaidChargesOnly: false,
  pendingRentOnly: false,
  leaseAgreementsOnly: false,
  excludeVacant: false,
};

type Props = {
  open: boolean;
  onClose: () => void;
  filters: CommandCenterFilters;
  onChange: (next: CommandCenterFilters) => void;
  onReset: () => void;
};

export function useCommandCenterFilters(initial: CommandCenterFilters = defaultFilters) {
  const [filters, setFilters] = React.useState<CommandCenterFilters>(initial);
  const reset = React.useCallback(() => setFilters({ ...defaultFilters }), []);
  return { filters, setFilters, reset };
}

export const CommandCenterFilterDrawer: React.FC<Props> = ({ open, onClose, filters, onChange, onReset }) => {
  if (!open) return null;

  const row = (label: string, checked: boolean, onToggle: () => void, hint: string) => (
    <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer hover:border-amber-400/40 transition-colors">
      <input
        type="checkbox"
        className="mt-1 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
        checked={checked}
        onChange={onToggle}
      />
      <span>
        <span className="block text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{label}</span>
        <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1 leading-relaxed">{hint}</span>
      </span>
    </label>
  );

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-sm"
        aria-label="Close filters"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-md z-[95] bg-white dark:bg-[#0c1017] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-reveal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        <div className="p-8 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
          <div>
            <p className={METRIC_LABEL} id="filter-drawer-title">
              Data filters
            </p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
              Receivables workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors"
            aria-label="Close"
          >
            <Icons.X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {row(
            'Unpaid charges only',
            filters.unpaidChargesOnly,
            () => onChange({ ...filters, unpaidChargesOnly: !filters.unpaidChargesOnly }),
            'Show units where maintenance, electricity, or water is still PENDING.'
          )}
          {row(
            'Pending rent only',
            filters.pendingRentOnly,
            () => onChange({ ...filters, pendingRentOnly: !filters.pendingRentOnly }),
            'Rental agreements with rent status PENDING.'
          )}
          {row(
            'Lease agreements only',
            filters.leaseAgreementsOnly,
            () => onChange({ ...filters, leaseAgreementsOnly: !filters.leaseAgreementsOnly }),
            'Units on LEASE agreement type.'
          )}
          {row(
            'Hide vacant',
            filters.excludeVacant,
            () => onChange({ ...filters, excludeVacant: !filters.excludeVacant }),
            'Exclude rows marked vacant with no active tenant.'
          )}
        </div>
        <div className="p-8 border-t border-slate-200 dark:border-white/10 flex gap-3">
          <button
            type="button"
            onClick={() => {
              onReset();
            }}
            className="flex-1 py-4 rounded-2xl border border-slate-300 dark:border-white/15 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-500"
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
};
