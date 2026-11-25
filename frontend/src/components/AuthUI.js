'use client';
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Snowflake, ShieldCheck, Truck, GraduationCap, AlertCircle, Check, Loader2 } from 'lucide-react';
import { pwChecks, pwScore } from '@/lib/validators';

export function useSearchSuffix() {
    const [s, setS] = useState('');
    useEffect(() => setS(window.location.search), []);
    return s;
}

export function BrandLogo({ light }) {
    return (
        <div className="flex items-center gap-2 leading-none">
            <Snowflake className={`h-9 w-9 ${light ? 'text-sky-300' : 'text-blue-600'}`} />
            <div>
                <div className={`text-3xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-[#0b2a5b]'}`}>BALOTHIA</div>
                <div className={`text-xs font-medium tracking-[0.25em] ${light ? 'text-orange-300' : 'text-orange-600'}`}>REFRIGERATION</div>
            </div>
        </div>
    );
}

const PERKS = [
    [GraduationCap, 'Designed for child education', 'Smart learning toys, kits and robots'],
    [ShieldCheck, 'Safe & non-toxic products', '100% original, quality checked'],
    [Truck, 'Free delivery above ₹999', 'Fast and reliable shipping'],
];

export function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
            <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b2a5b] via-[#123a85] to-[#1d4ed8] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5" />
                <div className="relative"><BrandLogo light /></div>
                <div className="relative">
                    <p className="text-5xl">🤖 🔬 🧩</p>
                    <h2 className="mt-4 text-4xl font-black leading-tight">LEARN. PLAY.<br />GROW EVERY DAY!</h2>
                    <p className="mt-3 max-w-sm text-blue-100">Electronic toys &amp; games for child education, loved by kids and trusted by parents.</p>
                    <ul className="mt-8 space-y-4">
                        {PERKS.map(([Icon, t, s]) => (
                            <li key={t} className="flex items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15"><Icon size={20} /></span>
                                <span><span className="block text-sm font-semibold">{t}</span><span className="text-xs text-blue-200">{s}</span></span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-xs text-blue-200">© {new Date().getFullYear()} Balothia Refrigeration · Jaipur, Rajasthan</p>
            </aside>

            <main className="flex items-center justify-center bg-slate-50 px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="mb-6 flex justify-center lg:hidden"><BrandLogo /></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="text-2xl font-extrabold text-[#0b2a5b]">{title}</h1>
                        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                        <div className="mt-6">{children}</div>
                    </div>
                    {footer && <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>}
                </div>
            </main>
        </div>
    );
}

export function Field({ label, icon: Icon, prefix, error, type = 'text', ...props }) {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';
    return (
        <div>
            {label && <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>}
            <div
                className={`flex items-center gap-2 rounded-lg border bg-white px-3 transition focus-within:ring-2 ${error ? 'border-red-400 focus-within:ring-red-100' : 'border-slate-300 focus-within:border-blue-600 focus-within:ring-blue-100'
                    }`}
            >
                {Icon && <Icon size={18} className="shrink-0 text-slate-400" />}
                {prefix && <span className="border-r pr-2 text-sm font-semibold text-slate-500">{prefix}</span>}
                <input
                    {...props}
                    type={isPw && show ? 'text' : type}
                    aria-invalid={!!error}
                    className="w-full bg-transparent py-3 text-sm outline-none"
                />
                {isPw && (
                    <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="shrink-0 text-slate-400 transition hover:text-slate-700">
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} /> {error}</p>
            )}
        </div>
    );
}

export function SubmitBtn({ busy, children }) {
    return (
        <button disabled={busy} className="btn w-full !py-3">
            {busy && <Loader2 size={18} className="animate-spin" />}
            {children}
        </button>
    );
}

export function ServerError({ msg }) {
    if (!msg) return null;
    return (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {msg}
        </div>
    );
}

export function PasswordStrength({ value }) {
    if (!value) return null;
    const s = pwScore(value);
    const c = pwChecks(value);
    const labels = ['Weak', 'Weak', 'Okay', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-600'];
    const items = [[c.length, '8+ characters'], [c.letter, 'Letter'], [c.number, 'Number'], [c.special, 'Special (!@#)']];
    return (
        <div className="mt-2">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < s ? colors[s] : 'bg-slate-200'}`} />)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Strength: <b>{labels[s]}</b></p>
            <ul className="mt-1 grid grid-cols-2 gap-x-3 text-xs">
                {items.map(([ok, t]) => (
                    <li key={t} className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-slate-400'}`}><Check size={12} /> {t}</li>
                ))}
            </ul>
        </div>
    );
}

export function OtpInput({ value, onChange, hasError }) {
    const refs = useRef([]);
    const set = (i, v) => { const n = [...value]; n[i] = v; onChange(n); };

    const onPaste = (e) => {
        const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!t) return;
        e.preventDefault();
        onChange(Array.from({ length: 6 }, (_, i) => t[i] || ''));
        refs.current[Math.min(t.length, 5)]?.focus();
    };

    return (
        <div className="flex justify-between gap-2" onPaste={onPaste}>
            {value.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => (refs.current[i] = el)}
                    value={d}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    autoFocus={i === 0}
                    aria-label={`OTP digit ${i + 1}`}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        set(i, v);
                        if (v && i < 5) refs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
                        if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
                        if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
                    }}
                    className={`h-12 w-full rounded-lg border text-center text-lg font-bold outline-none transition focus:ring-2 ${hasError ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                        }`}
                />
            ))}
        </div>
    );
}