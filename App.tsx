
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserRole, UserSession, MaintenanceTicket, TicketStatus,
  Property, Unit, UnitStatus, BillType
} from './types';
import { Icons, COLORS } from './constants';
import { generateMaintenanceAdvice } from './services/geminiService';
import { api } from './services/apiService';

import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { OwnerDashboard } from './components/OwnerDashboard';
import { TenantDashboard } from './components/TenantDashboard';
import { OwnerOverview } from './components/OwnerOverview';
import { PropertyDetailView } from './components/PropertyDetailView';
import { UnitDetailView } from './components/UnitDetailView';
import { SafePapersView } from './components/SafePapersView';
import { MaintenanceView } from './components/MaintenanceView';
import { InventoryView } from './components/InventoryView';
import { FinanceView } from './components/FinanceView';
import { MySanctuaryView } from './components/MySanctuaryView';
import { TenantMyUnitView } from './components/TenantMyUnitView';
import AuthPage from './components/AuthPage';
import { NotificationBell } from './components/NotificationBell';

export { Icons };

// ═══════════════════════════════════════════════════════════
//  API & SESSION ENGINE
// ═══════════════════════════════════════════════════════════

const TOKEN_KEY = 'rentsafe_jwt';
const SESSION_KEY = 'rentsafe_session';

function saveSession(token: string, profile: UserSession) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

function loadSession(): { token: string | null; session: UserSession | null } {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const raw = sessionStorage.getItem(SESSION_KEY);
  const session = raw ? JSON.parse(raw) as UserSession : null;
  return { token, session };
}

function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ═══════════════════════════════════════════════════════════
//  THEME ENGINE
// ═══════════════════════════════════════════════════════════

