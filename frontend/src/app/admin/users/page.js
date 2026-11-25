'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, X, ChevronLeft, ChevronRight, Mail, User, Lock, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import { Field, PasswordStrength } from '@/components/AuthUI';
import { isEmail, isPhone, pwError } from '@/lib/validators';
import { ago, dateOnly } from '@/lib/format';

const TABS = [['', 'All'], ['user', 'Customers'], ['admin', 'Admins']];
const isNew = (d) => Date.now() - new Date(d).getTime() < 86400000;

function RolePill({ role }) {
    return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{role === 'admin' ? 'Admin' : 'Customer'}</span>;
}

function CreateModal({ onClose, onCreated }) {
    const [f, setF] = useState({ name: '', email: '', phone: '', password: '', role: 'admin' });
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const errors = {};
    if (f.name.trim().length < 2) errors.name = 'Enter the Full name.';
    if (!isEmail(f.email)) errors.email = 'Valid email.';
    if (!isPhone(f.phone)) errors.phone = 'Enter the 10 digit number required';
    const pe = pwError(f.password);
    if (pe) errors.password = pe;
    const bind = (k, tf = (v) => v) => ({
        value: f[k], error: touched[k] ? errors[k] : '',
        onChange: (e) => setF({ ...f, [k]: tf(e.target.value) }),
        onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    });

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, phone: true, password: true });
        if (Object.keys(errors).length) return;
        setBusy(true);
        try {
            await api('/admin/users', { method: 'POST', body: { ...f, email: f.email.trim(), name: f.name.trim() } });
            toast.success(f.role === 'admin' ? 'New admin ready' : 'Customer ready');
            onCreated(); onClose();
        } catch (err) { toast.error(err.message); }
        finally { setBusy(false); }
    };

    return (
        <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <form onSubmit={submit} noValidate className="anim-pop max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Create new User.</h2><button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X /></button></div>
                <div className="grid grid-cols-2 gap-2">
                    {[['admin', 'Admin'], ['user', 'Customer']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setF({ ...f, role: v })} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${f.role === v ? 'border-blue-700 bg-blue-50 text-blue-800' : 'hover:bg-slate-50'}`}>{l}</button>
                    ))}
                </div>
                <Field label="Full name" icon={User} placeholder="Poora naam" autoFocus {...bind('name')} />
                <Field label="Email" icon={Mail} type="email" placeholder="name@gmail.com" {...bind('email')} />
                <Field label="Mobile" prefix="+91" type="tel" inputMode="numeric" placeholder="10 digit" {...bind('phone', (v) => v.replace(/\D/g, '').slice(0, 10))} />
                <div><Field label="Password" icon={Lock} type="password" placeholder="Minimum 8 characters" autoComplete="new-password" {...bind('password')} /><PasswordStrength value={f.password} /></div>
                {f.role === 'admin' && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800"> Ensure the admin email is real and under your control (the 'forgot password' OTP will be sent to this address)..</p>}
                <button disabled={busy} className="btn w-full !py-3">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Ban raha hai…' : 'Create'}</button>
            </form>
        </div>
    );
}

function Users() {
    const sp = useSearchParams();
    const router = useRouter();
    const role = sp.get('role') || '';
    const q = sp.get('search') || '';
    const page = Number(sp.get('page') || 1);
    const qs = sp.toString();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(q);
    const [creating, setCreating] = useState(false);
    const closeCreate = useCallback(() => setCreating(false), []);
    useEffect(() => setSearch(q), [q]);

    const update = (obj) => {
        const p = new URLSearchParams(sp.toString());
        Object.entries(obj).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, v)));
        if (!('page' in obj)) p.delete('page');
        const s = p.toString();
        router.replace(s ? `/admin/users?${s}` : '/admin/users', { scroll: false });
    };
    useEffect(() => {
        const t = setTimeout(() => { if (search.trim() !== q) update({ search: search.trim() }); }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const load = useCallback(() => api(`/admin/users?limit=15&${qs}`).then(setData).catch((e) => toast.error(e.message)), [qs]);
    useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);
    useEffect(() => {
        const on = () => load();
        window.addEventListener('bt:admin-activity', on);
        return () => window.removeEventListener('bt:admin-activity', on);
    }, [load]);

    const items = data?.items || [];
    const c = data?.counts || {};
    const countOf = (v) => (v === '' ? (c.user || 0) + (c.admin || 0) : c[v] || 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div><h1 className="text-2xl font-extrabold text-[#0b2a5b]">Customers &amp; Admins</h1><p className="text-sm text-slate-500">Who ever registers or logs in will appear here.</p></div>
                <div className="flex w-full gap-2 sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Naam, email ya mobile…" className="input !pl-9 sm:!w-64" />
                    </div>
                    <button onClick={() => setCreating(true)} className="btn"><Plus size={16} /> Add</button>
                </div>
            </div>

            <div className="inline-flex rounded-xl border bg-white p-1 text-sm font-semibold">
                {TABS.map(([v, l]) => (
                    <button key={v} onClick={() => update({ role: v })} className={`rounded-lg px-4 py-1.5 transition ${role === v ? 'bg-[#0b2a5b] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {l} <span className={`ml-1 text-xs ${role === v ? 'text-white/70' : 'text-slate-400'}`}>{data ? countOf(v) : ''}</span>
                    </button>
                ))}
            </div>

            {/* Desktop table */}
            <div className={`card hidden overflow-x-auto transition-opacity md:block ${loading && data ? 'opacity-60' : ''}`}>
                <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr><th className="p-3">User</th><th className="p-3">Mobile</th><th className="p-3">Role</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Joined</th><th className="p-3">Last login</th></tr>
                    </thead>
                    <tbody>
                        {!data && [1, 2, 3, 4].map((i) => <tr key={i} className="border-t"><td colSpan={7} className="p-3"><div className="h-10 animate-pulse rounded bg-slate-100" /></td></tr>)}
                        {items.map((u) => (
                            <tr key={u._id} onClick={() => router.push(`/admin/users/${u._id}`)} className="cursor-pointer border-t transition hover:bg-blue-50/50">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-500 font-bold text-white">{u.name[0].toUpperCase()}</span>
                                        <div className="min-w-0"><p className="truncate font-semibold">{u.name} {isNew(u.createdAt) && <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">NEW</span>}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div>
                                    </div>
                                </td>
                                <td className="p-3">{u.phone || '—'}</td>
                                <td className="p-3"><RolePill role={u.role} /></td>
                                <td className="p-3">{u.orders}</td>
                                <td className="p-3 font-semibold">{inr(u.spent)}</td>
                                <td className="p-3 text-slate-600">{dateOnly(u.createdAt)}</td>
                                <td className="p-3 text-slate-600">{ago(u.lastLoginAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data && items.length === 0 && <p className="p-10 text-center text-slate-500">Not user found.</p>}
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
                {!data && [1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}
                {items.map((u) => (
                    <div key={u._id} onClick={() => router.push(`/admin/users/${u._id}`)} className="card cursor-pointer p-3 transition hover:border-blue-300 hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-500 text-lg font-bold text-white">{u.name[0].toUpperCase()}</span>
                            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.name} {isNew(u.createdAt) && <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">NEW</span>}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div>
                            <RolePill role={u.role} />
                        </div>
                        <div className="mt-3 flex justify-between border-t pt-2 text-xs text-slate-500">
                            <span>{u.orders} orders · {inr(u.spent)}</span><span>Login: {ago(u.lastLoginAt)}</span>
                        </div>
                    </div>
                ))}
                {data && items.length === 0 && <p className="py-10 text-center text-slate-500">Not user found.</p>}
            </div>

            {(data?.pages || 1) > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button disabled={page <= 1} onClick={() => update({ page: page - 1 })} className="grid h-9 w-9 place-items-center rounded-lg border bg-white hover:bg-blue-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
                    <span className="text-sm">Page {page} / {data.pages}</span>
                    <button disabled={page >= data.pages} onClick={() => update({ page: page + 1 })} className="grid h-9 w-9 place-items-center rounded-lg border bg-white hover:bg-blue-50 disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
            )}

            {creating && <CreateModal onClose={closeCreate} onCreated={load} />}
        </div>
    );
}

export default function AdminUsersPage() {
    return <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}><Users /></Suspense>;
}