
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { UserRole, UserSession, Bill, TenancySummary } from '../types';
import { BENTO_CARD, METRIC_LABEL, Icons, Sparkline } from '../App';
import { api } from '../services/apiService';
import { ErrorBanner } from './ErrorBanner';

interface FinanceViewProps {
    session: UserSession;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ session }) => {
    const [insights, setInsights] = useState<any>(null);
    const [bills, setBills] = useState<Bill[]>([]);
    const [tenancy, setTenancy] = useState<TenancySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [payingBill, setPayingBill] = useState<Bill | null>(null);
    const [paymentRef, setPaymentRef] = useState('');
    const [payBusy, setPayBusy] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const [billStatusFilter, setBillStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
    const [billSort, setBillSort] = useState<'DUE_SOONEST' | 'AMOUNT_DESC' | 'STATUS_PENDING_FIRST'>('STATUS_PENDING_FIRST');
    const [billTypeFilter, setBillTypeFilter] = useState<'ALL' | 'RENT' | 'UTILITIES'>('ALL');
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

    const fetchFinanceData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            if (session.role === UserRole.OWNER) {
                const data = await api.getFinanceInsights();
                setInsights(data);
            } else {
                const [summary, data] = await Promise.all([
                    api.getTenancySummary(),
                    api.getMyBills(),
                ]);
                setTenancy(summary);
                setBills(data);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Could not load billing data.';
            setLoadError(msg);
            if (session.role === UserRole.OWNER) setInsights(null);
            else { setBills([]); setTenancy(null); }
        } finally {
            setIsLoading(false);
        }
    }, [session.role]);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    const submitPayment = async () => {
        if (!payingBill || !paymentRef.trim()) {
            setPayError('Enter a payment reference (UPI ref, transaction ID, or receipt number).');
            return;
        }
        setPayBusy(true);
        setPayError(null);
        try {
            await api.payBill(payingBill.id, paymentRef.trim());
            setPayingBill(null);
            setPaymentRef('');
            await fetchFinanceData();
        } catch (e: unknown) {
            setPayError(e instanceof Error ? e.message : 'Payment failed.');
        } finally {
            setPayBusy(false);
        }
    };

    const displayedBills = useMemo(() => {
        const filtered = bills.filter(b => {
            if (billStatusFilter !== 'ALL' && b.status !== billStatusFilter) return false;
            if (billTypeFilter === 'RENT' && b.type !== 'RENT') return false;
            if (billTypeFilter === 'UTILITIES' && b.type === 'RENT') return false;
            return true;
        });

        const statusRank = (s: Bill['status']) => (s === 'OVERDUE' ? 0 : s === 'PENDING' ? 1 : 2);

        const sorted = [...filtered].sort((a, b) => {
            if (billSort === 'AMOUNT_DESC') return (Number(b.amount) - Number(a.amount)) || a.dueDate.localeCompare(b.dueDate);
            if (billSort === 'DUE_SOONEST') return a.dueDate.localeCompare(b.dueDate) || (Number(b.amount) - Number(a.amount));
            // STATUS_PENDING_FIRST
            return (statusRank(a.status) - statusRank(b.status)) || a.dueDate.localeCompare(b.dueDate);
        });
        return sorted;
    }, [bills, billStatusFilter, billSort]);

    if (isLoading) return <div className="space-y-12 animate-pulse"><div className={`${BENTO_CARD} h-[80vh] bg-slate-100 dark:bg-white/5`}></div></div>;

    return (
        <div className="space-y-12 animate-reveal">
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Real-time Capital Monitoring</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
                        Financial<br /><span className="text-amber-500 not-italic">Flow</span>
                    </h2>
                </div>
            </div>

            {loadError && (
                <ErrorBanner message={loadError} onRetry={fetchFinanceData} />
            )}

            {session.role === UserRole.OWNER && insights ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Primary Yield Dashboard */}
                    <div className={`${BENTO_CARD} md:col-span-8 p-12 space-y-12 bg-teal-50 dark:bg-[#0a0c10] border border-teal-100 dark:border-white/5 shadow-sm`}>
                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                <span className={METRIC_LABEL}>Monthly Net Yield</span>
                                <h3 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic">₹{(insights.monthlyNet / 1000).toFixed(1)}K</h3>
                                <div className="flex items-center gap-3 text-emerald-600 font-bold">
                                    <Icons.TrendingUp size={20} />
                                    <span className="text-sm tracking-tight">Healthy cash flow detected</span>
                                </div>
                            </div>
                            <div className="w-64 h-32">
                                <Sparkline data={insights.monthlyTrends} color="#F59E0B" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-teal-200 dark:border-white/10">
                            <div>
                                <p className={METRIC_LABEL}>Gross Revenue</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white italic">₹{(insights.monthlyGross / 1000).toFixed(1)}K</p>
                            </div>
                            <div>
                                <p className={METRIC_LABEL}>Potential Rev</p>
                                <p className="text-3xl font-black text-amber-500 italic">₹{(insights.potentialRevenue / 1000).toFixed(1)}K</p>
                            </div>
                            <div>
                                <p className={METRIC_LABEL}>Pending Coll</p>
                                <p className="text-3xl font-black text-emerald-600 italic">₹{(insights.pendingRent / 1000).toFixed(1)}K</p>
                            </div>
                            <div>
                                <p className={METRIC_LABEL}>Expenses</p>
                                <p className="text-3xl font-black text-rose-500 italic">₹{(insights.totalExpenses / 1000).toFixed(1)}K</p>
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className={`${BENTO_CARD} md:col-span-4 p-12 flex flex-col justify-between bg-amber-50 dark:bg-[#0a0c10] border border-amber-100 dark:border-white/5 shadow-sm`}>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Expense Hub</h4>
                        <div className="space-y-6 mt-10">
                            {Object.entries(insights.expenseBreakdown).map(([type, amount]: [string, any], idx) => {
                                const tints = ['bg-violet-50 dark:bg-white/5 border-violet-200 dark:border-white/10','bg-sky-50 dark:bg-white/5 border-sky-200 dark:border-white/10','bg-rose-50 dark:bg-white/5 border-rose-200 dark:border-white/10','bg-emerald-50 dark:bg-white/5 border-emerald-200 dark:border-white/10'];
                                return (
                                <div key={type} className={`flex justify-between items-center p-6 rounded-[2rem] border ${tints[idx % tints.length]}`}>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{type}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{amount}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                                        <Icons.CreditCard className="text-amber-500" size={18} />
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Example insight — not automated advice */}
                    <div className={`${BENTO_CARD} md:col-span-12 p-12 bg-amber-500/90 dark:bg-amber-600/30 text-black dark:text-amber-100 border border-amber-400/50 dark:border-amber-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-8`}>
                        <div className="space-y-4 max-w-2xl">
                            <span className="text-[10px] font-black text-black/60 dark:text-amber-200/90 uppercase tracking-[0.4em]">Example insight (not AI)</span>
                            <h4 className="text-2xl md:text-3xl font-black tracking-tight leading-tight italic text-slate-950 dark:text-white">
                                Sample idea: review whether bundling utilities could simplify billing for tenants.
                            </h4>
                            <p className="text-black/70 dark:text-amber-100/80 text-sm font-semibold normal-case tracking-normal">
                                This is placeholder copy for layout. Replace with real analytics or your own playbook when you connect data sources.
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="px-10 py-5 bg-slate-900/80 dark:bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest opacity-60 cursor-not-allowed border border-transparent"
                            title="No automation wired yet"
                        >
                            Not available
                        </button>
                    </div>
                </div>
            ) : session.role === UserRole.OWNER && !loadError ? (
                <div className={`${BENTO_CARD} p-16 text-center text-slate-500`}>
                    <p className="font-semibold">No finance insights loaded.</p>
                </div>
            ) : !loadError ? (
                <div className="space-y-8">
                    {/* Tenant Billing View */}
                    {tenancy && (
                        <div className={`${BENTO_CARD} p-12 bg-amber-50 dark:bg-white/[0.02] border border-amber-100 dark:border-white/10`}>
                            <div className="flex items-start justify-between gap-8">
                                <div className="min-w-0">
                                    <span className={METRIC_LABEL}>Lease & deposit</span>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                        {tenancy.propertyName ? `${tenancy.propertyName} · ` : ''}{tenancy.unitName}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mt-4">
                                        {tenancy.agreementType === 'LEASE'
                                            ? (tenancy.leaseEndDate ? `Lease renewal on ${tenancy.leaseEndDate}` : 'Lease renewal date not set')
                                            : (tenancy.rentDueDate ? `Next rent due on ${tenancy.rentDueDate}` : 'Next rent due date not set')}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className={METRIC_LABEL}>Deposit</p>
                                    <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{Number(tenancy.deposit || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
                                <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <p className={METRIC_LABEL}>Agreement</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{tenancy.agreementType}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <p className={METRIC_LABEL}>{tenancy.agreementType === 'LEASE' ? 'Lease amount' : 'Monthly rent'}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">
                                        ₹{Number((tenancy.agreementType === 'LEASE' ? tenancy.leaseAmount : tenancy.rent) || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <p className={METRIC_LABEL}>Tenure</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">
                                        {tenancy.leaseTenure ? `${tenancy.leaseTenure} months` : (tenancy.agreementType === 'LEASE' ? '—' : 'Monthly')}
                                    </p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <p className={METRIC_LABEL}>Rent status</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{tenancy.rentStatus || '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                Receivables ledger
                            </h3>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all shadow-sm ${filterDrawerOpen ? 'bg-amber-400 text-black border-amber-400' : 'bg-white dark:bg-[#0c1017] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-amber-500 hover:border-amber-400/50'}`}
                                title="Filter Ledger"
                            >
                                <Icons.SlidersHorizontal size={20} className={filterDrawerOpen ? 'rotate-90 transition-transform duration-500' : 'transition-transform duration-500'} />
                            </button>
                            
                            {filterDrawerOpen && (
                                <>
                                <div className="fixed inset-0 z-40" onClick={() => setFilterDrawerOpen(false)} />
                                <div className="absolute right-0 top-16 w-80 z-50 bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-6 animate-reveal">
                                    <div className="mb-6">
                                        <p className={METRIC_LABEL}>Data views</p>
                                        <h4 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight">Ledger Filters</h4>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className={METRIC_LABEL}>Filter status</label>
                                            <select
                                                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-400/50 transition-colors"
                                                value={billStatusFilter}
                                                onChange={(e) => setBillStatusFilter(e.target.value as any)}
                                            >
                                                <option value="ALL">All liabilities</option>
                                                <option value="PENDING">Pending action</option>
                                                <option value="OVERDUE">Overdue status</option>
                                                <option value="PAID">Settled (Paid)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={METRIC_LABEL}>Ledger Type</label>
                                            <select
                                                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-400/50 transition-colors"
                                                value={billTypeFilter}
                                                onChange={(e) => setBillTypeFilter(e.target.value as any)}
                                            >
                                                <option value="ALL">All liabilities</option>
                                                <option value="RENT">Rent History</option>
                                                <option value="UTILITIES">Utility Bills</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={METRIC_LABEL}>Sort order</label>
                                            <select
                                                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-400/50 transition-colors"
                                                value={billSort}
                                                onChange={(e) => setBillSort(e.target.value as any)}
                                            >
                                                <option value="STATUS_PENDING_FIRST">Priority (Pending first)</option>
                                                <option value="DUE_SOONEST">Due date (Soonest)</option>
                                                <option value="AMOUNT_DESC">Amount (High to low)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {displayedBills.map((bill, idx) => {
                            const tints = [
                                'bg-indigo-50 dark:bg-white/5 border-indigo-100 dark:border-white/5',
                                'bg-emerald-50 dark:bg-white/5 border-emerald-100 dark:border-white/5',
                                'bg-rose-50 dark:bg-white/5 border-rose-100 dark:border-white/5',
                                'bg-sky-50 dark:bg-white/5 border-sky-100 dark:border-white/5',
                            ];
                            const tint = tints[idx % tints.length];
                            return (
                            <div key={bill.id} className={`${BENTO_CARD} p-10 space-y-10 group hover:shadow-md dark:hover:bg-white/5 shadow-sm dark:shadow-none border ${tint}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 ${bill.status === 'PAID' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                            <Icons.CreditCard size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-tight">{bill.type} Bill</h4>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Due {bill.dueDate}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white italic">₹{bill.amount}</p>
                                        <span className={`text-[8px] font-black uppercase px-4 py-1.5 mt-2 inline-block rounded-full border ${bill.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </div>
                                {bill.status === 'PAID' && bill.paymentReference && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Reference: {bill.paymentReference}</p>
                                )}
                                {bill.status !== 'PAID' && (
                                    <button
                                        type="button"
                                        onClick={() => { setPayingBill(bill); setPaymentRef(''); setPayError(null); }}
                                        className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 dark:hover:bg-amber-400 transition-all border border-transparent shadow-xl"
                                    >
                                        Record payment
                                    </button>
                                )}
                            </div>
                            );
                        })}
                    </div>

                    {displayedBills.length === 0 && (
                        <div className="py-40 text-center space-y-8 opacity-20">
                            <Icons.PieChart size={64} className="mx-auto text-slate-500" />
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Settled Balance</h3>
                            <p className="max-w-md mx-auto text-[10px] font-black uppercase tracking-widest text-slate-500">Your financial profile is in clear status. No pending liabilities detected.</p>
                        </div>
                    )}
                </div>
            ) : null}

            {payingBill && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <div className={`${BENTO_CARD} max-w-md w-full p-10 space-y-6 bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/10 shadow-2xl`}>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record payment</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Enter the reference from your bank, UPI, or receipt. Your landlord can match it to this bill.
                        </p>
                        <div>
                            <label htmlFor="pay-ref" className={METRIC_LABEL}>Payment reference</label>
                            <input
                                id="pay-ref"
                                value={paymentRef}
                                onChange={e => setPaymentRef(e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-slate-900 dark:text-white font-semibold"
                                placeholder="e.g. UPI ref / txn ID"
                                autoComplete="off"
                            />
                        </div>
                        {payError && <p className="text-sm text-rose-600 font-semibold">{payError}</p>}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setPayingBill(null); setPayError(null); }}
                                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-sm text-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={payBusy}
                                onClick={submitPayment}
                                className="flex-1 py-4 rounded-2xl bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                            >
                                {payBusy ? 'Saving…' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