function getInitialTheme(): 'light' | 'dark' {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(t: 'light' | 'dark') {
  const root = document.documentElement;
  if (t === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
  localStorage.setItem('theme', t);
}

// ═══════════════════════════════════════════════════════════
//  UI PRIMITIVES & COMPONENTS
// ═══════════════════════════════════════════════════════════

export const BENTO_CARD = "bg-white dark:bg-[#0f1419] rounded-[4rem] border border-slate-200 dark:border-white/10 transition-all duration-700 hover:bg-slate-50 dark:hover:bg-[#141a22] hover:border-slate-300 dark:hover:border-white/15 overflow-hidden relative group shadow-sm dark:shadow-none";
export const METRIC_LABEL = "text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 mb-2 block";
export const ICON_GLOW = "w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center transition-all duration-500 border border-slate-200 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 group-hover:border-slate-300 dark:group-hover:border-white/20";

export const PulseIndicator = ({ color = "bg-amber-500" }: { color?: string }) => (
  <div className="flex items-center gap-2">
    <div className={`relative flex h-2 w-2`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
    </div>
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ">Live Pulse</span>
  </div>
);

export const Sparkline = ({ data, color, showMarketMatch }: { data: number[], color: string, showMarketMatch?: boolean }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max - min) || 1;
  const width = 100;
  const height = 30;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' L ');
  return (
    <div className="relative w-full h-8">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <path d={`M 0,${height - ((data[0] - min) / range) * height} L ${points}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {showMarketMatch && (
          <path d={`M 0,${height * 0.4} L ${width},${height * 0.2}`} fill="none" stroke={color} strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
        )}
      </svg>
    </div>
  );
};

export const ProfitFlow = ({ revenue, mode = 'RENTAL' }: { revenue: number, mode?: 'RENTAL' | 'LEASE' | 'ALL' }) => {
  const netProfit = revenue * 0.75;
  const maintenance = revenue * 0.15;
  const operations = revenue * 0.10;

  return (
    <div className="space-y-8 animate-reveal">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
        Fixed demo split (75% / 15% / 10%) for visualization—not your actual books.
      </p>
      <div className="flex justify-between items-end">
        <div>
          <span className={METRIC_LABEL}>Profit flow (illustrative)</span>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mt-1">{mode === 'LEASE' ? 'Capital reserve' : 'Budget breakdown'}</h4>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Gross Revenue</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative h-12 w-full bg-white/5 rounded-3xl flex overflow-hidden border border-white/5 p-1.5 shadow-inner group cursor-pointer">
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl relative transition-all duration-500 hover:brightness-110 flex items-center px-4 overflow-hidden" style={{ width: '75%' }}>
          <span className="text-black font-black text-[10px] tracking-widest uppercase z-10 whitespace-nowrap hidden sm:block">Net Profit</span>
          <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
        </div>
        <div className="h-full bg-slate-600/80 rounded-2xl ml-1 transition-all duration-500 hover:bg-slate-500 flex items-center justify-center overflow-hidden" style={{ width: '15%' }}>
          <Icons.Shield className="text-slate-900 opacity-50" size={14} />
        </div>
        <div className="h-full bg-slate-800/80 rounded-2xl ml-1 transition-all duration-500 hover:bg-slate-700" style={{ width: '10%' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-amber-400/10 rounded-3xl border border-amber-400/20 group hover:bg-amber-400/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Sample net (75%)</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

        <div className="p-5 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-white/5 group hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sample reserve (15%)</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{maintenance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

        <div className="p-5 bg-rose-50 dark:bg-slate-900/50 rounded-3xl border border-rose-100 dark:border-white/5 group hover:bg-rose-100 dark:hover:bg-slate-800/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sample ops (10%)</span>
          </div>
          <p className="text-xl font-black text-slate-400 tracking-tighter italic">₹{operations.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="flex items-start gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
          <Icons.ShieldCheck size={20} />
        </div>
        <div>
          <h5 className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-1">
            {mode === 'LEASE' ? 'Lease Capital Integrity Active' : 'Asset Longevity Protection Active'}
          </h5>
          <p className="text-[10px] text-emerald-500/70 font-bold leading-relaxed uppercase tracking-wider">
            {mode === 'LEASE' 
              ? 'Example messaging only. Real lease accounting depends on your agreements and local rules.'
              : `Example: ₹${maintenance.toLocaleString(undefined, { maximumFractionDigits: 0 })} shown from the illustrative 15% slice—not an automated bank transfer.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export const IncomePlanner = ({ currentMonthly, mode = 'RENTAL' }: { currentMonthly: number, mode?: 'RENTAL' | 'LEASE' | 'ALL' }) => {
  const projectedYear1 = currentMonthly * 1.05;
  const projectedYear3 = currentMonthly * 1.15;
  const projectedYear5 = currentMonthly * 1.25;

  return (
    <div className="space-y-8 animate-reveal h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
            <span className={METRIC_LABEL}>Income forecast (sample)</span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Active Projection</span>
        </div>
        <h4 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Future Vision</h4>
        <p className="text-sm text-slate-400 mt-4 leading-relaxed font-medium pr-4">
          {mode === 'LEASE' 
            ? 'Lease agreements often mean a larger upfront deposit but steadier monthly cash flow. Use this projection as a planning aid—not investment advice.'
            : 'Sample projection assumes about 5% annual growth for illustration. Replace with your market data when available.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[
          { year: 'Year 1', amount: projectedYear1, growth: '+5%', desc: 'Base escalation applied' },
          { year: 'Year 3', amount: projectedYear3, growth: '+15%', desc: 'Market adjustment' },
          { year: 'Year 5', amount: projectedYear5, growth: '+25%', desc: 'Compounded yield' }
        ].map((proj, i) => {
          const plannerTints = [
            'bg-sky-50 dark:bg-white/[0.02] border-sky-100 dark:border-white/5 hover:bg-sky-100 dark:hover:bg-white/[0.05]',
            'bg-indigo-50 dark:bg-white/[0.02] border-indigo-100 dark:border-white/5 hover:bg-indigo-100 dark:hover:bg-white/[0.05]',
            'bg-violet-50 dark:bg-white/[0.02] border-violet-100 dark:border-white/5 hover:bg-violet-100 dark:hover:bg-white/[0.05]',
          ];
          return (<div key={i} className={`p-6 border rounded-3xl transition-all group flex flex-col justify-between h-40 ${plannerTints[i]}`}>
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{proj.year}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-2">₹{proj.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Icons.TrendingUp className="text-emerald-500" size={14} />
                    <span className="text-[11px] font-black text-emerald-500">{proj.growth}</span>
                </div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity">{proj.desc}</p>
            </div>
          </div>
          );
        })}
      </div>
      
      <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-start gap-5 shadow-2xl shadow-amber-500/5">
        <Icons.Zap className="text-amber-500 shrink-0 mt-1 animate-pulse" size={24} />
        <div>
            <h5 className="text-[11px] font-black uppercase text-amber-500 tracking-widest mb-2">Strategic Insight</h5>
            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider leading-relaxed">
                Example insight only. Actual results depend on occupancy, rent changes, and local market conditions.
            </p>
        </div>
      </div>
    </div>
  );
};

export const HomeHealthRing = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} className="stroke-white/5" strokeWidth="8" fill="transparent" />
        <circle cx="50" cy="50" r={radius} className="stroke-amber-400" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} fill="transparent" strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{score}</span>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vitality</span>
      </div>
    </div>
  );
};

