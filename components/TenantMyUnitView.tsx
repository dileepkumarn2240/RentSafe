import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../services/apiService';
import { InventoryRecord, Unit } from '../types';
import { BENTO_CARD, METRIC_LABEL, Icons, PulseIndicator } from '../App';
import { ErrorBanner } from './ErrorBanner';

type Category = 'ALL' | 'KITCHEN' | 'ELECTRICAL' | 'FURNITURE' | 'PAINT' | 'PLUMBING' | 'OTHER';

function categorize(name: string): Category {
  const s = name.toLowerCase();
  if (/(kitchen|sink|chimney|stove|hob|counter|cabinet|fridge|refrigerator|microwave)/.test(s)) return 'KITCHEN';
  if (/(fan|light|switch|socket|mcb|wire|ac|hvac|geyser|heater)/.test(s)) return 'ELECTRICAL';
  if (/(sofa|bed|mattress|table|chair|wardrobe|cupboard|curtain)/.test(s)) return 'FURNITURE';
  if (/(paint|wall|ceiling|putty|primer)/.test(s)) return 'PAINT';
  if (/(tap|toilet|flush|shower|plumbing|pipe|drain)/.test(s)) return 'PLUMBING';
  return 'OTHER';
}

function conditionRank(c: InventoryRecord['condition'] | string | undefined) {
  const v = String(c || '').toUpperCase();
  // Worst first.
  if (v === 'CRITICAL' || v === 'WORN') return 0;
  if (v === 'WEAR_DETECTED') return 1;
  if (v === 'GOOD') return 2;
  if (v === 'MINT') return 3;
  if (v === 'NEW') return 4;
  return 5;
}

export const TenantMyUnitView: React.FC = () => {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('ALL');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await api.getMyUnit();
      const inv = await api.getMyInventory();
      setUnit(u);
      setItems(inv);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === 'NO_UNIT') {
        setError('No unit assigned yet. Ask your landlord to complete onboarding.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load unit details');
      }
      setUnit(null);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const filtered = items.filter(it => category === 'ALL' || categorize(it.itemName) === category);
    const sorted = [...filtered].sort((a, b) => {
      const ra = conditionRank(a.condition);
      const rb = conditionRank(b.condition);
      return (ra - rb) || a.itemName.localeCompare(b.itemName);
    });
    const map: Record<string, InventoryRecord[]> = {};
    for (const it of sorted) {
      const cat = categorize(it.itemName);
      map[cat] = map[cat] || [];
      map[cat].push(it);
    }
    return map;
  }, [items, category]);

  if (isLoading) return <div className="space-y-12 animate-pulse"><div className={`${BENTO_CARD} h-96 bg-slate-100 dark:bg-white/5`}></div></div>;
  if (error) return <div className="max-w-2xl"><ErrorBanner message={error} onRetry={load} /></div>;

  return (
    <div className="space-y-12 animate-reveal">
      <div className="flex justify-between items-end gap-8">
        <div className="min-w-0">
          <span className={METRIC_LABEL}>My unit</span>
          <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic truncate">
            {unit?.name || 'Unit'}<br /><span className="text-amber-500 not-italic">Checklist</span>
          </h2>
          <div className="mt-6">
            <PulseIndicator color="bg-emerald-500" />
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all"
        >
          Refresh
        </button>
      </div>

      {unit && (
        <div className={`${BENTO_CARD} p-10 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
          <span className={METRIC_LABEL}>Unit basics</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <p className={METRIC_LABEL}>Type</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{unit.unitType || '—'}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <p className={METRIC_LABEL}>Furnishing</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{unit.furnishedStatus || '—'}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <p className={METRIC_LABEL}>Sq ft</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{unit.sqFt ?? '—'}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <p className={METRIC_LABEL}>Bathrooms</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{unit.bathrooms ?? '—'}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`${BENTO_CARD} p-8 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
        <span className={METRIC_LABEL}>Filter by category</span>
        <div className="flex flex-wrap gap-2 mt-4">
          {(['ALL', 'KITCHEN', 'ELECTRICAL', 'FURNITURE', 'PAINT', 'PLUMBING', 'OTHER'] as Category[]).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                category === c
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              {c === 'ALL' ? 'All' : c.replace('_', ' ')}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Sorted by condition (worst first), then name. This view is the tenant-facing move-in checklist; owners should manage details in the unit inspection workflow.
        </p>
      </div>

      {items.length === 0 ? (
        <div className={`${BENTO_CARD} p-16 text-center opacity-70`}>
          <Icons.Package size={56} className="mx-auto text-slate-400" />
          <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mt-6">No checklist available</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mt-3">
            Your landlord hasn’t cataloged the unit items/conditions yet.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat} className={`${BENTO_CARD} p-10 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={METRIC_LABEL}>Category</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{cat}</h3>
                </div>
                <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  {list.length} item(s)
                </span>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {list.map(it => (
                  <div key={it.id} className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{it.itemName}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Qty {it.quantity}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        conditionRank(it.condition) <= 1
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {it.condition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

