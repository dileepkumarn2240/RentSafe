import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FinanceMetrics,
  PortfolioSummary,
  RenewalRowDTO,
  UnitRevenueDTO,
} from '../types';
import { api } from '../services/apiService';
import { BENTO_CARD, METRIC_LABEL, Icons } from '../App';
import { ErrorBanner } from './ErrorBanner';
import { CollectionsHub } from './OwnerDashboard';
import { SecurityWall } from './owner/SecurityWall';
import { ExecutiveFinancialViz } from './owner/ExecutiveFinancialViz';
import { CommandCenterFilterDrawer, useCommandCenterFilters } from './owner/CommandCenterFilterDrawer';

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function hasUnpaidBill(row: UnitRevenueDTO): boolean {
  return ['MAINTENANCE', 'ELECTRICITY', 'WATER', 'INTERNET', 'GAS'].some((bt) => {
    const s = row.billStatuses[bt];
    return s === 'PENDING' || s === 'OVERDUE';
  });
}

export const OwnerOverview: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [unitRevenues, setUnitRevenues] = useState<UnitRevenueDTO[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [renewals, setRenewals] = useState<RenewalRowDTO[]>([]);
  const [historicalRevenue, setHistoricalRevenue] = useState<Record<string, number>>({});
  const [expenseBreakdown, setExpenseBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { filters, setFilters, reset: resetFilters } = useCommandCenterFilters();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, u, p, r, trends, expenses] = await Promise.all([
        api.getFinanceMetrics(),
        api.getFinanceUnits(),
        api.getPortfolioSummary(30).catch(() => null),
        api.getFinanceRenewals(90).catch(() => [] as RenewalRowDTO[]),
        api.getFinanceTrends().catch(() => ({ historicalRevenue: {}, monthlyTrends: [] })),
        api.getFinanceExpenseBreakdown().catch(() => ({})),
      ]);
      setMetrics(m);
      setUnitRevenues(Array.isArray(u) ? u : []);
      setPortfolio(p);
      setRenewals(Array.isArray(r) ? r : []);
      setHistoricalRevenue((trends as { historicalRevenue?: Record<string, number> }).historicalRevenue || {});
      setExpenseBreakdown(expenses as Record<string, number>);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load overview');
      setMetrics(null);
      setUnitRevenues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMarkPaid = useCallback(async (unitId: string, billType: string) => {
    setMarkPaidError(null);
    try {
      await api.markBillPaid(unitId, billType);
      const [m, u, trends, expenses] = await Promise.all([
        api.getFinanceMetrics(),
        api.getFinanceUnits(),
        api.getFinanceTrends(),
        api.getFinanceExpenseBreakdown(),
      ]);
      setMetrics(m);
      setUnitRevenues(Array.isArray(u) ? u : []);
      setHistoricalRevenue(trends.historicalRevenue || {});
      setExpenseBreakdown(expenses);
    } catch (e: unknown) {
      setMarkPaidError(e instanceof Error ? e.message : 'Could not mark paid');
    }
  }, []);

  const filteredUnitRows = useMemo(() => {
    return unitRevenues.filter((row) => {
      if (filters.excludeVacant && row.rentStatus === 'VACANT') return false;
      if (filters.leaseAgreementsOnly && row.agreementType !== 'LEASE') return false;
      if (filters.pendingRentOnly) {
        if (row.agreementType === 'LEASE') return false;
        if (row.rentStatus !== 'PENDING') return false;
      }
      if (filters.unpaidChargesOnly && !hasUnpaidBill(row)) return false;
      return true;
    });
  }, [unitRevenues, filters]);

  const rentRollup = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let vacant = 0;
    for (const row of unitRevenues) {
      if (row.rentStatus === 'VACANT' || row.agreementType === 'LEASE') {
        if (row.rentStatus === 'VACANT') vacant += 1;
        continue;
      }
      if (row.rentStatus === 'PAID') paid += 1;
      else pending += 1;
    }
    return { pending, paid, vacant };
  }, [unitRevenues]);

  const projections = useMemo(() => {
    const gross = num(metrics?.expectedMonthlyRent);
    const net = gross - num(metrics?.outstandingUtilityBills);
    const flatFiveYearNet = net * 12 * 5;
    let compoundGrossTotal = 0;
    for (let y = 0; y < 5; y += 1) {
      compoundGrossTotal += gross * 12 * Math.pow(1.05, y);
    }
    return { flatFiveYearNet, compoundGrossTotal };
  }, [metrics]);

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className={`${BENTO_CARD} h-40 bg-slate-100 dark:bg-white/5`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`${BENTO_CARD} h-64 bg-slate-100 dark:bg-white/5`} />
          <div className={`${BENTO_CARD} h-64 bg-slate-100 dark:bg-white/5`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-14 animate-reveal">
      <CommandCenterFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {collectionsOpen && (
        <CollectionsHub
          unitRevenues={unitRevenues}
          onClose={() => setCollectionsOpen(false)}
          onMarkPaid={handleMarkPaid}
        />
      )}

      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6">
        <div>
          <span className={METRIC_LABEL}>Enterprise Overview</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
            Overview<br /><span className="text-amber-500 not-italic">Dashboard</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.25em] mt-4 max-w-xl leading-relaxed">
            Portfolio revenue intelligence, receivables posture, and surveillance capacity — enterprise naming aligned to property operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-amber-500 hover:border-amber-400/50 shadow-sm transition-all group"
            aria-expanded={filterDrawerOpen}
            title="Filter Insights"
          >
            <Icons.SlidersHorizontal size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-slate-800 dark:text-white hover:bg-amber-400 hover:text-black hover:border-amber-300 transition-all"
          >
            Property registry
          </button>
          <button
            type="button"
            onClick={() => setCollectionsOpen(true)}
            className="px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 dark:hover:bg-amber-400 transition-all"
          >
            Collections workspace
          </button>
          <button
            type="button"
            onClick={refresh}
            className="px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all inline-flex items-center gap-2"
          >
            <Icons.RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={refresh} />}
      {markPaidError && (
        <ErrorBanner message={markPaidError} onRetry={() => setMarkPaidError(null)} retryLabel="Dismiss" />
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className={`${BENTO_CARD} p-8 bg-gradient-to-br from-indigo-50/80 to-white dark:from-[#0f1419]/80 dark:to-transparent border border-indigo-100 dark:border-white/10 overflow-hidden relative group shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.15] group-hover:scale-110 group-hover:opacity-30 transition-all duration-700">
              <Icons.Target size={80} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-white/10 flex items-center justify-center mb-6 shadow-sm">
                <Icons.Target className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <p className={METRIC_LABEL}>Expected revenue</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 mb-6 italic">Total Rent</h3>
              <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                ₹{num(metrics.expectedMonthlyRent).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className={`${BENTO_CARD} p-8 bg-gradient-to-br from-emerald-50/80 to-white dark:from-[#0f1419]/80 dark:to-transparent border border-emerald-100 dark:border-white/10 overflow-hidden relative group shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.15] group-hover:scale-110 group-hover:opacity-30 transition-all duration-700">
              <Icons.CheckCircle size={80} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-white/10 flex items-center justify-center mb-6 shadow-sm">
                <Icons.CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <p className={METRIC_LABEL}>Successfully settled</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 mb-6 italic">Collected Rent</h3>
              <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                ₹{num(metrics.successfullyCollected).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className={`${BENTO_CARD} p-8 bg-gradient-to-br from-rose-50/80 to-white dark:from-[#0f1419]/80 dark:to-transparent border border-rose-100 dark:border-white/10 overflow-hidden relative group shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.15] group-hover:scale-110 group-hover:opacity-30 transition-all duration-700">
              <Icons.AlertCircle size={80} className="text-rose-500 dark:text-rose-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-white/10 flex items-center justify-center mb-6 shadow-sm">
                <Icons.AlertCircle className="text-rose-600 dark:text-rose-400" size={24} />
              </div>
              <p className={METRIC_LABEL}>Action required</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 mb-6 italic">Pending Rent</h3>
              <p className="text-5xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">
                ₹{num(metrics.unpaidRent).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className={`${BENTO_CARD} p-8 bg-gradient-to-br from-amber-50/80 to-white dark:from-[#0f1419]/80 dark:to-transparent border border-amber-100 dark:border-white/10 overflow-hidden relative group shadow-sm transition-all hover:shadow-lg dark:hover:border-white/15`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.15] group-hover:scale-110 group-hover:opacity-30 transition-all duration-700">
              <Icons.Zap size={80} className="text-amber-500 dark:text-amber-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-white/10 flex items-center justify-center mb-6 shadow-sm">
                <Icons.Zap className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <p className={METRIC_LABEL}>Variable exposure</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 mb-6 italic">Outstanding Utility Bills</h3>
              <p className="text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">
                ₹{num(metrics.outstandingUtilityBills).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {metrics && (
        <div className={`${BENTO_CARD} p-6 md:p-10 border border-slate-200 dark:border-white/10`}>
          <p className={METRIC_LABEL}>Visual analytics</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-2 mb-8 italic">
            Cash flow & capacity
          </h3>
          <ExecutiveFinancialViz
            portfolio={portfolio}
            historicalRevenue={historicalRevenue}
            expenseBreakdown={expenseBreakdown}
            unitRevenues={unitRevenues}
          />
        </div>
      )}

      {portfolio && (
        <div className={`${BENTO_CARD} p-6 md:p-10 border border-slate-200 dark:border-white/10`}>
          <p className={METRIC_LABEL}>Portfolio composition & capacity</p>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-2 mb-6 italic">
            Asset counts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Properties', value: portfolio.propertiesCount },
              { label: 'Units', value: portfolio.totalUnits },
              { label: 'Occupied', value: portfolio.occupiedUnits },
              { label: 'Vacant', value: portfolio.vacantUnits },
              { label: 'AR — pending units', value: portfolio.pendingRentCount },
              { label: 'Open tickets', value: portfolio.openTicketsCount },
            ].map((k) => (
              <div
                key={k.label}
                className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-white dark:from-white/[0.04] dark:to-transparent border border-slate-200 dark:border-white/10 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{k.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tighter">{k.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${BENTO_CARD} p-6 md:p-10 border border-slate-200 dark:border-white/10`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className={METRIC_LABEL}>Accounts receivable by unit</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 italic">
              Rent & charge status
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
              Showing {filteredUnitRows.length} of {unitRevenues.length} rows · use Filters to narrow
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
              Pending {rentRollup.pending}
            </span>
            <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              Paid {rentRollup.paid}
            </span>
            <span className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
              Vacant {rentRollup.vacant}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                <th className="p-4">Property</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Rent</th>
                <th className="p-4">Maint.</th>
                <th className="p-4">Electric</th>
                <th className="p-4">Water</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnitRows.map((row) => (
                <tr key={row.unitId} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03]">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{row.propertyName}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      className="font-black text-amber-600 dark:text-amber-400 hover:underline uppercase text-xs tracking-tight"
                      onClick={() => navigate(`/owner/units/${row.unitId}`)}
                    >
                      {row.unitName}
                    </button>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-black uppercase ${row.rentStatus === 'PAID' ? 'text-emerald-500' : row.rentStatus === 'VACANT' ? 'text-slate-400' : 'text-rose-500'}`}
                    >
                      {row.agreementType === 'LEASE' ? 'LEASE' : row.rentStatus}
                    </span>
                    {row.agreementType !== 'LEASE' && row.rentStatus === 'PENDING' && (
                      <button
                        type="button"
                        className="ml-2 text-[9px] font-black uppercase text-emerald-600 hover:underline"
                        onClick={() => handleMarkPaid(row.unitId, 'RENT')}
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                  {(['MAINTENANCE', 'ELECTRICITY', 'WATER'] as const).map((bt) => {
                    const st = row.billStatuses[bt] || 'NONE';
                    return (
                      <td key={bt} className="p-4">
                        <span
                          className={`text-[10px] font-black uppercase ${st === 'PAID' ? 'text-emerald-500' : st === 'NONE' ? 'text-slate-400' : 'text-rose-500'}`}
                        >
                          {st}
                        </span>
                        {st === 'PENDING' && (
                          <button
                            type="button"
                            className="ml-2 text-[9px] font-black uppercase text-emerald-600 hover:underline"
                            onClick={() => handleMarkPaid(row.unitId, bt)}
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/units/${row.unitId}`)}
                      className="text-[9px] font-black uppercase text-slate-500 hover:text-amber-500"
                    >
                      Ledger →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${BENTO_CARD} p-6 md:p-10 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10`}>
        <div className="flex items-start gap-4">
          <Icons.Info className="text-amber-600 shrink-0 mt-1" size={22} />
          <div>
            <p className={METRIC_LABEL}>Forward scenarios (non-GAAP)</p>
            <p className="text-[10px] text-amber-900/80 dark:text-amber-200/90 font-bold uppercase tracking-widest leading-relaxed mt-2">
              Planning illustrations only. Flat path applies current model net × 60 months. Growth path sums annual gross with +5% year-over-year escalation (constant occupancy assumption).
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 rounded-3xl bg-white dark:bg-black/30 border border-amber-500/20">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Flat net (5 yr)</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 italic">
                  ₹{projections.flatFiveYearNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-black/30 border border-amber-500/20">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">+5% YoY gross (5 yr sum)</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 italic">
                  ₹{projections.compoundGrossTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${BENTO_CARD} p-6 md:p-10 border border-slate-200 dark:border-white/10`}>
        <p className={METRIC_LABEL}>Contract milestones (90 days)</p>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-2 mb-4 italic">
          Lease end & rent due
        </h3>
        {renewals.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">No lease ends or rent due dates in this window.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <th className="p-3">Property</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((rw) => (
                  <tr key={`${rw.unitId}-${rw.kind}-${rw.dueDate}`} className="border-t border-slate-100 dark:border-white/5">
                    <td className="p-3">{rw.propertyName}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="font-bold text-amber-600 hover:underline"
                        onClick={() => navigate(`/owner/units/${rw.unitId}`)}
                      >
                        {rw.unitName}
                      </button>
                    </td>
                    <td className="p-3 text-[10px] font-black uppercase text-slate-500">{rw.kind.replace('_', ' ')}</td>
                    <td className="p-3">{rw.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`${BENTO_CARD} p-6 md:p-10 border border-slate-200 dark:border-white/10`}>
        <p className={METRIC_LABEL}>Physical security capacity</p>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-2 mb-6 italic">
          CCTV channel layout
        </h3>
        <SecurityWall />
      </div>
    </div>
  );
};
