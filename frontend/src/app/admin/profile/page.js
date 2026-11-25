'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User, Lock, Mail, ShieldCheck, CalendarDays, Clock, Loader2, IndianRupee, ShoppingBag, Users } from 'lucide-react';
import { api, inr } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Field, PasswordStrength, ServerError } from '@/components/AuthUI';
import { isPhone, pwError } from '@/lib/validators';
import { ago, dateOnly } from '@/lib/format';

function InfoForm({ user, updateUser }) {
    const [f, setF] = useState({ name: user.name || '', phone: user.phone || '' });
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');
    useEffect(() => setF({ name: user.name || '', phone: user.phone || '' }), [user.name, user.phone]);

    const errors = {};
    if (f.name.trim().length < 2) errors.name = 'Enter the Full name.';
    if (!isPhone(f.phone)) errors.phone = 'Enter the 10 digit Valid mobile.';
    const dirty = f.name.trim() !== (user.name || '') || f.phone !== (user.phone || '');

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, phone: true });
        if (Object.keys(errors).length || !dirty) return;
        setBusy(true); setServerError('');
        try {
            const d = await api('/auth/profile', { method: 'PUT', body: { name: f.name.trim(), phone: f.phone } });
            updateUser(d.user);
            toast.success('Profile updated!.');
        } catch (err) { setServerError(err.message); }
        finally { setBusy(false); }
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <ServerError msg={serverError} />
            <Field label="Full name" placeholder="Enter your full name." icon={User} value={f.name} error={touched.name ? errors.name : ''} onChange={(e) => setF({ ...f, name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, name: true }))} />
            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-3 text-sm text-slate-600"><Mail size={18} className="text-slate-400" /><span className="truncate">{user.email}</span><Lock size={12} className="ml-auto text-slate-400" /></div>
                <p className="mt-1 text-xs text-slate-400">Naya admin email chahiye to Customers page se naya admin banao.</p>
            </div>
            <Field label="Mobile" placeholder="Enter your Phone number." prefix="+91" type="tel" inputMode="numeric" value={f.phone} error={touched.phone ? errors.phone : ''} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} />
            <button disabled={!dirty || busy} className="btn !px-6 !py-3">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Saving…' : 'Save Changes'}</button>
        </form>
    );
}

function PasswordForm() {
    const EMPTY = { current: '', next: '', confirm: '' };
    const [f, setF] = useState(EMPTY);
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');
    const errors = {};
    if (!f.current) errors.current = 'Enter the Current password.';
    const ne = pwError(f.next);
    if (ne) errors.next = ne; else if (f.next === f.current) errors.next = 'Naya password purane se alag ho';
    if (!f.confirm) errors.confirm = 'Password dobara daalo'; else if (f.confirm !== f.next) errors.confirm = 'Password match nahi kar raha';
    const bind = (k) => ({
        value: f[k], error: touched[k] ? errors[k] : '',
        onChange: (e) => { setF({ ...f, [k]: e.target.value }); setServerError(''); },
        onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    });

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ current: true, next: true, confirm: true });
        if (Object.keys(errors).length) return;
        setBusy(true); setServerError('');
        try {
            await api('/auth/change-password', { method: 'PUT', body: { currentPassword: f.current, newPassword: f.next } });
            toast.success('This password has been changed 🔒');
            setF(EMPTY); setTouched({});
        } catch (err) { setServerError(err.message); }
        finally { setBusy(false); }
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <ServerError msg={serverError} />
            <Field label="Current password" icon={Lock} type="password"
                placeholder="Enter the Current password." autoComplete="current-password" {...bind('current')} />
            <div><Field label="New password" icon={Lock} type="password"
                placeholder="Enter the New password." autoComplete="new-password" {...bind('next')} /><PasswordStrength value={f.next} /></div>
            <Field label="Confirm new password" icon={Lock} type="password"
                placeholder="Enter the confirm password." autoComplete="new-password" {...bind('confirm')} />
            <button disabled={busy} className="btn !px-6 !py-3">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Updating…' : 'Update Password'}</button>
        </form>
    );
}

export default function AdminProfile() {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState(null);
    useEffect(() => { api('/admin/stats').then(setStats).catch(() => { }); }, []);
    if (!user) return null;

    return (
        <div className="space-y-5">
            <div className="card overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-[#0b2a5b] to-blue-600" />
                <div className="px-5 pb-5">
                    <div className="-mt-10 flex flex-wrap items-end gap-4">
                        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-indigo-600 text-3xl font-extrabold text-white ring-4 ring-white transition hover:scale-105">{user.name[0].toUpperCase()}</span>
                        <div className="min-w-0 pb-1">
                            <h1 className="truncate text-xl font-extrabold text-[#0b2a5b]">{user.name}</h1>
                            <p className="truncate text-sm text-slate-500">{user.email}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700"><ShieldCheck size={13} /> Admin</span>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600"><CalendarDays size={13} /> Member since {dateOnly(user.createdAt)}</span>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600"><Clock size={13} /> Last login {ago(user.lastLoginAt)}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    ['/admin/orders?status=counted', IndianRupee, 'Total revenue', stats ? inr(stats.totalRevenue) : '…'],
                    ['/admin/orders', ShoppingBag, 'Total orders', stats ? stats.totalOrders : '…'],
                    ['/admin/users?role=user', Users, 'Customers', stats ? stats.customers : '…'],
                ].map(([href, Icon, label, value]) => (
                    <Link key={label} href={href} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={18} /></span>
                        <span><span className="block text-xs text-slate-500">{label}</span><span className="text-lg font-extrabold">{value}</span></span>
                    </Link>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="card p-5"><h2 className="mb-4 text-lg font-bold text-[#0b2a5b]">Personal Information</h2><InfoForm user={user} updateUser={updateUser} /></section>
                <section className="card p-5"><h2 className="mb-4 text-lg font-bold text-[#0b2a5b]">Change Password</h2><PasswordForm /></section>
            </div>
        </div>
    );
}