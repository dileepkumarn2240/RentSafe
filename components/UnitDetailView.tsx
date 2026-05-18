import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BENTO_CARD, METRIC_LABEL, Icons } from '../App';
import { api } from '../services/apiService';
import { Bill, MaintenanceTicket, Unit } from '../types';
import { ErrorBanner } from './ErrorBanner';

export const UnitDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const [tab, setTab] = useState<'OVERVIEW' | 'INSPECTIONS' | 'INVENTORY' | 'MAINTENANCE' | 'BILLING' | 'RENT_LEDGER' | 'DOCUMENTS'>('OVERVIEW');
  const [unit, setUnit] = useState<Unit | null>(null);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    setError(null);
    try {
      const [u, t, b, d] = await Promise.all([
        api.getUnitForOwner(unitId),
        api.getUnitTickets(unitId),
        api.getUnitBills(unitId),
        api.getUnitDocuments(unitId),
      ]);
      setUnit(u);
      setTickets(t);
      setBills(b);
      setDocs(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load unit');
      setUnit(null);
      setTickets([]);
      setBills([]);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => { load(); }, [load]);

  const openTickets = useMemo(() => tickets.filter(t => t.status !== 'RESOLVED'), [tickets]);
  const pendingBills = useMemo(() => bills.filter(b => b.status !== 'PAID' && b.type !== 'RENT'), [bills]);
  const utilityBills = useMemo(() => bills.filter(b => b.type !== 'RENT'), [bills]);
  const rentBills = useMemo(() => bills.filter(b => b.type === 'RENT'), [bills]);

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
          <span className={METRIC_LABEL}>Unit</span>
          <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic truncate">
            {unit?.name || 'Unit'}<br /><span className="text-amber-500 not-italic">Workspace</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">ID: {unitId}</p>
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
            onClick={() => navigate(-1)}
            className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-3"
          >
            <Icons.ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className={`${BENTO_CARD} p-6 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'INSPECTIONS', label: 'Inspections' },
            { id: 'INVENTORY', label: 'Inventory' },
            { id: 'MAINTENANCE', label: `Maintenance (${openTickets.length})` },
            { id: 'BILLING', label: `Utilities (${pendingBills.length})` },
            { id: 'RENT_LEDGER', label: `Rent History (${rentBills.length})` },
            { id: 'DOCUMENTS', label: `Documents (${docs.length})` },
          ] as const).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                tab === t.id
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className={`${BENTO_CARD} md:col-span-7 p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-8`}>
            <div>
              <span className={METRIC_LABEL}>Lease & status</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Current standing</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className={METRIC_LABEL}>Occupancy</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{unit?.status}</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className={METRIC_LABEL}>Rent status</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{unit?.rentStatus || '-'}</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className={METRIC_LABEL}>Deposit</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">₹{(unit?.deposit ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className={METRIC_LABEL}>Rent / lease</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {unit?.agreementType === 'LEASE'
                    ? `₹${(unit?.leaseAmount ?? 0).toLocaleString()} (lease)`
                    : `₹${(unit?.rent ?? 0).toLocaleString()} / month`}
                </p>
              </div>
            </div>
          </div>

          <div className={`${BENTO_CARD} md:col-span-5 p-12 bg-amber-50 dark:bg-white/[0.02] border border-amber-100 dark:border-white/10 space-y-8`}>
            <div>
              <span className={METRIC_LABEL}>Exceptions</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Needs attention</h3>
            </div>
            <div className="space-y-4">
              {openTickets.length > 0 ? (
                <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Open maintenance</p>
                  <p className="text-xl font-black text-rose-700">{openTickets.length} ticket(s)</p>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Maintenance</p>
                  <p className="text-xl font-black text-emerald-700">No open tickets</p>
                </div>
              )}
              {pendingBills.length > 0 ? (
                <div className="p-6 rounded-3xl bg-amber-400/10 border border-amber-400/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Bills due</p>
                  <p className="text-xl font-black text-amber-800">{pendingBills.length} pending</p>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bills</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">No pending bills</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'MAINTENANCE' && (
        <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={METRIC_LABEL}>Maintenance</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tickets</h3>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {tickets.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No tickets for this unit.</p>
            ) : (
              tickets
                .slice()
                .sort((a, b) => (a.status === b.status ? (b.createdAt || '').localeCompare(a.createdAt || '') : (a.status === 'OPEN' ? -1 : 1)))
                .map(t => (
                  <div key={t.id} className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.status}</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">{t.issue}</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {tab === 'BILLING' && (
        <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <div>
            <span className={METRIC_LABEL}>Utilities</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Utility Bills</h3>
          </div>
          <div className="mt-8 space-y-4">
            {utilityBills.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No utility bills for this unit.</p>
            ) : (
              utilityBills
                .slice()
                .sort((a, b) => (a.status === b.status ? a.dueDate.localeCompare(b.dueDate) : (a.status === 'PAID' ? 1 : -1)))
                .map(b => (
                  <div key={b.id} className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <div className="flex justify-between items-start gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{b.type}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{b.amount}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Due {b.dueDate}</p>
                        {b.paymentReference && <p className="text-xs text-slate-500 mt-1">Ref: {b.paymentReference}</p>}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${
                        b.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>{b.status}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {tab === 'RENT_LEDGER' && (
        <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <div>
            <span className={METRIC_LABEL}>Revenue</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Rent History</h3>
          </div>
          <div className="mt-8 space-y-4">
            {rentBills.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No rent history found.</p>
            ) : (
              rentBills
                .slice()
                .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                .map(b => (
                  <div key={b.id} className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <div className="flex justify-between items-start gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{b.billingPeriod}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{b.amount}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {b.status === 'PAID' && b.paidDate ? `Paid on ${b.paidDate}` : `Due on ${b.dueDate}`}
                        </p>
                        {b.paymentReference && <p className="text-xs text-slate-500 mt-1">Ref: {b.paymentReference}</p>}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${
                        b.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>{b.status}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {tab === 'DOCUMENTS' && (
        <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <div>
            <span className={METRIC_LABEL}>Documents</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Unit vault</h3>
          </div>
          <div className="mt-8 space-y-4">
            {docs.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No documents for this unit.</p>
            ) : (
              docs.map((d: any) => (
                <div key={d.id || `${d.name}-${Math.random()}`} className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.name || 'Document'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.type || d.docType || 'FILE'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'INSPECTIONS' && (
        <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <span className={METRIC_LABEL}>Inspections</span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Move-in / move-out</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mt-6">
            Inspection workflows will be implemented in `nav-tenant-myunit-inspection` (and expanded here for owners).
          </p>
        </div>
      )}

      {tab === 'INVENTORY' && (
        <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <span className={METRIC_LABEL}>Inventory</span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Assets & condition</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mt-6">
            Inventory will be derived from move-in/move-out inspection line items (fans, kitchen, furnishing, paint, etc.).
          </p>
        </div>
      )}

      {tab === 'MAINTENANCE' && (
        <div className={`${BENTO_CARD} p-10 bg-amber-400/10 border border-amber-400/20 rounded-[3rem]`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Upcoming</p>
          <p className="text-sm text-amber-800 font-semibold mt-2">
            Next: add owner-only “systems schedule” (HVAC/plumbing/paint) under this tab using unit-specific schedules.
          </p>
        </div>
      )}
    </div>
  );
};

