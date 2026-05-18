
import React, { useState, useEffect } from 'react';
import { InventoryRecord, UserRole, UserSession } from '../types';
import { BENTO_CARD, METRIC_LABEL, Icons } from '../App';
import { api } from '../services/apiService';

interface InventoryViewProps {
    session: UserSession;
    unitId?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ session, unitId }) => {
    const [inventory, setInventory] = useState<InventoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeUnitId, setActiveUnitId] = useState<string | undefined>(unitId);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ itemName: '', quantity: 1, condition: 'NEW' });

    useEffect(() => {
        const init = async () => {
            if (!activeUnitId && session.role === UserRole.TENANT) {
                try {
                    const unit = await api.getMyUnit();
                    setActiveUnitId(unit.id);
                } catch (e) {
                    console.error("Failed to resolve tenant unit", e);
                }
            }
        };
        init();
    }, [unitId, session.role]);

    useEffect(() => {
        if (activeUnitId || session.role === UserRole.TENANT) {
            fetchInventory();
        } else {
            setIsLoading(false);
        }
    }, [activeUnitId, session.role]);

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            if (activeUnitId) {
                const data = await api.getInventoryByUnit(activeUnitId);
                setInventory(data);
            } else if (session.role === UserRole.TENANT) {
                const data = await api.getMyInventory();
                setInventory(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitId && session.role === UserRole.OWNER) return;
        try {
            await api.addItem(unitId || '', newItem);
            setIsAdding(false);
            setNewItem({ itemName: '', quantity: 1, condition: 'NEW' });
            fetchInventory();
        } catch (err) {
            console.error(err);
        }
    };

    const updateCondition = async (itemId: string, condition: string) => {
        try {
            await api.patchInventoryCondition(itemId, condition);
            fetchInventory();
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <div className="space-y-12 animate-pulse"><div className={`${BENTO_CARD} h-96 bg-slate-100 dark:bg-white/5`}></div></div>;

    return (
        <div className="space-y-12 animate-reveal">
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Asset Twin Architecture</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">
                        Inventory<br /><span className="text-amber-500 not-italic">Vault</span>
                    </h2>
                </div>
                {session.role === UserRole.OWNER && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-4 px-10 py-5 bg-amber-400 text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 hover:-translate-y-1 transition-all"
                    >
                        {isAdding ? <Icons.ArrowLeft size={16} /> : <Icons.Plus size={16} />}
                        {isAdding ? 'Cancel' : 'Catalog New Item'}
                    </button>
                )}
            </div>

            {isAdding && (
                <div className={`${BENTO_CARD} p-12 bg-purple-50 dark:bg-white/[0.02] border border-purple-100 dark:border-white/10 shadow-sm dark:shadow-none animate-reveal`}>
                    <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="space-y-4">
                            <label className={METRIC_LABEL}>Item Name</label>
                            <input
                                type="text"
                                value={newItem.itemName}
                                onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-[#0d1015] border-2 border-slate-300 dark:border-white/5 p-6 rounded-[1.5rem] outline-none text-slate-900 dark:text-white focus:border-amber-400 transition-colors placeholder:text-slate-600"
                                placeholder="e.g. Dyson Air Purifier"
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            <label className={METRIC_LABEL}>Quantity</label>
                            <input
                                type="number"
                                value={newItem.quantity}
                                onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 dark:bg-[#0d1015] border-2 border-slate-300 dark:border-white/5 p-6 rounded-[1.5rem] outline-none text-slate-900 dark:text-white focus:border-amber-400 transition-colors"
                                min="1"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-6 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all">
                            Register Asset
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {inventory.map((item, idx) => {
                    const cardTints = [
                        'bg-violet-50 border-violet-200 hover:bg-violet-100',
                        'bg-sky-50 border-sky-200 hover:bg-sky-100',
                        'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
                        'bg-rose-50 border-rose-200 hover:bg-rose-100',
                    ];
                    const tint = cardTints[idx % cardTints.length];
                    return (
                <div key={item.id} className={`rounded-[4rem] border p-10 group shadow-sm transition-all duration-500 relative overflow-hidden ${tint}`}>
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-all duration-500 border border-slate-200 dark:border-white/5">
                                <Icons.Package size={28} />
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.condition === 'MINT' || item.condition === 'NEW' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {item.condition}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">{item.itemName}</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity: {item.quantity}</p>
                        </div>

                        <div className="mt-10 pt-10 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <p className={METRIC_LABEL}>Last Audit</p>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.lastAudit || 'Never'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 hover:bg-amber-400 hover:text-black transition-all">
                                    <Icons.Camera size={16} />
                                </button>
                            </div>
                        </div>

                        {session.role === UserRole.TENANT && (
                            <div className="mt-8 flex gap-2">
                                <button
                                    onClick={() => updateCondition(item.id || '', 'WEAR_DETECTED')}
                                    className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-[8px] font-black uppercase tracking-widest border border-slate-300 hover:bg-rose-500 hover:text-white hover:border-transparent transition-all"
                                >
                                    Report Wear
                                </button>
                            </div>
                        )}
                    </div>
                    );
                })}

                {inventory.length === 0 && !isAdding && (
                    <div className="col-span-full py-40 text-center space-y-8 opacity-20">
                        <Icons.Package size={64} className="mx-auto text-slate-500" />
                        <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                            {session.role === UserRole.TENANT ? 'Awaiting Cataloging' : 'Vault Empty'}
                        </h3>
                        <p className="max-w-md mx-auto text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {session.role === UserRole.TENANT 
                                ? 'Your digital assets have not been cataloged yet. Please contact your property manager to sync the physical twin.'
                                : 'Begin by cataloging your first premium asset to establish the digital twin architecture.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
