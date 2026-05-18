import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BENTO_CARD, METRIC_LABEL, Icons } from '../App';
import { api } from '../services/apiService';
import { PropertySummary, UnitStatusSummary } from '../types';
import { ErrorBanner } from './ErrorBanner';

export const PropertyDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [data, setData] = useState<PropertySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterOccupancy, setFilterOccupancy] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');
  const [filterRent, setFilterRent] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [filterTickets, setFilterTickets] = useState<'ALL' | 'HAS_OPEN'>('ALL');
  const [filterRenewal, setFilterRenewal] = useState<'ALL' | 'DUE_SOON'>('ALL');

  const [sort, setSort] = useState<'UNIT_NAME' | 'PENDING_FIRST' | 'MOST_TICKETS' | 'RENEWAL_SOON'>('PENDING_FIRST');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPropertySummary(propertyId, 30);
      setData(res);
      setPage(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load property');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const filteredSorted = useMemo(() => {
    const units = data?.units ?? [];
    const filtered = units.filter(u => {
      if (filterOccupancy !== 'ALL' && u.occupancyStatus !== filterOccupancy) return false;
      if (filterRent !== 'ALL' && (u.rentStatus || 'PENDING') !== filterRent) return false;
      if (filterTickets === 'HAS_OPEN' && u.openTicketsCount <= 0) return false;
      if (filterRenewal === 'DUE_SOON' && u.renewalsDueSoon !== 1) return false;
      return true;
    });

    const byName = (a: UnitStatusSummary, b: UnitStatusSummary) => a.unitName.localeCompare(b.unitName);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'UNIT_NAME') return byName(a, b);
      if (sort === 'MOST_TICKETS') return (b.openTicketsCount - a.openTicketsCount) || byName(a, b);
      if (sort === 'RENEWAL_SOON') return (b.renewalsDueSoon - a.renewalsDueSoon) || byName(a, b);
      // PENDING_FIRST: pending rent first, then name
      const rank = (x: UnitStatusSummary) => (x.rentStatus === 'PENDING' ? 0 : 1);
      return (rank(a) - rank(b)) || byName(a, b);
    });

    return sorted;
  }, [data, filterOccupancy, filterRent, filterTickets, filterRenewal, sort]);

  const paged = useMemo(() => {
    const start = page * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page]);

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className={`${BENTO_CARD} h-40 bg-slate-100 dark:bg-white/5`} />
        <div className={`${BENTO_CARD} h-[60vh] bg-slate-100 dark:bg-white/5`} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-reveal">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <span className={METRIC_LABEL}>Property</span>
          <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic truncate">
            {data?.name || 'Home'}<br /><span className="text-amber-500 not-italic">Status</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{data?.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={load}
            className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-3"
          >
            <Icons.ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {data && (
        <div className={`${BENTO_CARD} p-10 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {[
              { label: 'Units', value: data.totalUnits },
              { label: 'Occupied', value: data.occupiedUnits },
              { label: 'Vacant', value: data.vacantUnits },
              { label: 'Pending rent', value: data.pendingRentCount },
              { label: 'Open tickets', value: data.openTicketsCount },
              { label: 'Renewals soon', value: data.renewalsDueSoonCount },
            ].map((kpi) => (
              <div key={kpi.label} className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className={METRIC_LABEL}>{kpi.label}</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            <div>
              <label className={METRIC_LABEL}>Occupancy</label>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
                value={filterOccupancy} onChange={(e) => { setFilterOccupancy(e.target.value as any); setPage(0); }}>
                <option value="ALL">All</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="VACANT">Vacant</option>
              </select>
            </div>
            <div>
              <label className={METRIC_LABEL}>Rent</label>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
                value={filterRent} onChange={(e) => { setFilterRent(e.target.value as any); setPage(0); }}>
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className={METRIC_LABEL}>Tickets</label>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
                value={filterTickets} onChange={(e) => { setFilterTickets(e.target.value as any); setPage(0); }}>
                <option value="ALL">All</option>
                <option value="HAS_OPEN">Has open</option>
              </select>
            </div>
            <div>
              <label className={METRIC_LABEL}>Sort</label>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
                value={sort} onChange={(e) => { setSort(e.target.value as any); }}>
                <option value="PENDING_FIRST">Pending rent first</option>
                <option value="MOST_TICKETS">Most tickets</option>
                <option value="RENEWAL_SOON">Renewals soon</option>
                <option value="UNIT_NAME">Unit name</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setFilterRenewal(filterRenewal === 'DUE_SOON' ? 'ALL' : 'DUE_SOON'); setPage(0); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                filterRenewal === 'DUE_SOON'
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              Renewals due soon
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
              Showing {filteredSorted.length} of {data.totalUnits}
            </p>
          </div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paged.map((u) => {
            const pending = u.rentStatus === 'PENDING';
            const hasTickets = u.openTicketsCount > 0;
            const renewalSoon = u.renewalsDueSoon === 1;
            return (
              <button
                key={u.unitId}
                type="button"
                onClick={() => navigate(`/owner/units/${u.unitId}`)}
                className={`${BENTO_CARD} p-10 text-left bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className={METRIC_LABEL}>Unit</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">{u.unitName}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-500">
                      {u.occupancyStatus}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 border ${
                    pending ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    <Icons.CreditCard size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-8">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rent</p>
                    <p className={`text-sm font-black mt-1 ${pending ? 'text-rose-600' : 'text-emerald-600'}`}>{u.rentStatus || '-'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bills due</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{u.billsDueCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tickets</p>
                    <p className={`text-sm font-black mt-1 ${hasTickets ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{u.openTicketsCount}</p>
                  </div>
                </div>

                {renewalSoon && (
                  <div className="mt-6 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-3">
                    <Icons.Clock size={16} className="text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Renewal due soon</p>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Open unit</p>
                  <Icons.ChevronRight size={18} className="text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {data && filteredSorted.length > pageSize && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest disabled:opacity-30"
          >
            Prev
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">Page {page + 1} / {Math.ceil(filteredSorted.length / pageSize)}</p>
          <button
            type="button"
            disabled={(page + 1) * pageSize >= filteredSorted.length}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

