'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    User, Lock, Mail, Package, Heart, LogOut, ShieldCheck, IndianRupee,
    ChevronRight, CalendarDays, Loader2, LayoutDashboard,
} from 'lucide-react';
import { api, inr } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Field, PasswordStrength, ServerError } from '@/components/AuthUI';
import { isPhone, pwError } from '@/lib/validators';

const tabCls = (active) =>
    `flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition lg:w-full ${active ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
    }`;

function StatCard({ href, icon: Icon, label, value, loading }) {
    return (
        <Link
            href={href}
            className="card group flex items-center gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
        >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-xs text-slate-500">{label}</span>
                {loading ? (
                    <span className="mt-1 block h-5 w-16 animate-pulse rounded bg-slate-200" />
                ) : (
                    <span className="block truncate text-lg font-extrabold text-slate-800">{value}</span>
                )}
            </span>
            <ChevronRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-700" />
        </Link>
    );
}

/* ---------------- Personal info ---------------- */
function PersonalInfo({ user, updateUser }) {
    const [f, setF] = useState({ name: user.name || '', phone: user.phone || '' });
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => { setF({ name: user.name || '', phone: user.phone || '' }); }, [user.name, user.phone]);

    const errors = {};
    if (f.name.trim().length < 2) errors.name = 'Give a poor name (at least 2 letters)';
    else if (!/^[\p{L} .'-]+$/u.test(f.name.trim())) errors.name = 'The name should contain only letters.';
    if (!f.phone) errors.phone = 'Enter the Mobile Number';
    else if (!isPhone(f.phone)) errors.phone = 'Entered a valid 10-digit mobile number';

    const dirty = f.name.trim() !== (user.name || '') || f.phone !== (user.phone || '');

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, phone: true });
        if (Object.keys(errors).length || !dirty) return;
        setBusy(true);
        setServerError('');
        try {
            const d = await api('/auth/profile', { method: 'PUT', body: { name: f.name.trim(), phone: f.phone } });
            updateUser(d.user);
            toast.success('Profile updated Successfully! ✅');
        } catch (err) {
            setServerError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <ServerError msg={serverError} />
            <Field
                label="Full name" icon={User} placeholder="Aapka poora naam" autoComplete="name"
                value={f.name} error={touched.name ? errors.name : ''}
                onChange={(e) => { setF({ ...f, name: e.target.value }); setServerError(''); }}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />

            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <Mail size={18} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate">{user.email}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400"><Lock size={12} /> Locked</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                    Contact support to change your email.</p>
            </div>

            <Field
                label="Mobile number" prefix="+91" type="tel" inputMode="numeric" placeholder="10 digit mobile number" autoComplete="tel-national"
                value={f.phone} error={touched.phone ? errors.phone : ''}
                onChange={(e) => { setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); setServerError(''); }}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            />

            <div className="flex flex-wrap items-center gap-3 pt-1">
                <button disabled={!dirty || busy} className="btn !px-6 !py-3">
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {busy ? 'Saving…' : 'Save Changes'}
                </button>
                {dirty && !busy && (
                    <button type="button" onClick={() => { setF({ name: user.name || '', phone: user.phone || '' }); setTouched({}); }} className="text-sm font-semibold text-slate-500 transition hover:text-slate-800">
                        Reset
                    </button>
                )}
            </div>
        </form>
    );
}

