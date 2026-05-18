
import React from 'react';
import { AppNotification, Bill, MaintenanceTicket, Unit } from '../types';
import { api, ApiError } from '../services/apiService';
import { Icons, BENTO_CARD, METRIC_LABEL, PulseIndicator } from '../App';
import { ErrorBanner } from './ErrorBanner';

interface TenantDashboardProps {
    onNavigate: (tab: string) => void;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({ onNavigate }) => {
    const [unit, setUnit] = React.useState<Unit | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [noUnit, setNoUnit] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [bills, setBills] = React.useState<Bill[]>([]);
    const [tickets, setTickets] = React.useState<MaintenanceTicket[]>([]);
    const [notifications, setNotifications] = React.useState<AppNotification[]>([]);

    const loadUnit = React.useCallback(() => {
        setIsLoading(true);
        setLoadError(null);
        setNoUnit(false);
        api.getMyUnit()
            .then(data => {
                setUnit(data);
            })
            .catch(err => {
                setUnit(null);
                if (err instanceof ApiError && err.code === 'NO_UNIT') {
                    setNoUnit(true);
                } else {
                    setLoadError(err instanceof Error ? err.message : 'Could not load your unit.');
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    React.useEffect(() => {
        loadUnit();
    }, [loadUnit]);

    const loadTenantData = React.useCallback(async () => {
        try {
            const [b, t, n] = await Promise.all([
                api.getMyBills().catch(() => [] as Bill[]),
                api.getMyTickets().catch(() => [] as MaintenanceTicket[]),
                api.getNotifications().catch(() => [] as AppNotification[]),
            ]);
            setBills(b);
            setTickets(t);
            setNotifications(n);
        } catch {
            // Non-blocking; overview still usable without these.
        }
    }, []);

    React.useEffect(() => {
        if (unit) loadTenantData();
    }, [unit, loadTenantData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                    <Icons.Home className="text-slate-300 dark:text-slate-600" size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest text-center">Loading your<br />home</h3>
            </div>
        );
    }
    if (loadError) {
        return (
            <div className="max-w-xl mx-auto space-y-6 pt-8">
                <ErrorBanner message={loadError} onRetry={loadUnit} />
            </div>
        );
    }
    if (noUnit || !unit) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 max-w-lg mx-auto text-center px-4">
                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <Icons.Home className="text-slate-300 dark:text-slate-600" size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">No unit assigned yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Your landlord has not linked you to a unit in RentSafe. Ask them to complete onboarding for your address, then use Refresh below.
                </p>
                <button
                    type="button"
                    onClick={loadUnit}
                    className="px-8 py-4 bg-amber-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-opacity"
                >
                    Refresh
                </button>
            </div>
        );
    }

    const openTickets = tickets.filter(t => t.status !== 'RESOLVED');
    const pendingBills = bills.filter(b => b.status !== 'PAID');
    const pendingAmount = pendingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    const nextDueLabel =
        unit.agreementType === 'LEASE'
            ? (unit.leaseEndDate ? `Renewal: ${unit.leaseEndDate}` : 'Lease renewal date not set')
            : (unit.rentDueDate ? `Next rent due: ${unit.rentDueDate}` : 'Next rent due date not set');

    const sortedNotifications = [...notifications].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
    ).slice(0, 5);

    return (
        <div className="space-y-10 animate-reveal">
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Active Residence</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
                        {unit.name}<br /><span className="text-amber-500 not-italic">Sanctuary</span>
                    </h2>
                    <div className="mt-6">
                        <PulseIndicator color="bg-emerald-500" />
                    </div>
                </div>
                <div className="text-right">
                    <p className={METRIC_LABEL}>Lease Standing</p>
                    <div className="px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-black text-[10px] uppercase tracking-widest">
                        {unit.agreementType === 'LEASE' ? 'Lease' : 'Rental'} active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-12">
                {/* Lease / next due */}
                <div className={`${BENTO_CARD} md:col-span-5 p-12 bg-amber-50 dark:bg-white/[0.02] border border-amber-100 dark:border-white/10 space-y-8`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className={METRIC_LABEL}>Lease & schedule</span>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Next action</h4>
                        </div>
                        <Icons.Clock size={20} className="text-amber-500" />
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{nextDueLabel}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <p className={METRIC_LABEL}>Deposit</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">₹{(unit.deposit || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <p className={METRIC_LABEL}>Rent / lease</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                {unit.agreementType === 'LEASE'
                                    ? `₹${(unit.leaseAmount || 0).toLocaleString()}`
                                    : `₹${(unit.rent || 0).toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigate('finance')}
                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all"
                    >
                        View billing
                    </button>
                </div>

                {/* Bills summary */}
                <div className={`${BENTO_CARD} md:col-span-4 p-12 bg-violet-50 dark:bg-white/[0.02] border border-violet-100 dark:border-white/10 space-y-8`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className={METRIC_LABEL}>Billing</span>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Pending dues</h4>
                        </div>
                        <Icons.CreditCard size={20} className="text-violet-500" />
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-5xl font-black text-amber-500 tracking-tighter italic">₹{pendingAmount.toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{pendingBills.length} bill(s)</p>
                    </div>
                    <div className="space-y-3">
                        {pendingBills.slice(0, 3).map(b => (
                            <div key={b.id} className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{b.type}</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Due {b.dueDate}</p>
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">₹{b.amount}</p>
                            </div>
                        ))}
                        {pendingBills.length === 0 && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No pending bills.</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigate('finance')}
                        className="w-full py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                    >
                        Open billing
                    </button>
                </div>

                {/* Maintenance + documents */}
                <div className="md:col-span-3 space-y-8">
                    <div className={`${BENTO_CARD} p-10 bg-sky-50 dark:bg-white/[0.02] border border-sky-100 dark:border-white/10 space-y-6`}>
                        <span className={METRIC_LABEL}>Maintenance</span>
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tickets</h4>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                openTickets.length ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            }`}>{openTickets.length} open</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigate('maintenance')}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all"
                        >
                            Request service
                        </button>
                    </div>

                    <div className={`${BENTO_CARD} p-10 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-6`}>
                        <span className={METRIC_LABEL}>Documents</span>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Vault</h4>
                        <button
                            type="button"
                            onClick={() => onNavigate('legal')}
                            className="w-full py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        >
                            Open documents
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent notifications */}
            <div className={`${BENTO_CARD} p-12 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
                <div className="flex items-center justify-between">
                    <div>
                        <span className={METRIC_LABEL}>Notifications</span>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Recent</h4>
                    </div>
                    <button
                        type="button"
                        onClick={loadTenantData}
                        className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest"
                    >
                        Refresh
                    </button>
                </div>
                <div className="mt-8 space-y-4">
                    {sortedNotifications.length === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No new notifications.</p>
                    ) : (
                        sortedNotifications.map(n => (
                            <div key={n.id} className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{n.title}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">{n.message}</p>
                                {n.createdAt && <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
