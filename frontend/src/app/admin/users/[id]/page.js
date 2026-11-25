'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, CalendarDays, Clock, LogIn, Heart, ShieldCheck, ShieldOff, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { useAuth } from '@/context/AuthContext';
import { ago, dateOnly, dateTime, shortId, STATUS_PILL } from '@/lib/format';

const Stat = ({ icon: Icon, label, value }) => (
    <div className="card flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={18} /></span>
        <div><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-extrabold">{value}</p></div>
    </div>
);

export default function UserDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { user: me } = useAuth();
    const [d, setD] = useState(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => api(`/admin/users/${id}`).then(setD).catch((e) => setErr(e.message)), [id]);
    useEffect(() => { load(); }, [load]);

    if (err) return <div className="py-20 text-center"><p className="text-slate-600">{err}</p><Link href="/admin/users" className="btn mt-4"><ArrowLeft size={16} /> Back</Link></div>;
    if (!d) return <div className="space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div>;

    const { user: u, orders, stats } = d;
    const isMe = me?._id === u._id;
    const isAdmin = u.role === 'admin';

    const toggleRole = async () => {
        const to = isAdmin ? 'user' : 'admin';
        if (!confirm(isAdmin ? `${u.name} ko admin se hatana hai?` : `${u.name} ko ADMIN banana hai? Uske paas poora admin access hoga.`)) return;
        setBusy(true);
        try { await api(`/admin/users/${id}/role`, { method: 'PATCH', body: { role: to } }); toast.success(to === 'admin' ? 'Ab ye admin hai' : 'Admin access hata diya'); await load(); }
        catch (e) { toast.error(e.message); }
        finally { setBusy(false); }
    };
    const del = async () => {
        if (!confirm(`${u.name} ka account delete karna hai? Ye wapas nahi hoga.`)) return;
        setBusy(true);
        try { await api(`/admin/users/${id}`, { method: 'DELETE' }); toast.success('User delete ho gaya'); router.push('/admin/users'); }
        catch (e) { toast.error(e.message); setBusy(false); }
    };

    return (
        <div className="space-y-5">
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"><ArrowLeft size={16} /> Back to users</Link>

            <div className="card flex flex-wrap items-center gap-4 p-5">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-indigo-500 text-2xl font-extrabold text-white">{u.name[0].toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                    <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold text-slate-900">{u.name}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{isAdmin ? 'Admin' : 'Customer'}</span>
                        {isMe && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Aap</span>}
                    </h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Mail size={14} /><a href={`mailto:${u.email}`} className="truncate hover:underline">{u.email}</a></p>
                    {u.phone && <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-600"><Phone size={14} /><a href={`tel:${u.phone}`} className="hover:underline">{u.phone}</a></p>}
                </div>
                {!isMe && (
                    <div className="flex flex-wrap gap-2">
                        <button disabled={busy} onClick={toggleRole} className="btn-outline">{isAdmin ? <><ShieldOff size={16} /> Admin Remove</> : <><ShieldCheck size={16} /> Create Admin</>}</button>
                        <button disabled={busy} onClick={del} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /> Delete</button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={CalendarDays} label="Joined" value={dateOnly(u.createdAt)} />
                <Stat icon={Clock} label="Last login" value={ago(u.lastLoginAt)} />
                <Stat icon={LogIn} label="Total logins" value={u.loginCount || 0} />
                <Stat icon={Heart} label="Wishlist" value={`${u.wishlist?.length || 0} items`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="card p-4"><p className="text-xs text-slate-500">Total orders</p><p className="text-2xl font-extrabold">{stats.orders}</p></div>
                <div className="card p-4"><p className="text-xs text-slate-500">Total kharcha</p><p className="text-2xl font-extrabold text-emerald-700">{inr(stats.spent)}</p></div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="card lg:col-span-2">
                    <h2 className="border-b p-4 font-bold">Orders ({orders.length})</h2>
                    {orders.length === 0 && <p className="p-8 text-center text-sm text-slate-400">This user has not placed any orders yet.</p>}
                    <div className="divide-y">
                        {orders.map((o) => (
                            <Link key={o._id} href={`/admin/orders/${o._id}`} className="group flex items-center gap-3 p-4 transition hover:bg-slate-50">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">{shortId(o._id)} <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_PILL[o.status]}`}>{o.status}</span></p>
                                    <p className="truncate text-xs text-slate-500">{dateTime(o.createdAt)} · {o.items.map((i) => i.name).join(', ')}</p>
                                </div>
                                <span className="font-extrabold">{inr(o.totalPrice)}</span>
                                <ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="card h-fit">
                    <h2 className="border-b p-4 font-bold">Wishlist</h2>
                    {(u.wishlist || []).length === 0 && <p className="p-6 text-center text-sm text-slate-400">Wishlist is Empty.</p>}
                    <div className="divide-y">
                        {(u.wishlist || []).map((p) => (
                            <Link key={p._id} href={`/admin/products?search=${encodeURIComponent(p.name)}`} className="flex items-center gap-3 p-3 transition hover:bg-slate-50">
                                <img src={cld(p.images?.[0], 100)} alt="" className="h-10 w-10 rounded-lg border bg-slate-50 object-cover" />
                                <div className="min-w-0"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-slate-500">{inr(p.price)}</p></div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}