import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ThemeSwitcher, Icons } from '../App';
import { API_BASE } from '../config/api';
import { getSignInCaptchaToken } from '../services/recaptcha';

const allowDemoOtp =
    import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_OTP === 'true';

interface AuthPageProps {
    onAuth: (session: any, token: string) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const FloatingInput = ({ label, type = 'text', value, onChange, error, id, required, children, min, max, colorScheme = '' }: any) => {
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const isRaised = focused || (value && value.toString().length > 0) || type === 'date';
    const inputType = (type === 'password' && visible) ? 'text' : type;

    return (
        <div className="relative group">
            <div className={`relative flex items-center border-[2px] rounded-2xl transition-all duration-500 ${colorScheme ? `field-${colorScheme}` : ''} ${error ? 'border-rose-400' : focused ? '' : !colorScheme ? 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1419]' : ''}`}>
                <input
                    id={id}
                    type={inputType}
                    value={value}
                    required={required}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    min={min}
                    max={max}
                    className="w-full px-5 pt-7 pb-3 bg-transparent text-slate-900 dark:text-slate-100 text-sm font-semibold outline-none"
                    placeholder=" "
                />
                <label htmlFor={id} className={`field-label absolute left-5 transition-all pointer-events-none ${isRaised ? 'top-2 text-[9px] font-black uppercase tracking-widest' : 'top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500'} ${!isRaised && !colorScheme ? 'text-slate-400 dark:text-slate-500' : ''}`}>{label}</label>
                {type === 'password' && (
                    <button type="button" onClick={() => setVisible(!visible)} className="pr-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        {visible ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                    </button>
                )}
                <div className="pr-4">{children}</div>
            </div>
            {error && <p className="mt-1 ml-2 text-[9px] font-black text-rose-500 uppercase tracking-widest animate-reveal">{error}</p>}
        </div>
    );
};

const AuthPage: React.FC<AuthPageProps> = ({ onAuth, theme, toggleTheme }) => {
    const [view, setView] = useState<'gateway' | 'auth'>('gateway');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [role, setRole] = useState(UserRole.OWNER);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [honeyPot, setHoneyPot] = useState('');
    const [isRobotChecked, setIsRobotChecked] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        mobileNumber: '',
        countryCode: '+91',
        location: '',
        gender: 'MALE',
        occupation: '',
        otherOccupation: '',
        dateOfBirth: '',
        captchaValue: '',
        captchaId: ''
    });

    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [captchaData, setCaptchaData] = useState({ id: '', code: '' });

    const fetchCaptcha = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/captcha`);
            if (!res.ok) {
                const data = await res.json();
                setError(data.message || 'Could not load verification code. Try again.');
                return;
            }
            const data = await res.json();
            setCaptchaData(data);
            updateForm('captchaId', data.id);
            setError('');
        } catch (e) { 
            console.error("Captcha fetch failed"); 
            setError('Cannot reach the server. Check your connection and try again.');
        }
    };

    const updateForm = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateMobile = (mobile: string) => /^\d{10}$/.test(mobile);
    
    // Password Strength Engine
    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: 'Unset', color: 'text-slate-500' };
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score < 2) return { score, label: 'Weak', color: 'text-rose-500' };
        if (score < 4) return { score, label: 'Medium', color: 'text-amber-500' };
        return { score, label: 'Strong', color: 'text-emerald-500' };
    };

    const pStrength = getPasswordStrength(formData.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (honeyPot) return;
        if (mode === 'signup') {
            if (!formData.captchaValue) {
                setError('Please complete the verification code.');
                return;
            }
            if (!isOtpVerified) {
                setError('Please verify your mobile number with the one-time code.');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            let data;

            if (mode === 'signin') {
                const captchaToken = await getSignInCaptchaToken();
                const res = await fetch(`${API_BASE}/auth/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        ...(captchaToken ? { captchaToken } : {}),
                    }),
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Invalid email or password.');
            } else {
                const res = await fetch(`${API_BASE}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, role })
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Registration could not be completed.');
            }

            onAuth({
                userId: data.id,
                role: data.userType as UserRole,
                name: data.name,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.mobileNumber,
                countryCode: data.countryCode,
                location: data.location,
                gender: data.gender,
                occupation: data.occupation,
                dateOfBirth: data.dateOfBirth
            }, data.token);

        } catch (err: any) {
            setError(err.message || 'Sign-in service is unavailable. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        setError('');
        if (step === 1) {
            if (!validateEmail(formData.email)) { setError('Enter a valid email address.'); return; }
            if (pStrength.score < 3) { setError('Use at least 8 characters with upper and lower case and a number.'); return; }
            if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
            setStep(2);
        } else if (step === 2) {
            if (!formData.firstName || !formData.lastName) { setError('First and last name are required.'); return; }
            if (!validateMobile(formData.mobileNumber)) { setError('Enter a valid 10-digit mobile number.'); return; }
            
            // Validate DOB year format
            if (formData.dateOfBirth) {
                const year = new Date(formData.dateOfBirth).getFullYear();
                const yMax = new Date().getFullYear();
                if (year > yMax || year < 1920) { setError(`Year of birth must be between 1920 and ${yMax}.`); return; }
            } else {
                setError('Date of birth is required.');
                return;
            }
            
            if (step === 2) fetchCaptcha();
            setStep(3);
        }
    };

    const handleSendOtp = () => {
        if (!allowDemoOtp) {
            setError(
                'SMS verification is not enabled. For production, connect an SMS provider on the server. For staging, set VITE_ALLOW_DEMO_OTP=true.'
            );
            return;
        }
        setOtpSent(true);
        setError('');
        if (import.meta.env.DEV) {
            console.log('[RentSafe demo OTP] Use 123456 for', formData.mobileNumber);
        }
    };

    const verifyOtp = () => {
        if (!allowDemoOtp) {
            setError('SMS verification is not enabled in this build.');
            return;
        }
        if (otpCode === '123456') {
            setIsOtpVerified(true);
            setError('');
        } else {
            setError('Invalid or expired code. Try again.');
        }
    };

    const openAuth = (selectedRole: UserRole, targetMode: 'signin' | 'signup') => {
        setRole(selectedRole);
        setMode(targetMode);
        setStep(1);
        setError('');
        setOtpSent(false);
        setOtpCode('');
        setIsOtpVerified(false);
        setView('auth');
    };

    if (view === 'gateway') {
        return (
            <div className="min-h-screen bg-white dark:bg-[#070a0f] text-slate-900 dark:text-slate-100 relative flex flex-col items-center justify-start pt-20 pb-12 px-8 overflow-hidden font-sans selection:bg-amber-400 selection:text-slate-950">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-40%] left-[-20%] w-[120rem] h-[120rem] bg-violet-100/60 dark:bg-violet-950/50 blur-[300px] rounded-full" />
                    <div className="absolute bottom-[-40%] right-[-20%] w-[120rem] h-[120rem] bg-amber-100/60 dark:bg-amber-950/40 blur-[300px] rounded-full" />
                </div>

                <div className="relative z-10 mb-12 animate-reveal">
                    <div className="px-6 py-2 border border-slate-200 dark:border-white/10 rounded-full bg-white/90 dark:bg-white/5 backdrop-blur-sm shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Rental management platform</span>
                        </div>
                    </div>
                </div>

                <div className="text-center relative z-10 mb-20 animate-reveal animation-delay-200">
                    <h1 className="text-[clamp(5rem,12vw,12rem)] font-black text-slate-900 dark:text-white tracking-[-0.04em] leading-none mb-10 drop-shadow-sm dark:drop-shadow-2xl italic">
                        RentSafe
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-500 dark:text-slate-400 text-xl font-medium leading-relaxed tracking-tight uppercase tracking-widest text-[12px] font-black">
                        Properties, tenants, and maintenance in one place
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl relative z-10 animate-reveal animation-delay-500">
                    <div className="group relative">
                        <div className="relative h-full bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/5 rounded-[4rem] p-16 flex flex-col transition-all duration-700 hover:bg-slate-50 dark:hover:bg-[#0f1218] hover:border-slate-300 dark:hover:border-white/10 overflow-hidden shadow-lg dark:shadow-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent transition-all opacity-0 group-hover:opacity-100" />
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-[1px] bg-amber-500/50" />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500">Property owner</span>
                            </div>
                            <h2 className="text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-12 uppercase italic tracking-tighter">
                                Landlord<br />
                                <span className="text-slate-500 dark:text-white/60">Portfolio</span>
                            </h2>
                            <div className="grid grid-cols-2 gap-4 mb-16 opacity-60 group-hover:opacity-100 transition-opacity">
                                {[
                                    { icon: <Icons.TrendingUp size={14} />, label: 'Asset Yield' },
                                    { icon: <Icons.ShieldCheck size={14} />, label: 'Verified' },
                                    { icon: <Icons.Zap size={14} />, label: 'Command' },
                                    { icon: <Icons.Globe size={14} />, label: 'Live Desk' }
                                ].map((badge, i) => (
                                    <div key={i} className="flex items-center gap-3 px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-amber-500">{badge.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto space-y-4">
                                <button onClick={() => openAuth(UserRole.OWNER, 'signin')} className="w-full py-7 bg-white dark:bg-amber-400 text-black rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all hover:bg-amber-400 dark:hover:bg-amber-300 hover:scale-[1.02] active:scale-95 shadow-xl">
                                    Sign in as owner
                                </button>
                                <button onClick={() => openAuth(UserRole.OWNER, 'signup')} className="w-full py-5 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-white/40 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all hover:border-slate-400 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white">
                                    Create owner account
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="group relative">
                        <div className="relative h-full bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/5 rounded-[4rem] p-16 flex flex-col transition-all duration-700 hover:bg-slate-50 dark:hover:bg-[#0f1218] hover:border-slate-300 dark:hover:border-white/10 overflow-hidden shadow-lg dark:shadow-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent transition-all opacity-0 group-hover:opacity-100" />
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-[1px] bg-indigo-500/50" />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Tenant</span>
                            </div>
                            <h2 className="text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-12 uppercase italic tracking-tighter">
                                Tenant<br />
                                <span className="text-slate-500 dark:text-white/60">Registry</span>
                            </h2>
                            <div className="grid grid-cols-2 gap-4 mb-16 opacity-60 group-hover:opacity-100 transition-opacity">
                                {[
                                    { icon: <Icons.Home size={14} />, label: 'Resident' },
                                    { icon: <Icons.CreditCard size={14} />, label: 'Settlements' },
                                    { icon: <Icons.Activity size={14} />, label: 'Safety' },
                                    { icon: <Icons.Key size={14} />, label: 'Passkey' }
                                ].map((badge, i) => (
                                    <div key={i} className="flex items-center gap-3 px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-indigo-400">{badge.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto space-y-4">
                                <button onClick={() => openAuth(UserRole.TENANT, 'signin')} className="w-full py-7 bg-white dark:bg-slate-100 text-black rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all hover:bg-slate-200 dark:hover:bg-white hover:scale-[1.02] active:scale-95 shadow-xl">
                                    Sign in as tenant
                                </button>
                                <button onClick={() => openAuth(UserRole.TENANT, 'signup')} className="w-full py-5 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-white/40 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all hover:border-slate-400 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white">
                                    Create tenant account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed top-12 right-12 z-50">
                    <ThemeSwitcher theme={theme} toggle={toggleTheme} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#070a0f] p-8 relative overflow-hidden font-sans uppercase text-slate-900 dark:text-slate-100">
            <div className="fixed top-8 right-8 z-50">
                <ThemeSwitcher theme={theme} toggle={toggleTheme} />
            </div>
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[60rem] h-[60rem] bg-violet-100 dark:bg-violet-950/40 blur-[150px] rounded-full" />
                <div className="absolute bottom-[10%] right-[10%] w-[40rem] h-[40rem] bg-amber-100 dark:bg-amber-950/30 blur-[150px] rounded-full" />
            </div>

            <div className="w-full max-w-2xl space-y-8 relative z-10 animate-reveal">
                <button type="button" onClick={() => setView('gateway')} className="flex items-center gap-3 text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors uppercase font-black text-[10px] tracking-widest mb-4">
                    <Icons.ArrowLeft size={16} />
                    Back
                </button>

                <div className="text-center">
                    <h1 className="text-8xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none mb-4">
                        Rent<span className="text-amber-500 not-italic">Safe</span>
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">
                        {mode === 'signin' ? `Sign in` : `Create account`}
                    </p>
                </div>

                <div className="bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/10 rounded-[4rem] p-16 shadow-xl dark:shadow-black/40">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <input type="text" value={honeyPot} onChange={e => setHoneyPot(e.target.value)} className="hidden" aria-hidden="true" />

                        {mode === 'signin' ? (
                            <div className="space-y-6">
                                <FloatingInput label="Email" value={formData.email} onChange={(v: string) => updateForm('email', v)} id="email" colorScheme="violet" />
                                <FloatingInput label="Password" value={formData.password} onChange={(v: string) => updateForm('password', v)} id="pass" type="password" colorScheme="rose" />
                                {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium normal-case px-1">
                                        Sign-in may send a reCAPTCHA v3 token to the server when your backend has verification enabled.
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {step === 1 && (
                                    <div className="space-y-8 animate-reveal">
                                        <FloatingInput label="REGISTER EMAIL ADDRESS" value={formData.email} onChange={(v: string) => updateForm('email', v)} id="reg-email" colorScheme="violet" />
                                        <div className="space-y-3">
                                            <FloatingInput label="CREATE PASSWORD" value={formData.password} onChange={(v: string) => updateForm('password', v)} id="reg-pass" type="password" colorScheme="rose" />
                                            <div className="flex justify-between items-center px-4">
                                                <span className="text-[8px] font-black tracking-widest text-slate-500 dark:text-slate-400">Password strength: <span className={pStrength.color}>{pStrength.label}</span></span>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`w-6 h-1 rounded-full transition-all ${i <= pStrength.score ? (pStrength.score > 2 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200 dark:bg-slate-600'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <FloatingInput label="CONFIRM PASSWORD" value={formData.confirmPassword} onChange={(v: string) => updateForm('confirmPassword', v)} id="reg-pass-confirm" type="password" colorScheme="rose" error={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Passwords do not match" : ""} />
                                        <button type="button" onClick={nextStep} className="w-full py-7 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-amber-400 hover:text-black dark:hover:bg-amber-400 transition-all">Continue</button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-reveal">
                                        {allowDemoOtp ? (
                                            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-[11px] font-semibold text-sky-900 dark:text-sky-100 normal-case leading-relaxed">
                                                <strong className="uppercase tracking-widest text-[10px]">Demo OTP</strong>
                                                <span className="block mt-2">No real SMS is sent. After &quot;Send OTP&quot;, enter <strong>123456</strong> to continue. For production, replace this with a real SMS provider and server checks.</span>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-semibold text-amber-900 dark:text-amber-100 normal-case">
                                                Mobile OTP is not available in this deployment without <code className="text-[10px]">VITE_ALLOW_DEMO_OTP=true</code> or an integrated SMS API.
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FloatingInput label="FIRST NAME" value={formData.firstName} onChange={(v: string) => updateForm('firstName', v)} id="fname" colorScheme="sky" />
                                            <FloatingInput label="LAST NAME" value={formData.lastName} onChange={(v: string) => updateForm('lastName', v)} id="lname" colorScheme="sky" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-1">
                                                <FloatingInput label="COUNTRY" value={formData.countryCode} onChange={(v: string) => updateForm('countryCode', v)} id="cc" colorScheme="sky" />
                                            </div>
                                            <div className="col-span-2 relative group">
                                                <FloatingInput label="MOBILE NUMBER (10-DIGITS)" value={formData.mobileNumber} onChange={(v: string) => updateForm('mobileNumber', v.replace(/\D/g, '').slice(0, 10))} id="mobile" colorScheme="emerald" error={formData.mobileNumber && formData.mobileNumber.length !== 10 ? "Min 10 Digits Required" : ""} />
                                                <button type="button" disabled={formData.mobileNumber.length !== 10 || otpSent} onClick={handleSendOtp} className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-400 text-black rounded-xl text-[8px] font-black uppercase tracking-widest disabled:opacity-20 hover:scale-105 transition-all">
                                                    {otpSent ? 'SENT' : 'SEND OTP'}
                                                </button>
                                            </div>
                                        </div>

                                        {otpSent && !isOtpVerified && (
                                            <div className="flex gap-4 animate-reveal">
                                                <div className="flex-1">
                                                    <FloatingInput label="6-DIGIT CODE" value={otpCode} onChange={(v: string) => setOtpCode(v)} id="otp" colorScheme="emerald" />
                                                </div>
                                                <button type="button" onClick={verifyOtp} className="w-32 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest">VERIFY</button>
                                            </div>
                                        )}

                                        {isOtpVerified && (
                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-3 animate-reveal">
                                                <Icons.ShieldCheck className="text-emerald-500" size={16} />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Mobile verified</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <FloatingInput label="DATE OF BIRTH (DOB)" value={formData.dateOfBirth} onChange={(v: string) => updateForm('dateOfBirth', v)} id="dob" type="date" colorScheme="amber" />
                                            </div>
                                            <div className="relative field-indigo border-2 rounded-2xl">
                                                <select
                                                    value={formData.gender}
                                                    onChange={e => updateForm('gender', e.target.value)}
                                                    className="w-full h-full bg-transparent border-0 rounded-2xl px-5 pt-7 pb-3 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all appearance-none"
                                                >
                                                    <option value="MALE">MALE</option>
                                                    <option value="FEMALE">FEMALE</option>
                                                    <option value="OTHER">NON-BINARY / OTHER</option>
                                                </select>
                                                <label className="field-label absolute left-5 top-2 text-[9px] font-black uppercase tracking-widest">GENDER</label>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button type="button" onClick={() => setStep(1)} className="flex-1 py-7 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black uppercase tracking-widest text-[10px]">Back</button>
                                            <button type="button" onClick={nextStep} className="flex-[2] py-7 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-amber-400 hover:text-black transition-all">Continue</button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-reveal">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="relative field-teal border-2 rounded-2xl">
                                                <select
                                                    value={formData.occupation}
                                                    onChange={e => updateForm('occupation', e.target.value)}
                                                    className="w-full h-full bg-transparent border-0 rounded-2xl px-5 pt-7 pb-3 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all appearance-none"
                                                >
                                                    <option value="">SELECT OCCUPATION</option>
                                                    <option value="Business Owner">BUSINESS OWNER</option>
                                                    <option value="Professional / IT">PROFESSIONAL / IT</option>
                                                    <option value="Public Servant">PUBLIC SERVANT</option>
                                                    <option value="Healthcare">HEALTHCARE</option>
                                                    <option value="Education">EDUCATION</option>
                                                    <option value="Self-Employed">SELF-EMPLOYED</option>
                                                    <option value="Others">OTHERS (SPECIFY)</option>
                                                </select>
                                                <label className="field-label absolute left-5 top-2 text-[9px] font-black uppercase tracking-widest">OCCUPATION</label>
                                            </div>
                                            {formData.occupation === 'Others' && (
                                                <FloatingInput label="SPECIFY OCCUPATION" value={formData.otherOccupation} onChange={(v: string) => updateForm('otherOccupation', v)} id="other-occ" colorScheme="teal" />
                                            )}
                                        </div>
                                        
                                        <FloatingInput label="LOCATION" value={formData.location} onChange={(v: string) => updateForm('location', v)} id="loc" colorScheme="fuchsia" />

                                        {/* Captcha Verification */}
                                        <div className="field-orange border-2 rounded-[3rem] p-10 space-y-8 relative group transition-all duration-500 shadow-md">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-700">Human Verification</h3>
                                                    <p className="text-[9px] text-orange-600/70 font-medium">Type the alphanumeric code below</p>
                                                </div>
                                                <button type="button" onClick={fetchCaptcha} className="p-3 bg-orange-100 rounded-xl hover:bg-orange-200 text-orange-600 transition-all">
                                                    <Icons.Activity size={18} />
                                                </button>
                                            </div>

                                            <div className="flex gap-6 items-center">
                                                <div className="flex-1 h-20 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-center relative overflow-hidden">
                                                     <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 rotate-12" />
                                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-indigo-500 -rotate-12" />
                                                     </div>
                                                     <div className="flex gap-2 select-none relative z-10">
                                                        {(captchaData.code || 'REFRESH').split('').map((char, i) => (
                                                            <span key={i} className="text-2xl font-black text-orange-800 italic drop-shadow-sm">
                                                                {char}
                                                            </span>
                                                        ))}
                                                     </div>
                                                </div>
                                                <div className="flex-[1.5]">
                                                    <FloatingInput label="ENTER CODE" value={formData.captchaValue} onChange={(v: string) => updateForm('captchaValue', v.toUpperCase())} id="cap-val" colorScheme="orange" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button type="button" onClick={() => setStep(2)} className="flex-1 py-7 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black uppercase tracking-widest text-[10px]">Back</button>
                                            <button type="submit" disabled={loading || !formData.captchaValue} className="flex-[2] py-7 bg-amber-400 text-black rounded-3xl font-black uppercase tracking-widest text-[11px] disabled:opacity-20 hover:scale-[1.02] active:scale-95 shadow-2xl">
                                                {loading ? 'Finalizing...' : `Sign Up`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="p-8 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black rounded-3xl uppercase tracking-widest animate-reveal">
                                <div className="flex items-center gap-4">
                                    <Icons.AlertTriangle size={20} />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {mode === 'signin' && (
                            <button type="submit" disabled={loading} className="w-full py-8 bg-amber-400 text-black rounded-3xl font-black uppercase tracking-widest text-[12px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60">
                                {loading ? 'Signing in…' : 'Sign in'}
                            </button>
                        )}
                    </form>
                </div>

                <div className="text-center pb-12">
                    <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStep(1); setError(''); }} className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