/* ---------------- Change password ---------------- */
function ChangePassword() {
    const EMPTY = { current: '', next: '', confirm: '' };
    const [f, setF] = useState(EMPTY);
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');

    const errors = {};
    if (!f.current) errors.current = 'Enter your current password';
    const ne = pwError(f.next);
    if (ne) errors.next = ne;
    else if (f.next === f.current) errors.next = 'The new password must be different from the old one.';
    if (!f.confirm) errors.confirm = 'Enter the password again';
    else if (f.confirm !== f.next) errors.confirm = 'The password does not match.';

    const bind = (k) => ({
        value: f[k],
        error: touched[k] ? errors[k] : '',
        onChange: (e) => { setF({ ...f, [k]: e.target.value }); setServerError(''); },
        onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    });

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ current: true, next: true, confirm: true });
        if (Object.keys(errors).length) return;
        setBusy(true);
        setServerError('');
        try {
            await api('/auth/change-password', { method: 'PUT', body: { currentPassword: f.current, newPassword: f.next } });
            toast.success('The password has been changed. 🔒');
            setF(EMPTY);
            setTouched({});
        } catch (err) {
            setServerError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className="max-w-md space-y-4">
            <ServerError msg={serverError} />
            <Field label="Current password" icon={Lock} type="password" placeholder="Current Password." autoComplete="current-password" {...bind('current')} />
            <div>
                <Field label="New password" icon={Lock} type="password" placeholder="Minimum 8 Characters Password." autoComplete="new-password" {...bind('next')} />
                <PasswordStrength value={f.next} />
            </div>
            <Field label="Confirm new password" icon={Lock} type="password" placeholder="Enter the new password again. " autoComplete="new-password" {...bind('confirm')} />
            <button disabled={busy} className="btn !px-6 !py-3">
                {busy && <Loader2 size={16} className="animate-spin" />}
                {busy ? 'Updating…' : 'Update Password'}
            </button>
        </form>
    );
}

/* ---------------- Page ---------------- */
export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const [tab, setTab] = useState('info');
    const [orders, setOrders] = useState(null);

    useEffect(() => {
        api('/orders/mine').then(setOrders).catch(() => setOrders([]));
    }, []);

    if (!user) return null;

    const initial = user.name?.[0]?.toUpperCase() || '?';
    const wishCount = user.wishlist?.length || 0;
    const spent = (orders || []).filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.totalPrice, 0);
    const since = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="wrap py-6 sm:py-8">
            {/* Top card */}
            <div className="card overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-[#0b2a5b] to-blue-600 sm:h-24" />
                <div className="px-5 pb-5">
                    <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-blue-700 text-3xl font-extrabold text-white ring-4 ring-white transition duration-300 hover:scale-105 sm:h-24 sm:w-24 sm:text-4xl">
                            {initial}
                        </div>
                        <div className="min-w-0 pb-1">
                            <h1 className="truncate text-xl font-extrabold text-[#0b2a5b] sm:text-2xl">{user.name}</h1>
                            <p className="truncate text-sm text-slate-500">{user.email}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {user.role === 'admin' && (
                            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700"><ShieldCheck size={13} /> Admin</span>
                        )}
                        {since && (
                            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600"><CalendarDays size={13} /> Member since {since}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <StatCard href="/orders" icon={Package} label="My Orders" value={orders?.length ?? 0} loading={orders === null} />
                <StatCard href="/wishlist" icon={Heart} label="Wishlist" value={`${wishCount} item${wishCount === 1 ? '' : 's'}`} />
                <StatCard href="/orders" icon={IndianRupee} label="Total Spent" value={inr(spent)} loading={orders === null} />
            </div>

            {/* Sidebar + content */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
                <aside className="card h-fit p-2 lg:sticky lg:top-40">
                    <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                        <button onClick={() => setTab('info')} className={tabCls(tab === 'info')}><User size={18} /> Personal Info</button>
                        <button onClick={() => setTab('password')} className={tabCls(tab === 'password')}><Lock size={18} /> Change Password</button>
                        <Link href="/orders" className={tabCls(false)}><Package size={18} /> My Orders</Link>
                        <Link href="/wishlist" className={tabCls(false)}><Heart size={18} /> My Wishlist</Link>
                        {user.role === 'admin' && (
                            <Link href="/admin" className={`${tabCls(false)} !text-blue-700`}><LayoutDashboard size={18} /> Admin Panel</Link>
                        )}
                        <button onClick={logout} className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 lg:mt-1 lg:w-full lg:border-t lg:rounded-t-none">
                            <LogOut size={18} /> Logout
                        </button>
                    </nav>
                </aside>

                <section key={tab} className="anim-fade card p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-[#0b2a5b]">{tab === 'info' ? 'Personal Information' : 'Change Password'}</h2>
                    <p className="mb-5 mt-1 text-sm text-slate-500">
                        {tab === 'info' ? 'Apna naam aur mobile number yahan update karo.' : 'Account safe rakhne ke liye strong password rakho.'}
                    </p>
                    {tab === 'info' ? <PersonalInfo user={user} updateUser={updateUser} /> : <ChangePassword />}
                </section>
            </div>
        </div>
    );
}