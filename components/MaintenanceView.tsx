
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MaintenanceTicket, TicketStatus, UserSession, UserRole, Property, MaintenanceProgramRecord } from '../types';
import { Icons, BENTO_CARD, METRIC_LABEL } from '../App';
import { generateMaintenanceAdvice } from '../services/geminiService';
import { api } from '../services/apiService';
import { ErrorBanner } from './ErrorBanner';

interface MaintenanceViewProps {
    session: UserSession;
}

// ─── Owner Repair Dashboard ────────────────────────────────────────────────────
const MAINT_CATS = ['PAINTING', 'HVAC', 'ELECTRICAL', 'PLUMBING', 'GENERAL'] as const;

function normalizeApiDate(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v;
    if (Array.isArray(v) && v.length >= 3) {
        const y = v[0];
        const m = v[1];
        const d = v[2];
        return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return '';
}

const FieldHint: React.FC<{ text: string }> = ({ text }) => (
    <span className="inline-flex align-middle ml-1.5 group relative">
        <span className="text-amber-500 cursor-help" tabIndex={0} role="img" aria-label={text}>
            <Icons.Info size={14} />
        </span>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 rounded-xl bg-slate-900 text-white text-[10px] font-semibold leading-snug opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 shadow-xl border border-white/10">
            {text}
        </span>
    </span>
);

const OwnerRepairDashboard: React.FC<{ session: UserSession }> = ({ session }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [allTickets, setAllTickets] = useState<{ ticket: MaintenanceTicket; propertyName: string; unitName: string; tenantName: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);
    const [resolutionText, setResolutionText] = useState<Record<string, string>>({});
    const [resolveCategory, setResolveCategory] = useState<Record<string, string>>({});
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [ownerTab, setOwnerTab] = useState<'tickets' | 'programs'>('tickets');
    const [programs, setPrograms] = useState<MaintenanceProgramRecord[]>([]);
    const [programsLoading, setProgramsLoading] = useState(false);
    const [programsError, setProgramsError] = useState<string | null>(null);
    const [programBusy, setProgramBusy] = useState(false);
    const [programFormOpen, setProgramFormOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<MaintenanceProgramRecord | null>(null);
    const [formScope, setFormScope] = useState<'UNIT' | 'PROPERTY'>('UNIT');
    const [formPropertyId, setFormPropertyId] = useState('');
    const [formUnitId, setFormUnitId] = useState('');
    const [formCategory, setFormCategory] = useState<string>('GENERAL');
    const [formLastService, setFormLastService] = useState('');
    const [formNextDue, setFormNextDue] = useState('');
    const [formNotes, setFormNotes] = useState('');

    const loadTickets = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const props = await api.getProperties();
            setProperties(props);

            const ticketsWithContext: typeof allTickets = [];
            for (const property of props) {
                for (const unit of property.units) {
                    try {
                        const unitTickets = await api.getUnitTickets(unit.id);
                        for (const ticket of unitTickets) {
                            ticketsWithContext.push({
                                ticket,
                                propertyName: property.name,
                                unitName: unit.name,
                                tenantName: unit.tenantName || unit.tenant?.name || 'Unknown Tenant'
                            });
                        }
                    } catch (e) {
                        // Unit may not have tickets
                    }
                }
            }
            // Sort by date descending (newest first)
            ticketsWithContext.sort((a, b) => {
                const da = new Date(a.ticket.createdAt).getTime();
                const db = new Date(b.ticket.createdAt).getTime();
                return db - da;
            });
            setAllTickets(ticketsWithContext);
        } catch (err: unknown) {
            setLoadError(err instanceof Error ? err.message : 'Failed to load maintenance data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    const loadPrograms = useCallback(async () => {
        setProgramsLoading(true);
        setProgramsError(null);
        try {
            const s = await api.getOwnerMaintenanceSummary();
            const raw = s.programs || [];
            setPrograms(
                raw.map((p) => ({
                    ...p,
                    lastServiceAt: normalizeApiDate(p.lastServiceAt as unknown) || undefined,
                    nextDueAt: normalizeApiDate(p.nextDueAt as unknown) || undefined,
                }))
            );
        } catch (err: unknown) {
            setProgramsError(err instanceof Error ? err.message : 'Failed to load preventive programs.');
            setPrograms([]);
        } finally {
            setProgramsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (ownerTab === 'programs') {
            loadPrograms();
        }
    }, [ownerTab, loadPrograms]);

    const openNewProgramForm = () => {
        if (!properties.length) {
            alert('Add a registered asset (property) before creating preventive programs.');
            return;
        }
        setEditingProgram(null);
        setFormScope('UNIT');
        setFormPropertyId(properties[0]?.id || '');
        setFormUnitId(properties[0]?.units[0]?.id || '');
        setFormCategory('GENERAL');
        setFormLastService('');
        setFormNextDue('');
        setFormNotes('');
        setProgramFormOpen(true);
    };

    const openEditProgram = (p: MaintenanceProgramRecord) => {
        setEditingProgram(p);
        setFormScope(p.scope === 'PROPERTY' ? 'PROPERTY' : 'UNIT');
        setFormPropertyId(p.propertyId);
        setFormUnitId(p.unitId || '');
        setFormCategory(p.category);
        setFormLastService(normalizeApiDate(p.lastServiceAt) || '');
        setFormNextDue(normalizeApiDate(p.nextDueAt) || '');
        setFormNotes(p.notes || '');
        setProgramFormOpen(true);
    };

    const closeProgramForm = () => {
        setProgramFormOpen(false);
        setEditingProgram(null);
    };

    const submitProgramForm = async () => {
        if (!formPropertyId) {
            alert('Select an asset (property).');
            return;
        }
        if (formScope === 'UNIT' && !formUnitId) {
            alert('Select a unit for unit-scoped programs.');
            return;
        }
        if (!formLastService) {
            alert('Last service date is required (ISO calendar).');
            return;
        }
        setProgramBusy(true);
        try {
            if (editingProgram) {
                await api.updateMaintenanceProgram(editingProgram.id, {
                    category: formCategory,
                    lastServiceAt: formLastService,
                    nextDueAt: formNextDue || undefined,
                    notes: formNotes || undefined,
                });
            } else {
                await api.createMaintenanceProgram({
                    scope: formScope,
                    propertyId: formPropertyId,
                    unitId: formScope === 'UNIT' ? formUnitId : undefined,
                    category: formCategory,
                    lastServiceAt: formLastService,
                    nextDueAt: formNextDue || undefined,
                    notes: formNotes || undefined,
                });
            }
            closeProgramForm();
            await loadPrograms();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Could not save program.');
        } finally {
            setProgramBusy(false);
        }
    };

    const handleDeleteProgram = async (p: MaintenanceProgramRecord) => {
        if (!window.confirm(`Remove preventive program: ${p.category} for ${p.scope === 'PROPERTY' ? p.propertyName : `${p.propertyName} — ${p.unitName}`}?`)) {
            return;
        }
        try {
            await api.deleteMaintenanceProgram(p.id);
            await loadPrograms();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Delete failed.');
        }
    };

    const unitsForSelectedProperty = useMemo(() => {
        const prop = properties.find((x) => x.id === formPropertyId);
        return prop?.units || [];
    }, [properties, formPropertyId]);

    useEffect(() => {
        if (!programFormOpen || editingProgram) return;
        const u = properties.find((x) => x.id === formPropertyId)?.units || [];
        if (u.length && !u.some((unit) => unit.id === formUnitId)) {
            setFormUnitId(u[0].id);
        }
    }, [programFormOpen, editingProgram, formPropertyId, properties, formUnitId]);

    const handleResolve = async (ticketId: string) => {
        const resolution = resolutionText[ticketId] || 'Resolved by owner';
        const cat = resolveCategory[ticketId];
        setResolving(ticketId);
        try {
            await api.resolveTicket(ticketId, resolution, cat);
            await loadTickets();
            if (ownerTab === 'programs') await loadPrograms();
            setExpandedTicket(null);
        } catch (err) {
            alert('Failed to resolve ticket.');
        } finally {
            setResolving(null);
        }
    };

    const filtered = allTickets.filter(t => {
        if (filterStatus === 'ALL') return true;
        return t.ticket.status === filterStatus;
    });

    const openCount = allTickets.filter(t => t.ticket.status === 'OPEN').length;
    const inProgressCount = allTickets.filter(t => t.ticket.status === 'IN_PROGRESS').length;
    const resolvedCount = allTickets.filter(t => t.ticket.status === 'RESOLVED').length;

    const statusColor = (status: string) => {
        if (status === 'OPEN') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        if (status === 'IN_PROGRESS') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    };

    const severityIcon = (status: string) => {
        if (status === 'OPEN') return <Icons.AlertTriangle size={14} className="text-rose-500" />;
        if (status === 'IN_PROGRESS') return <Icons.Activity size={14} className="text-amber-500" />;
        return <Icons.Check size={14} className="text-emerald-500" />;
    };

    if (isLoading) return (
        <div className="space-y-12 animate-pulse">
            <div className={`${BENTO_CARD} h-32 bg-slate-100 dark:bg-white/5`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${BENTO_CARD} h-48 bg-slate-100 dark:bg-white/5`} />
                <div className={`${BENTO_CARD} h-48 bg-slate-100 dark:bg-white/5`} />
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-reveal">
            {loadError && (
                <ErrorBanner message={loadError} onRetry={loadTickets} />
            )}
            <div className="inline-flex bg-white dark:bg-white/5 p-2 rounded-[2rem] border border-slate-200 dark:border-white/10">
                {(['tickets', 'programs'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setOwnerTab(tab)}
                        className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            ownerTab === tab
                                ? 'bg-amber-400 text-black shadow-lg'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {tab === 'tickets' ? 'Open tickets' : 'Preventive programs'}
                    </button>
                ))}
            </div>

            {ownerTab === 'programs' && (
                <div className="space-y-8 animate-reveal">
                    {programsError && <ErrorBanner message={programsError} onRetry={loadPrograms} />}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <span className={METRIC_LABEL}>Maintenance Operations</span>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
                                Preventive<br /><span className="text-amber-500 not-italic">Programs</span>
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 max-w-2xl leading-relaxed">
                                Manage recurring maintenance schedules. Scope programs to individual units or property-wide systems.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => loadPrograms()}
                                className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center gap-2"
                            >
                                <Icons.RefreshCw size={14} />
                                Refresh registry
                            </button>
                            <button
                                type="button"
                                onClick={openNewProgramForm}
                                className="px-6 py-3.5 rounded-2xl bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 shadow-lg shadow-amber-500/20"
                            >
                                Register program
                            </button>
                        </div>
                    </div>

                    {programsLoading ? (
                        <div className={`${BENTO_CARD} h-40 animate-pulse bg-slate-100 dark:bg-white/5`} />
                    ) : programs.length === 0 ? (
                        <div className={`${BENTO_CARD} p-12 text-center border border-dashed border-slate-300 dark:border-white/15`}>
                            <Icons.Tool className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={40} />
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No preventive programs on file yet.</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Register a program or resolve a ticket with a work category to seed the ledger.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {programs
                                .slice()
                                .sort((a, b) => `${a.propertyName} ${a.unitName || ''}`.localeCompare(`${b.propertyName} ${b.unitName || ''}`))
                                .map((p) => (
                                    <div
                                        key={p.id}
                                        className={`${BENTO_CARD} p-8 border flex flex-col justify-between ${
                                            p.dueWithin30Days
                                                ? 'border-rose-300/60 dark:border-rose-500/30 bg-rose-500/[0.03]'
                                                : 'border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <span
                                                    className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                        p.scope === 'PROPERTY'
                                                            ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25'
                                                            : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                                                    }`}
                                                >
                                                    {p.scope === 'PROPERTY' ? 'Property-wide' : 'Unit-scoped'}
                                                </span>
                                                {p.dueWithin30Days && (
                                                    <span className="text-[8px] font-black uppercase text-rose-600 tracking-widest">Due ≤30d</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{p.propertyName}</p>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white italic mt-1">
                                                {p.scope === 'PROPERTY' ? 'Entire registered asset' : p.unitName || '—'}
                                            </h4>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-3">{p.category}</p>
                                            <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                                <dl className="space-y-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                    <div className="flex justify-between items-center gap-2">
                                                        <dt className="text-slate-400 uppercase text-[9px] tracking-widest flex items-center gap-2">
                                                            <Icons.Calendar size={12} className="text-slate-400" /> Last service
                                                        </dt>
                                                        <dd className="font-black text-slate-700 dark:text-slate-200">{p.lastServiceAt || '—'}</dd>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2">
                                                        <dt className="text-slate-400 uppercase text-[9px] tracking-widest flex items-center gap-2">
                                                            <Icons.Calendar size={12} className={p.dueWithin30Days ? 'text-rose-400' : 'text-slate-400'} /> Next due
                                                        </dt>
                                                        <dd className={`font-black ${p.dueWithin30Days ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>{p.nextDueAt || '—'}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            {p.notes && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 line-clamp-3 border-t border-slate-200 dark:border-white/10 pt-4">
                                                    {p.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => openEditProgram(p)}
                                                className="flex-1 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-widest hover:opacity-90"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProgram(p)}
                                                className="px-4 py-3 rounded-2xl border border-rose-200 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {programFormOpen && (
                        <>
                            <button
                                type="button"
                                className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
                                aria-label="Close dialog"
                                onClick={closeProgramForm}
                            />
                            <div
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[85] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1017] shadow-2xl p-8 md:p-10"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="program-form-title"
                            >
                                <div className="flex items-start justify-between gap-4 mb-8">
                                    <div>
                                        <p className={METRIC_LABEL}>{editingProgram ? 'Update entry' : 'New entry'}</p>
                                        <h3 id="program-form-title" className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 italic">
                                            {editingProgram ? 'Edit preventive program' : 'Register preventive program'}
                                        </h3>
                                    </div>
                                    <button type="button" onClick={closeProgramForm} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
                                        <Icons.X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {!editingProgram && (
                                        <>
                                            <div>
                                                <label className={`${METRIC_LABEL} flex items-center`}>
                                                    Program scope
                                                    <FieldHint text="Unit-scoped tracks one dwelling or suite. Property-wide applies to common systems (façade, roof, shared HVAC plant)." />
                                                </label>
                                                <div className="flex gap-3 mt-2">
                                                    {(['UNIT', 'PROPERTY'] as const).map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => setFormScope(s)}
                                                            className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                                                formScope === s
                                                                    ? 'bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-500/20'
                                                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                                            }`}
                                                        >
                                                            {s === 'UNIT' ? <Icons.Home size={14} /> : <Icons.Globe size={14} />}
                                                            {s === 'UNIT' ? 'Single unit' : 'Whole property'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`${METRIC_LABEL} flex items-center`}>
                                                    Registered asset
                                                    <FieldHint text="Select the property record this program belongs to. Unit list filters to that asset." />
                                                </label>
                                                <select
                                                    value={formPropertyId}
                                                    onChange={(e) => setFormPropertyId(e.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold"
                                                >
                                                    {properties.map((pr) => (
                                                        <option key={pr.id} value={pr.id}>
                                                            {pr.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {formScope === 'UNIT' && (
                                                <div>
                                                    <label className={`${METRIC_LABEL} flex items-center`}>
                                                        Subject unit
                                                        <FieldHint text="The physical unit this maintenance discipline applies to." />
                                                    </label>
                                                    <select
                                                        value={formUnitId}
                                                        onChange={(e) => setFormUnitId(e.target.value)}
                                                        className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold"
                                                    >
                                                        {unitsForSelectedProperty.map((u) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {editingProgram && (
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-300">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Immutable context</p>
                                            <p>
                                                {editingProgram.scope === 'PROPERTY'
                                                    ? `${editingProgram.propertyName} (property-wide)`
                                                    : `${editingProgram.propertyName} — ${editingProgram.unitName}`}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className={`${METRIC_LABEL} flex items-center`}>
                                            Work category
                                            <FieldHint text="Standard trade bucket. Next due defaults from category interval when left blank on create." />
                                        </label>
                                        <select
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value)}
                                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold"
                                        >
                                            {MAINT_CATS.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`${METRIC_LABEL} flex items-center`}>
                                                Last service date
                                                <FieldHint text="Calendar date of the most recent completed service. Required." />
                                            </label>
                                            <div className="relative">
                                                <Icons.Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={formLastService}
                                                    onChange={(e) => setFormLastService(e.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-12 pr-4 py-3 text-sm font-semibold focus:border-amber-400/50 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`${METRIC_LABEL} flex items-center`}>
                                                Next due (optional)
                                                <FieldHint text="Override computed next due. Leave empty to derive from category cadence and last service." />
                                            </label>
                                            <div className="relative">
                                                <Icons.Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={formNextDue}
                                                    onChange={(e) => setFormNextDue(e.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-12 pr-4 py-3 text-sm font-semibold focus:border-amber-400/50 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`${METRIC_LABEL} flex items-center`}>
                                            Field notes
                                            <FieldHint text="Vendor reference, scope of work, or warranty terms — stored verbatim." />
                                        </label>
                                        <textarea
                                            value={formNotes}
                                            onChange={(e) => setFormNotes(e.target.value)}
                                            rows={3}
                                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-10">
                                    <button
                                        type="button"
                                        onClick={closeProgramForm}
                                        className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={programBusy}
                                        onClick={submitProgramForm}
                                        className="flex-1 py-4 rounded-2xl bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 disabled:opacity-50"
                                    >
                                        {programBusy ? 'Saving…' : editingProgram ? 'Save changes' : 'Create program'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {ownerTab === 'tickets' && (
            <>
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Property Operations Center</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
                        Repair<br /><span className="text-amber-500 not-italic">Command</span>
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-rose-500/10 text-rose-500 px-6 py-3 rounded-2xl border border-rose-500/20">
                        <Icons.AlertTriangle size={20} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{openCount} Open Issue{openCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Open', count: openCount, color: 'rose', filter: 'OPEN' },
                    { label: 'In Progress', count: inProgressCount, color: 'amber', filter: 'IN_PROGRESS' },
                    { label: 'Resolved', count: resolvedCount, color: 'emerald', filter: 'RESOLVED' }
                ].map(stat => (
                    <button
                        key={stat.filter}
                        onClick={() => setFilterStatus(filterStatus === stat.filter ? 'ALL' : stat.filter)}
                        className={`${BENTO_CARD} p-6 text-center shadow-sm dark:shadow-none cursor-pointer transition-all ${filterStatus === stat.filter ? `bg-${stat.color}-500/10 border-${stat.color}-500/30` : 'bg-white dark:bg-white/[0.02]'}`}
                    >
                        <p className={`text-4xl font-black tracking-tighter italic text-${stat.color}-500`}>{stat.count}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2">{stat.label}</p>
                    </button>
                ))}
            </div>

            {/* Ticket Cards */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                        {filterStatus === 'ALL' ? 'All Tickets' : filterStatus.replace('_', ' ')}
                    </h3>
                    {filterStatus !== 'ALL' && (
                        <button onClick={() => setFilterStatus('ALL')} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all flex items-center gap-2">
                            <Icons.X size={12} /> Clear Filter
                        </button>
                    )}
                </div>

                {filtered.length === 0 && (
                    <div className="py-20 text-center space-y-6 opacity-20">
                        <Icons.Check className="mx-auto text-emerald-500" size={48} />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-500">
                            {filterStatus === 'ALL' ? 'All Systems Operational. No Tickets Filed.' : `No ${filterStatus.replace('_', ' ')} tickets.`}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map(({ ticket, propertyName, unitName, tenantName }) => {
                        const ticketTint = ticket.status === 'OPEN'
                            ? 'bg-rose-50 border-rose-200'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-200';
                        return (
                        <div key={ticket.id} className={`rounded-[4rem] border p-8 flex flex-col justify-between group shadow-sm transition-all ${ticketTint}`}>
                            {/* Ticket Header */}
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColor(ticket.status)}`}>
                                        <span className="flex items-center gap-2">
                                            {severityIcon(ticket.status)}
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Issue Description */}
                                <p className="text-sm font-bold text-slate-700 dark:text-white leading-relaxed mb-6">
                                    {ticket.issue}
                                </p>

                                {/* Context: Property / Unit / Tenant */}
                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Icons.Home size={12} className="text-amber-500 shrink-0" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{propertyName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Icons.Home size={12} className="text-slate-500 shrink-0" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{unitName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Icons.User size={12} className="text-slate-500 shrink-0" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tenantName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Section */}
                            {ticket.status !== 'RESOLVED' && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    {expandedTicket === ticket.id ? (
                                        <div className="space-y-4 animate-reveal">
                                            <div>
                                                <label className={METRIC_LABEL}>Work category</label>
                                                <select
                                                    value={resolveCategory[ticket.id] || 'GENERAL'}
                                                    onChange={(e) => setResolveCategory((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0d1015] px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
                                                >
                                                    {MAINT_CATS.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <textarea
                                                value={resolutionText[ticket.id] || ''}
                                                onChange={e => setResolutionText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                                placeholder="Describe the resolution (e.g., 'Plumber fixed the leaking pipe joint')"
                                                className="w-full bg-white dark:bg-[#0d1015] border border-slate-300 dark:border-white/10 rounded-2xl p-4 text-sm font-medium text-slate-900 dark:text-white focus:border-amber-400 outline-none transition-all placeholder:text-slate-600 min-h-[80px]"
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleResolve(ticket.id)}
                                                    disabled={resolving === ticket.id}
                                                    className="flex-1 py-3 bg-emerald-500 text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {resolving === ticket.id
                                                        ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                        : <Icons.Check size={14} />}
                                                    Confirm Resolution
                                                </button>
                                                <button
                                                    onClick={() => setExpandedTicket(null)}
                                                    className="py-3 px-6 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setExpandedTicket(ticket.id)}
                                            className="w-full py-4 bg-amber-400 text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-amber-500/20"
                                        >
                                            <Icons.Check size={14} /> Mark as Resolved
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Show resolution for resolved tickets */}
                            {ticket.status === 'RESOLVED' && (
                                <div className="mt-6 pt-6 border-t border-emerald-200">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <Icons.ShieldCheck size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Issue Resolved</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>
            </>
            )}
        </div>
    );
};

// ─── Tenant Repair View ─────────────────────────────────────────────
const TenantRepairView: React.FC<{ session: UserSession }> = ({ session }) => {
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [issue, setIssue] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [tenantLoadError, setTenantLoadError] = useState<string | null>(null);

    const loadTickets = useCallback(async () => {
        setIsLoading(true);
        setTenantLoadError(null);
        try {
            const data = await api.getMyTickets();
            setTickets(data);
        } catch (err: unknown) {
            setTenantLoadError(err instanceof Error ? err.message : 'Failed to load tickets.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    const handleAnalyze = async () => {
        if (!issue.trim()) return;
        setIsAnalyzing(true);
        try {
            const advice = await generateMaintenanceAdvice(issue);
            setAiAnalysis(advice);
        } catch (err) {
            setAiAnalysis("AI Diagnostic Engine unavailable. Proceeding with manual ticket creation.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        if (!issue.trim()) return;
        setIsSubmitting(true);
        try {
            await api.createTicket({ issue });
            setIssue('');
            setAiAnalysis(null);
            await loadTickets();
        } catch (err) {
            alert('Failed to report incident. Satellite link unstable.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format AI analysis with markdown-like rendering
    const renderAnalysis = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('🔍') || line.startsWith('📋') || line.startsWith('📊')) {
                return <h4 key={i} className="text-base font-black text-white uppercase tracking-wide mt-2 mb-1">{line.replace(/\*\*/g, '')}</h4>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="text-sm font-black text-amber-400 uppercase tracking-wide mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('💰') || line.startsWith('⏰')) {
                return <p key={i} className="text-xs font-bold text-emerald-400 mt-2">{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('---')) {
                return <hr key={i} className="border-white/10 my-3" />;
            }
            if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.')) {
                return <p key={i} className="text-sm text-slate-300 leading-relaxed font-medium ml-2 my-1.5">{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('*')) {
                return <p key={i} className="text-xs text-slate-500 italic mt-2">{line.replace(/\*/g, '')}</p>;
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-sm text-slate-400 leading-relaxed font-medium my-1">{line.replace(/\*\*/g, '')}</p>;
        });
    };

    return (
        <div className="space-y-12 animate-reveal">
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Real-Time Diagnostics</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
                        Repair<br /><span className="text-amber-500 not-italic">Hub</span>
                    </h2>
                </div>
                <div className="flex items-center gap-4 bg-amber-400/10 text-amber-500 px-6 py-3 rounded-2xl border border-amber-400/20">
                    <Icons.Activity size={20} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Tenant service queue</span>
                </div>
            </div>

            {tenantLoadError && (
                <ErrorBanner message={tenantLoadError} onRetry={loadTickets} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12">
                {/* Ticket Creation Area */}
                <div className="lg:col-span-12">
                    <div className={`${BENTO_CARD} p-12 bg-orange-50 dark:bg-white/[0.02] shadow-sm dark:shadow-none border border-orange-100 dark:border-transparent`}>
                        <div className="max-w-4xl">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">What needs attention?</h3>
                            <div className="relative group">
                                <textarea
                                    value={issue}
                                    onChange={(e) => setIssue(e.target.value)}
                                    placeholder="Describe the issue (e.g., 'The kitchen sink is leaking from the pipe junction')"
                                    className="w-full bg-slate-50 dark:bg-[#0d1015] border-2 border-slate-300 dark:border-white/5 rounded-[2.5rem] p-10 text-lg font-medium text-slate-900 dark:text-white focus:border-amber-400 outline-none transition-all placeholder:text-slate-600 min-h-[200px]"
                                />
                                <div className="absolute bottom-8 right-8 flex gap-4">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !issue.trim()}
                                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50"
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'AI Diagnose'}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!issue.trim() || isSubmitting}
                                        className="px-10 py-3 bg-amber-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Opening...' : 'Open Ticket'}
                                    </button>
                                </div>
                            </div>

                            {aiAnalysis && (
                                <div className="mt-8 p-10 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] animate-reveal">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                            <Icons.Activity size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">AI Diagnostic Report</h4>
                                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Powered by RentSafe Intelligence Engine</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {renderAnalysis(aiAnalysis)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* History Area */}
                <div className="lg:col-span-12 mt-12 space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Recent Activities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center animate-pulse">
                                <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading your history...</p>
                            </div>
                        ) : (
                            <>
                                {tickets.map(ticket => (
                                    <div key={ticket.id} className={`${BENTO_CARD} p-8 flex flex-col justify-between group bg-white dark:bg-transparent shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5 hover:bg-amber-50 dark:hover:bg-white/5`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{ticket.createdAt}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all cursor-default">
                                                {ticket.issue}
                                            </p>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-300 dark:border-white/10">
                                                    <Icons.User size={14} className="text-slate-500" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assignee Pending</span>
                                            </div>
                                            <Icons.ChevronLeft className="text-slate-700 rotate-180" size={18} />
                                        </div>
                                    </div>
                                ))}
                                {tickets.length === 0 && (
                                    <div className="col-span-full py-20 text-center space-y-6 opacity-20">
                                        <Icons.Tool className="mx-auto text-slate-500" size={48} />
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-500">Perfect Condition. No Active Issues.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Export: Switches between Owner and Tenant views ──────────────────────
export const MaintenanceView: React.FC<MaintenanceViewProps> = (props) => {
    if (props.session.role === UserRole.OWNER) {
        return <OwnerRepairDashboard session={props.session} />;
    }
    return <TenantRepairView {...props} />;
};
