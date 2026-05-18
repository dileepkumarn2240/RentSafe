import React, { useMemo } from 'react';
import { Property, UnitStatus, RevenueInsight, UnitRevenueDTO } from '../types';
import { BENTO_CARD, METRIC_LABEL, PulseIndicator, Sparkline, ProfitFlow, IncomePlanner, Icons } from '../App';
import { api } from '../services/apiService';
import { ErrorBanner } from './ErrorBanner';

const ICON_GLOW = "w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center transition-all duration-500 border border-white/5 group-hover:scale-110 group-hover:rotate-3 group-hover:border-white/10";

const SecurityWidget = ({ propertyId }: { propertyId: string }) => {
    const [state, setState] = React.useState<any>(null);

    React.useEffect(() => {
        api.getSecurity(propertyId).then(setState).catch(console.error);
    }, [propertyId]);

    if (!state) return <div className="animate-pulse h-full bg-slate-100 dark:bg-white/5 rounded-[3rem]" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <span className={METRIC_LABEL}>Active Security</span>
                <span className="text-[9px] font-black uppercase px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">{state.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {state.feeds.map((feed: any) => (
                    <div key={feed.id} className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden group/cam">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icons.Video className="text-white/20" size={32} />
                        </div>
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">{feed.location}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4 p-4 bg-amber-400/5 border border-amber-400/10 rounded-2xl">
                <Icons.AlertTriangle className="text-amber-500" size={16} />
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    {state.recentAlerts[0]?.message} at {state.recentAlerts[0]?.time}
                </p>
            </div>
        </div>
    );
};

// Re-defining internal components if they are not exported from App.
// Since App.tsx is currently just becoming a shell, I'll move these utilities to a separate file or keep them in App as shared.
// For now, I'll assume they are exported or I'll export them in the next step.

interface OwnerDashboardProps {
    onNavigate: (tab: string) => void;
}

const BudgetExplainer = () => (
    <div className="p-8 bg-amber-400/5 border border-amber-400/10 rounded-[3rem] space-y-4 shadow-2xl shadow-amber-400/5 animate-reveal">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-950">
                <Icons.Info size={20} />
            </div>
            <h5 className="text-sm font-black text-amber-500 uppercase tracking-widest italic leading-none">Yield Allocation Strategy</h5>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed opacity-80">
            The <span className="text-amber-400">Amber Segment</span> and adjacent blocks in the chart are <span className="text-slate-300">illustrative splits</span> for planning—not pulled from your ledger. Use real reports for tax and compliance.
        </p>
    </div>
);

const HistoricalTrendsChart = ({ data }: { data: Record<string, number> }) => {
    const labels = Object.keys(data);
    const values = Object.values(data);
    const max = Math.max(...values, 1);
    
    return (
        <div className="space-y-6 animate-reveal">
            <span className={METRIC_LABEL}>Yearly Growth Velocity</span>
            <div className="flex items-end gap-3 h-48 pt-4">
                {labels.map((label, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group/bar">
                        <div className="relative w-full bg-white/5 rounded-t-2xl group-hover/bar:bg-amber-400/20 transition-all duration-500 overflow-hidden" 
                             style={{ height: `${(data[label] / max) * 100}%` }}>
                            <div className="absolute inset-x-0 bottom-0 bg-amber-400 rounded-t-2xl opacity-80 group-hover/bar:opacity-100 transition-all shadow-2xl shadow-amber-400/40" style={{ height: '100%' }} />
                            {data[label] > 0 && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-black p-2 rounded-lg border border-white/10 z-10">
                                    <p className="text-[8px] font-black text-white">₹{data[label].toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover/bar:text-amber-400 transition-colors leading-none">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CollectionsHub = ({ unitRevenues, onClose, onMarkPaid }: { unitRevenues: UnitRevenueDTO[], onClose: () => void, onMarkPaid: (unitId: string, type: string) => Promise<void> }) => {
    const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(null);
    const selectedUnit = unitRevenues.find(u => u.unitId === selectedUnitId);

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0c10] z-[100] p-10 md:p-20 overflow-y-auto animate-reveal flex items-start justify-center transition-colors duration-500">
            <div className="max-w-7xl w-full space-y-16 py-10">
                <div className="flex justify-between items-center bg-white dark:bg-white/5 p-12 rounded-[4rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-amber-400 text-black rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-400/20">
                            <Icons.Activity size={36} />
                        </div>
                        <div>
                            <h3 className="text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Collections Center</h3>
                            <p className="text-slate-500 uppercase tracking-[0.4em] font-black text-[12px] mt-3 opacity-60">Real-time occupancy & utility verification</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={onClose} className="px-8 py-5 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-300 dark:border-white/5 font-black uppercase text-[11px] tracking-widest">
                            <Icons.ArrowLeft size={16} />
                            Back to Dashboard
                        </button>
                        <button onClick={onClose} className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-slate-300 dark:border-white/5 active:scale-90 shadow-none dark:shadow-2xl">
                            <Icons.X size={32} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-4 space-y-6">
                        <span className={METRIC_LABEL}>Asset Registry ({unitRevenues.length})</span>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                            {unitRevenues.map(u => (
                                <button 
                                    key={u.unitId} 
                                    onClick={() => setSelectedUnitId(u.unitId)}
                                    className={`w-full p-8 rounded-[2.5rem] text-left border-2 transition-all duration-500 group ${selectedUnitId === u.unitId ? 'bg-amber-400 border-amber-400 text-black shadow-lg dark:shadow-2xl shadow-amber-400/20' : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-xl'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-black text-xl uppercase italic tracking-tighter leading-none">{u.unitName}</p>
                                        {u.rentStatus === 'PAID' ? <Icons.CheckCircle className="text-emerald-500 group-hover:text-black/60" size={16} /> : <Icons.Clock className="text-rose-500 group-hover:text-black/60" size={16} />}
                                    </div>
                                    <p className={`text-[9px] uppercase tracking-widest mt-3 font-black ${selectedUnitId === u.unitId ? 'text-black/60' : 'text-slate-600'}`}>{u.propertyName}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        {selectedUnit ? (
                            <div className="space-y-10 animate-reveal">
                                <div className="flex items-center justify-between pb-10 border-b border-slate-200 dark:border-white/5">
                                    <div className="flex items-center gap-6">
                                        <Icons.Home className="text-amber-400" size={32} />
                                        <h4 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Unit Bill Status Check</h4>
                                    </div>
                                    <button onClick={() => setSelectedUnitId(null)} className="px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-300 dark:border-white/5 font-black uppercase text-[10px] tracking-widest">
                                        <Icons.X size={14} />
                                        Close Panel
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { label: 'Monthly Rent', status: selectedUnit.rentStatus, icon: <Icons.CreditCard />, type: 'RENT', desc: 'Primary monthly lease revenue', hide: selectedUnit.agreementType === 'LEASE' },
                                        { label: 'Electricity Bill', status: selectedUnit.billStatuses['ELECTRICITY'] || 'NONE', icon: <Icons.Zap />, type: 'ELECTRICITY', desc: 'Electrical grid consumption audit' },
                                        { label: 'Water Bill', status: selectedUnit.billStatuses['WATER'] || 'NONE', icon: <Icons.Droplets />, type: 'WATER', desc: 'Sanitary & water service status' },
                                        { label: 'Maintenance Fees', status: selectedUnit.billStatuses['MAINTENANCE'] || 'NONE', icon: <Icons.Tool />, type: 'MAINTENANCE', desc: 'Asset upkeep & common charges' },
                                    ].filter(p => !p.hide).map((pillar, i) => (
                                        <div key={i} className={`${BENTO_CARD} p-10 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.05] group/pillar`}>
                                            <div className="flex items-start gap-8">
                                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-700 shadow-2xl ${pillar.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-500' : pillar.status === 'NONE' ? 'bg-slate-500/10 text-slate-500' : (pillar.status as string) === 'VACANT' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'} group-hover/pillar:scale-110 group-hover/pillar:rotate-3`}>
                                                    {React.cloneElement(pillar.icon as React.ReactElement, { size: 36 })}
                                                </div>
                                                <div className="space-y-3 flex-1">
                                                    <p className={METRIC_LABEL}>{pillar.label}</p>
                                                    <div className="flex items-center gap-4">
                                                        <p className={`text-3xl font-black uppercase italic tracking-tighter leading-none ${pillar.status === 'PAID' ? 'text-emerald-500' : pillar.status === 'NONE' ? 'text-slate-500' : (pillar.status as string) === 'VACANT' ? 'text-amber-500' : 'text-rose-500'}`}>{pillar.status as string}</p>
                                                        {pillar.status === 'PAID' && <Icons.CheckCircle className="text-emerald-400" size={24} />}
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold opacity-60 leading-relaxed">{pillar.desc}</p>
                                                </div>
                                                {pillar.status === 'PENDING' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onMarkPaid(selectedUnit.unitId, pillar.type); }}
                                                        className="px-6 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-black font-black uppercase text-[10px] tracking-widest transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 space-y-10 bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-[4rem] animate-pulse shadow-sm dark:shadow-none">
                                <div className="w-32 h-32 bg-amber-400/10 text-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-400/5">
                                    <Icons.MousePointer2 size={64} className="animate-bounce" />
                                </div>
                                <div className="text-center space-y-4">
                                    <p className="font-black uppercase tracking-[0.4em] text-lg text-slate-900 dark:text-white italic">Awaiting Unit Selection</p>
                                    <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-600">Select a unit from the registry to see the bill status of unit</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const UnitRevenueList = ({ unitRevenues }: { unitRevenues: UnitRevenueDTO[] }) => (
    <div className="space-y-8 animate-reveal h-full flex flex-col">
        <div className="flex justify-between items-center">
            <span className={METRIC_LABEL}>Asset Yield Breakdown</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{unitRevenues.length} Active Records</span>
        </div>
        <div className="flex-1 space-y-4 pr-2 custom-scrollbar overflow-y-auto max-h-[500px]">
            {unitRevenues.map(u => (
                <div key={u.unitId} className="p-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all group shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${u.rentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} group-hover:scale-110 group-hover:rotate-3`}>
                            <Icons.Home size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{u.unitName}</h5>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-[7px] font-black text-slate-500 uppercase tracking-widest">{u.agreementType || 'RENTAL'}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 font-black">{u.propertyName}</p>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <p className="text-2xl font-black text-amber-500 tracking-tighter italic">
                            ₹{(u.agreementType === 'LEASE' ? (u.leaseAmount || 0) : u.monthlyRent).toLocaleString()}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${u.rentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                {u.agreementType === 'LEASE' ? 'ACTIVE LEASE' : u.rentStatus}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigate }) => {
    const [properties, setProperties] = React.useState<Property[]>([]);
    const [metrics, setMetrics] = React.useState<any>(null);
    const [unitRevenues, setUnitRevenues] = React.useState<any[]>([]);
    const [trends, setTrends] = React.useState<any>(null);
    const [leases, setLeases] = React.useState<any>(null);
    const [isCollectionsActive, setIsCollectionsActive] = React.useState(false);
    const [dashboardMode, setDashboardMode] = React.useState<'ALL' | 'RENTAL' | 'LEASE'>('ALL');
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [markPaidError, setMarkPaidError] = React.useState<string | null>(null);

    const refreshFinance = React.useCallback(async () => {
        try {
            setLoadError(null);
            const [m, u, t, l, props] = await Promise.all([
                api.getFinanceMetrics(),
                api.getFinanceUnits(),
                api.getFinanceTrends(),
                api.getFinanceLeases(),
                api.getProperties()
            ]);
            setMetrics(m);
            setUnitRevenues(u);
            setTrends(t);
            setLeases(l);
            setProperties(props);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Could not load dashboard data.';
            setLoadError(msg);
        }
    }, []);

    React.useEffect(() => {
        refreshFinance();
    }, [refreshFinance]);

    const stats = useMemo(() => {
        if (!Array.isArray(properties)) return { totalUnits: 0, occupancy: 0, totalRent: 0, potentialRent: 0, valuation: 0, collectionRate: 100 };

        const totalUnits = properties.reduce((acc, p) => acc + (p.units?.length || 0), 0);
        const occupiedUnits = properties.reduce((acc, p) => acc + (p.units?.filter(u => u.status === UnitStatus.OCCUPIED).length || 0), 0);
        const totalRent = properties.reduce((acc, p) => acc + (p.units?.reduce((r, u) => u.status === UnitStatus.OCCUPIED ? r + (u.rent || 0) : r, 0) || 0), 0);
        const potentialRent = properties.reduce((acc, p) => acc + (p.units?.reduce((r, u) => u.status === UnitStatus.VACANT ? r + (u.rent || 0) : r, 0) || 0), 0);
        const valuation = properties.reduce((acc, p) => acc + (p.valuation || 0), 0);

        const allBills = properties.flatMap(p => p.units?.flatMap(u => u.bills || []) || []);
        const totalBilled = allBills.reduce((acc, b) => acc + (b.amount || 0), 0);
        const totalPaid = allBills.filter(b => b.status === 'PAID').reduce((acc, b) => acc + (b.amount || 0), 0);
        const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

        return {
            totalUnits,
            occupancy: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
            totalRent: isNaN(totalRent) ? 0 : totalRent,
            potentialRent: isNaN(potentialRent) ? 0 : potentialRent,
            valuation: isNaN(valuation) ? 0 : valuation,
            collectionRate
        };
    }, [properties]);

    const handleMarkPaid = async (unitId: string, billType: string) => {
        setMarkPaidError(null);
        try {
            await api.markBillPaid(unitId, billType);
            await refreshFinance();
        } catch (e: unknown) {
            setMarkPaidError(e instanceof Error ? e.message : 'Could not mark bill as paid.');
        }
    };

    if (loadError && properties.length === 0) {
        return (
            <div className="space-y-8 animate-reveal max-w-3xl">
                <ErrorBanner message={loadError} onRetry={refreshFinance} />
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="space-y-10 animate-reveal">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Portfolio<br />Intelligence</h2>
                        <div className="mt-6">
                            <PulseIndicator color="bg-slate-500" />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Portfolio Valuation</p>
                        <p className="text-5xl font-black text-slate-600 tracking-tighter">₹0.00Cr</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-12">
                    <div className={`${BENTO_CARD} md:col-span-12 p-16 flex flex-col items-center justify-center text-center bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20`}>
                        <div className={`${ICON_GLOW} bg-amber-500/10 text-amber-500 mb-8 w-24 h-24 rounded-[2rem] mx-auto`}>
                            <Icons.Home size={40} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">No Revenue Data Available</h3>
                        <p className="text-slate-400 font-medium max-w-2xl text-lg mb-10 mx-auto">
                            Your Intelligence Dashboard is currently inactive. Deploy an asset in your Sanctuary to activate real-time yield tracking, predictive finance AI, and tenant monitoring.
                        </p>
                        <button onClick={() => onNavigate('assets')} className="px-10 py-5 bg-amber-400 text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 mx-auto">
                            <Icons.Plus size={18} />
                            Deploy Your First Asset
                        </button>
                    </div>

                    <div className={`${BENTO_CARD} md:col-span-8 p-12 opacity-20 select-none pointer-events-none filter grayscale saturate-0`}>
                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                <span className={METRIC_LABEL}>Monthly Yield</span>
                                <h3 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">₹0.0L</h3>
                                <div className="flex items-center gap-3 text-slate-500 font-bold">
                                    <span className="text-sm tracking-tight">System Offline</span>
                                </div>
                            </div>
                            <div className="w-48 h-24">
                                <Sparkline data={[0, 0, 0, 0, 0]} color="#64748B" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8 mt-12 border-t border-slate-200 dark:border-white/5 pt-12">
                            <div><p className={METRIC_LABEL}>Occupancy</p><p className="text-3xl font-black text-slate-900 dark:text-white">0%</p></div>
                            <div><p className={METRIC_LABEL}>Collection</p><p className="text-3xl font-black text-slate-500">0%</p></div>
                            <div><p className={METRIC_LABEL}>Active Units</p><p className="text-3xl font-black text-slate-900 dark:text-white">0</p></div>
                        </div>
                    </div>

                    <div className="md:col-span-4 space-y-8 opacity-20 select-none pointer-events-none filter grayscale saturate-0">
                        <div className={`${BENTO_CARD} p-10 bg-white dark:bg-white/5 border-none`}>
                            <h4 className="text-2xl font-black text-slate-500 uppercase tracking-tighter leading-tight">Income<br />Planner</h4>
                            <p className="mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Data</p>
                        </div>
                        <div className={`${BENTO_CARD} p-10 bg-white dark:bg-white/5 border-none`}>
                            <h4 className="text-2xl font-black text-slate-500 uppercase tracking-tighter leading-tight">Security<br />Console</h4>
                            <p className="mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Offline</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-reveal">
            {isCollectionsActive && (
                <CollectionsHub 
                    unitRevenues={unitRevenues || []} 
                    onClose={() => setIsCollectionsActive(false)} 
                    onMarkPaid={handleMarkPaid}
                />
            )}

            {loadError && (
                <ErrorBanner message={loadError} onRetry={refreshFinance} />
            )}
            {markPaidError && (
                <ErrorBanner message={markPaidError} onRetry={() => setMarkPaidError(null)} retryLabel="Dismiss" />
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">Portfolio<br />Intelligence</h2>
                    <div className="mt-8 flex items-center gap-8">
                        <PulseIndicator />
                        <div className="h-0.5 w-32 bg-slate-200 dark:bg-white/5 rounded-full" />
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] animate-pulse">Secure Link Active</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 opacity-60">Total Estate Valuation</p>
                    <p className="text-7xl font-black text-amber-500 tracking-tighter italic">₹{(stats.valuation / 10000000).toFixed(2)}Cr</p>
                </div>
            </div>

            <div className="flex justify-center mt-4">
                <div className="inline-flex bg-white dark:bg-white/5 p-2 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-md dark:shadow-2xl backdrop-blur-xl">
                    {(['ALL', 'RENTAL', 'LEASE'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setDashboardMode(mode)}
                            className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${dashboardMode === mode ? 'bg-amber-400 text-black shadow-lg dark:shadow-2xl shadow-amber-400/40 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mt-12">
                <div className={`${BENTO_CARD} md:col-span-8 p-16 flex flex-col justify-between min-h-[500px] bg-gradient-to-br from-emerald-50 dark:from-[#0a0c10] to-white dark:to-[#040507]`}>
                    <div className="flex justify-between items-start">
                        <div className="space-y-6">
                            <span className={METRIC_LABEL}>
                                {dashboardMode === 'LEASE' ? 'AGGREGATED LEASE DEPOSITS' : 'AGGREGATED MONTHLY YIELD'}
                            </span>
                            <h3 className="text-8xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                ₹{dashboardMode === 'LEASE' 
                                    ? ((leases?.totalLeaseDeposits || 0) / 100000).toFixed(2) 
                                    : (metrics?.monthlyGross || 0) / 100000 < 0.01 
                                        ? '0.00' 
                                        : ((metrics?.monthlyGross || 0) / 100000).toFixed(2)
                                }L
                            </h3>
                            <div className="flex items-center gap-4 text-emerald-500 font-black">
                                <div className={`px-4 py-2 rounded-xl text-[10px] tracking-widest transition-all bg-emerald-500/10 border border-emerald-500/20 uppercase`}>
                                    {dashboardMode === 'LEASE' 
                                        ? `${leases?.activeLeaseCount || 0} ACTIVE LEASE AGREEMENTS`
                                        : metrics ? `${((metrics.monthlyNet / metrics.monthlyGross) * 100 || 0).toFixed(1)}% EFFICIENCY` : 'ANALYZING YIELD...'}
                                </div>
                                <Icons.TrendingUp className="animate-pulse" size={20} />
                            </div>
                        </div>
                        <div className="w-56 h-28 opacity-60">
                            <Sparkline data={dashboardMode === 'LEASE' ? [0, 0, 0, 0, 0] : (trends?.monthlyTrends || [0, 0, 0, 0, 0])} color="#F59E0B" showMarketMatch={true} />
                        </div>
                    </div>
                    
                    {(dashboardMode === 'RENTAL' || dashboardMode === 'ALL') && (
                        <div className="mt-8 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-8 rounded-3xl animate-reveal">
                            <span className={METRIC_LABEL}>Revenue Breakdown (Monthly)</span>
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Occupied Revenue</span>
                                    </div>
                                    <span className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{(metrics?.monthlyGross || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-amber-500 rounded-full" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vacant (Potential) Revenue</span>
                                    </div>
                                    <span className="text-xl font-black text-amber-500 italic tracking-tighter">₹{(metrics?.potentialRevenue || 0).toLocaleString()}</span>
                                </div>
                                <div className="h-px w-full bg-slate-200 dark:bg-white/5 my-4" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Expected Revenue</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{((metrics?.monthlyGross || 0) + (metrics?.potentialRevenue || 0)).toLocaleString()}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden flex mt-2">
                                    <div className="h-full bg-emerald-500" style={{ width: `${(metrics?.monthlyGross || 0) + (metrics?.potentialRevenue || 0) > 0 ? ((metrics?.monthlyGross || 0) / ((metrics?.monthlyGross || 0) + (metrics?.potentialRevenue || 0))) * 100 : 0}%` }} />
                                    <div className="h-full bg-amber-500/50" style={{ width: `${(metrics?.monthlyGross || 0) + (metrics?.potentialRevenue || 0) > 0 ? ((metrics?.potentialRevenue || 0) / ((metrics?.monthlyGross || 0) + (metrics?.potentialRevenue || 0))) * 100 : 0}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {dashboardMode === 'LEASE' && (
                        <div className="mt-8 border border-amber-400/10 bg-amber-400/[0.02] p-8 rounded-3xl animate-reveal">
                            <span className={METRIC_LABEL}>Lease Capital Overview</span>
                            <div className="mt-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Lease Capital</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{(leases?.totalLeaseDeposits || 0).toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                                    Lease capital is held as a refundable security. It is excluded from monthly yield efficiency to maintain fiscal accuracy.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-12 mt-16 border-t border-slate-200 dark:border-white/5 pt-16">
                        <div className="space-y-2">
                            <p className={METRIC_LABEL}>Registry Occupancy</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white italic">{stats.occupancy}%</p>
                        </div>
                        <div className="space-y-2">
                            <p className={METRIC_LABEL}>Liquidity Collection</p>
                            <p className={`text-4xl font-black italic ${stats.collectionRate > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.collectionRate}%</p>
                        </div>
                        <div className="space-y-2">
                            <p className={METRIC_LABEL}>Asset Count</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white italic">{stats.totalUnits}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-4 space-y-10">
                    <div className={`${BENTO_CARD} p-12 bg-indigo-50 dark:bg-white/[0.03] border-indigo-200 dark:border-emerald-500/20 group cursor-pointer hover:bg-indigo-100 dark:hover:bg-white/[0.05]`} onClick={() => setIsCollectionsActive(true)}>
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <Icons.Activity size={32} />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight italic">Collections<br />Commander</h4>
                        <p className="mt-4 text-[11px] font-black text-slate-500 uppercase tracking-widest opacity-60">Verify 4-Pillar Utility Health</p>
                    </div>

                    <div className={`${BENTO_CARD} p-12 bg-gradient-to-br from-amber-400 to-amber-500 border-none group cursor-pointer shadow-2xl shadow-amber-500/20`} onClick={() => onNavigate('assets')}>
                        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-inner">
                            <Icons.Plus className="text-white" size={32} />
                        </div>
                        <h4 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-tight italic">Expansion<br />Protocols</h4>
                        <p className="mt-4 text-[11px] font-black text-slate-900/60 uppercase tracking-widest">Deploy New Property Shield</p>
                    </div>
                </div>

                <div className={`${BENTO_CARD} md:col-span-12 p-16 bg-slate-50 dark:bg-[#0a0c10]`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-6">
                            {unitRevenues.length > 0 ? (
                                <UnitRevenueList unitRevenues={unitRevenues.filter(u => dashboardMode === 'ALL' || u.agreementType === dashboardMode)} />
                            ) : (
                                <div className="animate-pulse space-y-6">
                                    <div className="h-8 w-48 bg-slate-200 dark:bg-white/5 rounded-full" />
                                    <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-[3rem]" />
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-6 flex flex-col justify-between space-y-12">
                            {trends ? (
                                <HistoricalTrendsChart data={trends.historicalRevenue} />
                            ) : (
                                <div className="h-48 bg-slate-200 dark:bg-white/5 rounded-[3rem] animate-pulse" />
                            )}
                            <BudgetExplainer />
                        </div>
                    </div>
                </div>

                <div className={`${BENTO_CARD} md:col-span-7 p-16 bg-violet-50 dark:bg-[#0a0c10]`}>
                    <ProfitFlow revenue={metrics?.monthlyGross || 0} mode={dashboardMode} />
                </div>

                <div className={`${BENTO_CARD} md:col-span-5 p-16 bg-sky-50 dark:bg-[#0a0c10]`}>
                    <IncomePlanner currentMonthly={metrics?.monthlyGross || 0} mode={dashboardMode} />
                </div>

                <div className={`${BENTO_CARD} md:col-span-12 p-16 bg-rose-50 dark:bg-white/[0.01]`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-amber-400 border border-white/5">
                                    <Icons.Shield size={32} />
                                </div>
                                <h4 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight italic">Watchtower<br />Command Center</h4>
                            </div>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed opacity-80 italic">Real-time surveillance matrix with autonomous AI detection arrays for your core estate assets.</p>
                            <button className="px-12 py-6 bg-white text-black rounded-3xl font-black uppercase text-[12px] tracking-[0.2em] hover:bg-amber-400 transition-all shadow-2xl active:scale-95">Acknowledge Link Access</button>
                        </div>
                        {properties.length > 0 ? (
                            <SecurityWidget propertyId={properties[0].id} />
                        ) : (
                            <div className="h-80 bg-white/5 rounded-[4rem] border border-white/5 border-dashed" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
