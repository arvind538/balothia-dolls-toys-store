'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Bell, ChevronDown, Menu, User, Store, LogOut, ShoppingBag, UserPlus,
    MessageSquare, AlertTriangle, CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ago, shortId } from '@/lib/format';

// Icon, colour and toast emoji for each type of notification.
const ICONS = {
    order: [ShoppingBag, 'bg-orange-50 text-orange-600', '🛒'],
    user: [UserPlus, 'bg-indigo-50 text-indigo-600', '👤'],
    message: [MessageSquare, 'bg-emerald-50 text-emerald-600', '✉️'],
};

const beep = () => {
    try {
        const C = window.AudioContext || window.webkitAudioContext;
        const ctx = new C();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 660;
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.4);
    } catch { }
};

export default function AdminTopbar({ trail = [], onMenu }) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [events, setEvents] = useState([]);
    const [lowStock, setLowStock] = useState(0);
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [seen, setSeen] = useState(null);
    const [bellOpen, setBellOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const known = useRef(null);
    const nowRef = useRef(null);
    const bellRef = useRef(null);
    const profRef = useRef(null);
    const seenKey = `bt_admin_seen_${user?._id}`;

    const markRead = useCallback(() => {
        const t = nowRef.current || new Date().toISOString();
        localStorage.setItem(seenKey, t);
        setSeen(t);
    }, [seenKey]);

    const load = useCallback(async () => {
        try {
            const d = await api('/admin/notifications');
            nowRef.current = d.now;
            let s = localStorage.getItem(seenKey);
            if (!s) { s = d.now; localStorage.setItem(seenKey, s); } // First visit: do not mark old items as unread.
            setSeen(s);

            const ev = [
                ...d.orders.map((o) => ({
                    key: `o-${o._id}`, type: 'order', at: o.paidAt || o.createdAt,
                    title: `New order ${shortId(o._id)}`, sub: `${o.user?.name || 'Customer'} · ${inr(o.totalPrice)}`, href: `/admin/orders/${o._id}`,
                })),
                ...d.users.map((u) => ({
                    key: `u-${u._id}`, type: 'user', at: u.createdAt,
                    title: 'New customer registered', sub: `${u.name} · ${u.email}`, href: `/admin/users/${u._id}`,
                })),
                ...(d.messages || []).filter((m) => m.lastReplyBy !== 'admin').map((m) => ({
                    key: `m-${m._id}-${m.lastActivityAt || m.createdAt}`, // a new reply creates a new key, so it shows up again
                    type: 'message',
                    at: m.lastActivityAt || m.createdAt,
                    title: m.lastReplyBy === 'customer' ? 'Customer replied' : 'New contact message',
                    sub: `${m.name} · ${m.topic}`,
                    href: `/admin/messages?open=${m._id}`,
                })),
            ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 15);

            if (known.current) {
                const fresh = ev.filter((e) => !known.current.has(e.key));
                if (fresh.length) {
                    toast(fresh.length === 1 ? `${fresh[0].title}: ${fresh[0].sub}` : `${fresh.length} new notifications`, {
                        icon: ICONS[fresh[0].type][2], duration: 5000,
                    });
                    beep();
                    window.dispatchEvent(new Event('bt:admin-activity')); // Refreshes the dashboard, lists and badges.
                }
            }
            known.current = new Set(ev.map((e) => e.key));
            setEvents(ev);
            setLowStock(d.lowStock || 0);
            setUnreadMsgs(d.unreadMessages || 0);
        } catch { }
    }, [seenKey]);

    useEffect(() => {
        if (!user?._id) return;
        load();
        const t = setInterval(load, 20000);
        const onVis = () => document.visibilityState === 'visible' && load();
        const onMsg = () => load();
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('bt:messages-changed', onMsg);
        return () => {
            clearInterval(t);
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('bt:messages-changed', onMsg);
        };
    }, [user?._id, load]);

    useEffect(() => {
        if (!bellOpen && !profileOpen) return;
        const onDown = (e) => {
            if (bellOpen && bellRef.current && !bellRef.current.contains(e.target)) { setBellOpen(false); markRead(); }
            if (profileOpen && profRef.current && !profRef.current.contains(e.target)) setProfileOpen(false);
        };
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (bellOpen) { setBellOpen(false); markRead(); }
            setProfileOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [bellOpen, profileOpen, markRead]);

    const isFresh = (e) => seen && new Date(e.at) > new Date(seen);
    const unread = events.filter(isFresh).length;
    const name = user?.name || 'Admin';

    const toggleBell = () => {
        if (bellOpen) markRead();
        setBellOpen(!bellOpen);
        setProfileOpen(false);
    };
    const closeBell = () => { setBellOpen(false); markRead(); };

    return (
        <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-sm sm:px-6 lg:left-60">
            <div className="flex min-w-0 items-center gap-2">
                <button onClick={onMenu} aria-label="Menu" className="rounded-lg p-2 transition hover:bg-slate-100 lg:hidden"><Menu size={22} /></button>
                <p className="truncate text-sm text-slate-400">
                    {trail.map((t, i) => (
                        <span key={t} className={i === trail.length - 1 ? 'font-semibold text-slate-800' : ''}>{i > 0 && ' / '}{t}</span>
                    ))}
                </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Notifications */}
                <div ref={bellRef} className="relative">
                    <button onClick={toggleBell} aria-label="Notifications" className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                        <Bell size={21} className={unread > 0 ? 'text-orange-500' : ''} />
                        {unread > 0 && (
                            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>
                        )}
                    </button>

                    {bellOpen && (
                        <div className="anim-fade absolute right-0 mt-2 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                                <span className="text-sm font-bold text-slate-800">Notifications {unread > 0 && <span className="ml-1 text-orange-600">({unread} new)</span>}</span>
                                <button onClick={closeBell} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"><CheckCheck size={14} /> Mark all read</button>
                            </div>
                            <div className="max-h-80 divide-y overflow-y-auto">
                                {events.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No notifications yet</p>}
                                {events.map((e) => {
                                    const [Icon, tone] = ICONS[e.type];
                                    return (
                                        <Link key={e.key} href={e.href} onClick={closeBell} className={`flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${isFresh(e) ? 'bg-blue-50/60' : ''}`}>
                                            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}>
                                                <Icon size={17} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-slate-800">{e.title}</span>
                                                <span className="block truncate text-xs text-slate-500">{e.sub}</span>
                                                <span className="text-[11px] text-slate-400">{ago(e.at)}</span>
                                            </span>
                                            {isFresh(e) && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                                        </Link>
                                    );
                                })}
                            </div>
                            {lowStock > 0 && (
                                <Link href="/admin/products?stock=low" onClick={closeBell} className="flex items-center gap-2 border-t bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">
                                    <AlertTriangle size={14} /> {lowStock} products are low on stock (5 or fewer)
                                </Link>
                            )}
                            <div className="grid grid-cols-3 border-t text-center text-xs font-semibold text-blue-700">
                                <Link href="/admin/orders" onClick={closeBell} className="py-2.5 transition hover:bg-slate-50">All orders</Link>
                                <Link href="/admin/messages" onClick={closeBell} className="border-x py-2.5 transition hover:bg-slate-50">
                                    Messages{unreadMsgs > 0 && ` (${unreadMsgs})`}
                                </Link>
                                <Link href="/admin/users" onClick={closeBell} className="py-2.5 transition hover:bg-slate-50">Customers</Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div ref={profRef} className="relative">
                    <button onClick={() => { setProfileOpen(!profileOpen); if (bellOpen) closeBell(); }} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-2.5 transition hover:bg-slate-100 sm:pr-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{name[0]?.toUpperCase()}</span>
                        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 sm:block">{name}</span>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="anim-fade absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
                            <div className="border-b px-4 py-2.5">
                                <p className="truncate text-sm font-bold text-slate-900">{name}</p>
                                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                                <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Admin</span>
                            </div>
                            <Link href="/admin/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"><User size={16} className="text-slate-500" /> My Profile</Link>
                            <Link href="/" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"><Store size={16} className="text-slate-500" /> View Store</Link>
                            <button onClick={() => { setProfileOpen(false); logout(); router.push('/login'); }} className="flex w-full items-center gap-2.5 border-t px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut size={16} /> Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}