export const LongevityTimeline = () => (
  <div className="space-y-8">
    <span className={METRIC_LABEL}>Asset Lifespan</span>
    <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Longevity Bar</h4>
    <div className="space-y-6">
      {[{ l: 'HVAC', p: 82 }, { l: 'Roof', p: 65 }].map((s, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span>{s.l} System</span><span>{s.p}% Vital</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${s.p}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RescueConsole = () => (
  <button className="w-full py-4 bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl transition-all">
    <Icons.AlertTriangle size={14} /> Emergency Rescue Console
  </button>
);

export const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
    <div className={`${BENTO_CARD} md:col-span-12 h-64 bg-slate-100`} />
    <div className={`${BENTO_CARD} md:col-span-8 h-80 bg-slate-100`} />
    <div className={`${BENTO_CARD} md:col-span-4 h-80 bg-slate-100`} />
  </div>
);

export const ThemeSwitcher = ({ theme, toggle }: { theme: 'light' | 'dark', toggle: () => void }) => (
  <button
    type="button"
    onClick={toggle}
    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    aria-pressed={theme === 'dark'}
    className="relative w-20 h-10 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center px-1 transition-all shadow-inner ring-1 ring-black/5 dark:ring-white/10"
  >
    <span className="sr-only">Toggle color theme</span>
    <div className={`w-8 h-8 rounded-full shadow-md transform transition-all duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-10 bg-slate-800 shadow-xl' : 'bg-white'}`}>
      {theme === 'dark' ? <Icons.Moon size={14} className="text-amber-400" /> : <Icons.Sun size={14} className="text-amber-500" />}
    </div>
  </button>
);

// ═══════════════════════════════════════════════════════════
//  MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<UserSession | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme());
    const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('rentsafe_jwt');
    const savedSessionStr = sessionStorage.getItem('rentsafe_session');
    const savedSession = savedSessionStr ? JSON.parse(savedSessionStr) : null;

    if (savedToken) {
      api.me(savedToken).then(data => {
        const freshSession: UserSession = {
          userId: data.id,
          role: data.userType as UserRole,
          name: data.name,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.mobileNumber
        };
        handleAuth(freshSession, savedToken);
      }).catch(() => {
        clearSession();
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuth = (newSession: UserSession, newToken: string) => {
    setSession(newSession);
    setToken(newToken);
    saveSession(newToken, newSession);
    setIsLoading(false);
  };

  const handleLogout = () => {
    setSession(null);
    setToken(null);
    clearSession();
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  if (!session) {
    return <AuthPage onAuth={handleAuth} theme={theme} toggleTheme={toggleTheme} />;
  }


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a0f] text-slate-900 dark:text-slate-100 flex font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Subtle mesh background */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-25">
        <div className="absolute top-0 right-0 w-[80rem] h-[80rem] bg-violet-100 dark:bg-violet-950/40 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[60rem] h-[60rem] bg-amber-100 dark:bg-amber-950/30 blur-[200px] rounded-full" />
      </div>

      <aside className="w-80 h-screen bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-md flex flex-col fixed left-0 top-0 z-50 border-r border-slate-200 dark:border-white/10 shadow-xl dark:shadow-black/40 overflow-y-auto custom-scrollbar">
        <div className="p-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 group cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
              <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform shrink-0">
                <Icons.Home className="text-slate-950" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white truncate">RentSafe</span>
            </div>
            <NotificationBell />
          </div>
        </div>

        <nav className="flex-1 px-8 space-y-3" aria-label="Main navigation">
          {[
            { id: 'dashboard', label: 'Overview', path: '/dashboard', icon: <Icons.Activity /> },
            { id: 'assets', label: session.role === UserRole.OWNER ? 'Properties' : 'My unit', path: '/assets', icon: <Icons.Home /> },
            { id: 'legal', label: 'Documents', path: '/papers', icon: <Icons.FileText /> },
            { id: 'maintenance', label: 'Maintenance', path: '/repair', icon: <Icons.Tool /> },
            { id: 'finance', label: 'Billing', path: '/finance', icon: <Icons.CreditCard /> },
          ].map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => {
                const ownerPropertyRoutes =
                  session.role === UserRole.OWNER &&
                  item.id === 'assets' &&
                  (location.pathname.startsWith('/owner/'));
                const navActive = isActive || ownerPropertyRoutes;
                return `w-full flex items-center gap-5 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${navActive ? 'bg-amber-400 text-black shadow-lg shadow-amber-200/80 dark:shadow-amber-900/30 translate-x-3' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`;
              }}
            >
              {({ isActive }) => {
                const ownerPropertyRoutes =
                  session.role === UserRole.OWNER &&
                  item.id === 'assets' &&
                  (location.pathname.startsWith('/owner/'));
                const navActive = isActive || ownerPropertyRoutes;
                return (
                <>
                  <span className={navActive ? 'animate-bounce' : ''}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                  </span>
                  {item.label}
                </>
                );
              }}
            </NavLink>
          ))}
        </nav>

        <div className="p-10 space-y-8">
          <div className="p-6 bg-amber-50 dark:bg-amber-400/10 rounded-3xl border border-amber-100 dark:border-amber-400/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-xs">
                {session.name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">{session.name || 'User'}</p>
                <p className="text-[8px] font-bold text-amber-700 dark:text-amber-400/90 uppercase mt-1">Signed in</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <ThemeSwitcher theme={theme} toggle={toggleTheme} />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="w-12 h-12 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 rounded-2xl transition-all"
            >
              <Icons.LogOut size={22} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-12 md:p-20 relative min-h-screen">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="animate-reveal">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={
                  session.role === UserRole.OWNER ? (
                    <OwnerOverview />
                  ) : (
                    <TenantDashboard onNavigate={(tab) => navigate(`/${tab === 'dashboard' ? 'dashboard' : tab === 'legal' ? 'papers' : tab === 'maintenance' ? 'repair' : tab}`)} />
                  )
                } />

                <Route path="/owner/properties/:propertyId" element={<PropertyDetailView />} />
                <Route path="/owner/units/:unitId" element={<UnitDetailView />} />

                <Route path="/papers" element={<SafePapersView session={session} />} />

                <Route path="/repair" element={<MaintenanceView session={session} />} />

                <Route path="/assets" element={
                  session.role === UserRole.OWNER ? (
                    <MySanctuaryView session={session} />
                  ) : (
                    <TenantMyUnitView />
                  )
                } />

                <Route path="/finance" element={<FinanceView session={session} />} />
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
