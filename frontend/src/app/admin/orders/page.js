'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    SearchX,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { dateTime, shortId, STATUS_FLOW, STATUS_PILL } from '@/lib/format';

const QUICK_TABS = [
    { key: '', label: 'All', badgeClass: 'bg-slate-100 text-slate-700', activeBadge: 'bg-white/15 text-white' },
    { key: 'pending', label: 'Pending', badgeClass: 'bg-amber-50 text-amber-700', activeBadge: 'bg-amber-400/20 text-amber-200' },
    { key: 'Processing', label: 'Confirmed', badgeClass: 'bg-blue-50 text-blue-700', activeBadge: 'bg-blue-400/20 text-blue-200' },
    { key: 'Shipped', label: 'Shipped', badgeClass: 'bg-indigo-50 text-indigo-700', activeBadge: 'bg-indigo-400/20 text-indigo-200' },
    { key: 'Delivered', label: 'Delivered', badgeClass: 'bg-emerald-50 text-emerald-700', activeBadge: 'bg-emerald-400/20 text-emerald-200' },
    { key: 'Cancelled', label: 'Cancelled', badgeClass: 'bg-rose-50 text-rose-700', activeBadge: 'bg-rose-400/20 text-rose-200' },
];

const NEXT_ACTION_LABEL = {
    Placed: 'Confirm Order',
    Processing: 'Mark as Shipped',
    Shipped: 'Mark as Delivered',
};

const DISPLAY_STATUS = {
    Placed: 'Pending',
    Processing: 'Confirmed',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
    'Pending Payment': 'Pending Payment',
};

const AVATAR_COLORS = [
    'bg-amber-600',
    'bg-blue-600',
    'bg-emerald-600',
    'bg-indigo-600',
    'bg-rose-600',
];

function avatarBg(id = '') {
    let sum = 0;
    for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function OrderCard({ o, onStatusChange, busyId }) {
    const [open, setOpen] = useState(false);

    const locked = ['Cancelled', 'Delivered', 'Pending Payment'].includes(o.status);
    const idx = STATUS_FLOW.indexOf(o.status);
    const nextStatus = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
    const actionLabel = nextStatus ? NEXT_ACTION_LABEL[o.status] || `Mark as ${nextStatus}` : null;

    const items = o.items || [];
    const extraCount = Math.max(0, items.length - 4);
    const itemTotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const discount =
        typeof o.discount === 'number'
            ? o.discount
            : Math.max(0, itemTotal + (o.shippingPrice || 0) - (o.totalPrice || itemTotal));

    const addr = o.shippingAddress || o.address || {};
    const addressLine = [
        addr.address || addr.line1,
        addr.landmark,
        addr.city,
        addr.state,
        addr.pincode || addr.postalCode,
    ]
        .filter(Boolean)
        .join(', ');

    const isBusy = busyId === o._id;
    const formattedShortId = String(shortId(o._id) || '').replace(/^#+/, '');

    return (
        <article className="transform-gpu overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="p-4 sm:p-5">
                {/* Header Row: Customer Info + Status & Price */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white shadow-2xs ${avatarBg(
                                o._id
                            )}`}
                        >
                            {(o.user?.name || addr.name || 'C')[0].toUpperCase()}
                        </span>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                {o.user?._id ? (
                                    <Link
                                        href={`/admin/users/${o.user._id}`}
                                        className="truncate text-sm font-extrabold text-slate-900 transition hover:text-blue-700 hover:underline sm:text-base"
                                    >
                                        {o.user.name}
                                    </Link>
                                ) : (
                                    <span className="truncate text-sm font-extrabold text-slate-900 sm:text-base">
                                        {addr.name || 'Customer'}
                                    </span>
                                )}
                                <span className="font-mono text-xs font-semibold text-slate-400">
                                    #{formattedShortId}
                                </span>
                            </div>

                            <p className="mt-0.5 break-all text-xs text-slate-500 sm:break-normal sm:truncate">
                                {o.user?.email ? `${o.user.email} · ` : ''}
                                <span>{dateTime(o.createdAt)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 pt-2.5 sm:justify-end sm:border-0 sm:pt-0">
                        <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_PILL[o.status] ||
                                'border-slate-200 bg-slate-100 text-slate-700'
                                }`}
                        >
                            {DISPLAY_STATUS[o.status] || o.status}
                        </span>
                        <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                            {inr(o.totalPrice)}
                        </span>
                    </div>
                </div>

                {/* Middle Row: Thumbnails + Payment Badge */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {items.slice(0, 4).map((i, idxItem) => (
                            <div
                                key={i.product || i._id || idxItem}
                                className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 p-1 transition-transform duration-150 hover:scale-105 sm:h-13 sm:w-13"
                            >
                                <img
                                    src={cld(i.image, 140)}
                                    alt={i.name || 'Order item'}
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = 'https://placehold.co/120x120?text=Toy';
                                    }}
                                />
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-600 sm:h-13 sm:w-13">
                                +{extraCount}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-600">
                            {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
                        </span>
                        <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${o.isPaid
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                                }`}
                        >
                            {o.isPaid ? 'Paid' : 'Pay on delivery'}
                        </span>
                    </div>
                </div>

                {/* Bottom Action Row: Stage Buttons + View/Hide Details */}
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {!locked && actionLabel && nextStatus ? (
                            <>
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => onStatusChange(o._id, nextStatus)}
                                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold text-white shadow-2xs transition-all duration-150 active:scale-95 disabled:opacity-50 sm:text-sm ${o.status === 'Placed'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    <CheckCircle2 size={15} />
                                    <span>{actionLabel}</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => onStatusChange(o._id, 'Cancelled')}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3.5 text-xs font-bold text-rose-600 transition-all duration-150 hover:bg-rose-100 active:scale-95 disabled:opacity-50 sm:text-sm"
                                >
                                    <XCircle size={15} />
                                    <span>Cancel Order</span>
                                </button>
                            </>
                        ) : (
                            <span className="text-xs font-medium text-slate-400">
                                {o.status === 'Delivered'
                                    ? 'Order delivered'
                                    : o.status === 'Cancelled'
                                        ? 'No further actions'
                                        : 'Awaiting payment confirmation'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition hover:text-orange-700 sm:text-sm"
                        >
                            <span>{open ? 'Hide details' : 'View details'}</span>
                            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        <Link
                            href={`/admin/orders/${o._id}`}
                            title="Open full order page"
                            className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
                        >
                            <span>Full page</span>
                            <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Expandable Inline Breakdown: ITEMS, DELIVERY & ORDER INFO */}
            {open && (
                <div className="grid gap-6 border-t border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-12 sm:p-5">
                    {/* Left: Items & Bill */}
                    <div className="sm:col-span-7">
                        <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                            Items ({items.length})
                        </h3>

                        <div className="divide-y divide-slate-200/70 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                            {items.map((i, idxItem) => (
                                <div
                                    key={i.product || i._id || idxItem}
                                    className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-slate-50/60"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <img
                                            src={cld(i.image, 140)}
                                            alt={i.name}
                                            className="h-12 w-12 shrink-0 rounded-lg border border-slate-200/70 bg-slate-50 object-contain p-1"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = 'https://placehold.co/120x120?text=Toy';
                                            }}
                                        />
                                        <div className="min-w-0">
                                            <p className="line-clamp-1 text-xs font-bold text-slate-900 sm:text-sm">
                                                {i.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {inr(i.price)} × {i.qty || 1}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-extrabold text-slate-900 sm:text-sm">
                                        {inr((i.price || 0) * (i.qty || 1))}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3.5 space-y-1.5 text-xs sm:text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Item total</span>
                                <span className="font-semibold text-slate-800">{inr(itemTotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-blue-600">
                                    <span>Discount</span>
                                    <span className="font-semibold">-{inr(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-500">
                                <span>Delivery</span>
                                <span
                                    className={
                                        o.shippingPrice
                                            ? 'font-semibold text-slate-800'
                                            : 'font-bold text-emerald-600'
                                    }
                                >
                                    {o.shippingPrice ? inr(o.shippingPrice) : 'FREE'}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200/80 pt-2 text-sm font-extrabold text-slate-900 sm:text-base">
                                <span>Bill total</span>
                                <span>{inr(o.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Delivery & Order Info */}
                    <div className="space-y-5 sm:col-span-5">
                        <div>
                            <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                Delivery
                            </h3>
                            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">
                                        {addr.name || o.user?.name || 'Customer'}
                                    </span>
                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                        {addr.addressType || 'Home'}
                                    </span>
                                </div>
                                {addr.phone && (
                                    <p className="mt-1 font-medium text-slate-700">
                                        +91 {String(addr.phone).replace(/^\+91\s*/, '')}
                                    </p>
                                )}
                                {addressLine && (
                                    <p className="mt-1 leading-relaxed text-slate-500">
                                        {addressLine}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                Order Info
                            </h3>
                            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs sm:text-sm">
                                <div>
                                    <span className="text-slate-400">Order ID: </span>
                                    <span className="break-all font-mono font-bold text-slate-800">
                                        #{o._id}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Placed: </span>
                                    <span className="font-semibold text-slate-800">
                                        {dateTime(o.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}

function Orders() {
    const sp = useSearchParams();
    const router = useRouter();

    const status = sp.get('status') || '';
    const date = sp.get('date') || '';
    const month = sp.get('month') || '';
    const q = sp.get('q') || '';
    const page = Number(sp.get('page') || 1);
    const qs = sp.toString();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const [search, setSearch] = useState(q);

    useEffect(() => setSearch(q), [q]);

    const update = useCallback(
        (obj) => {
            const p = new URLSearchParams(sp.toString());
            Object.entries(obj).forEach(([k, v]) =>
                v === '' || v == null ? p.delete(k) : p.set(k, v)
            );
            if (!('page' in obj)) p.delete('page');
            const s = p.toString();
            router.replace(s ? `/admin/orders?${s}` : '/admin/orders', { scroll: false });
        },
        [router, sp]
    );

    useEffect(() => {
        const t = setTimeout(() => {
            if (search.trim() !== q) update({ q: search.trim() });
        }, 350);
        return () => clearTimeout(t);
    }, [search, q, update]);

    const load = useCallback(
        () =>
            api(`/admin/orders?limit=15&${qs}`)
                .then(setData)
                .catch((e) => toast.error(e.message)),
        [qs]
    );

    useEffect(() => {
        setLoading(true);
        load().finally(() => setLoading(false));
    }, [load]);

    useEffect(() => {
        const on = () => load();
        window.addEventListener('bt:admin-activity', on);
        return () => window.removeEventListener('bt:admin-activity', on);
    }, [load]);

    const changeStatus = async (id, s) => {
        if (
            s === 'Cancelled' &&
            !confirm('Cancel this order? Stock will be restored automatically.')
        ) {
            return;
        }
        setBusyId(id);
        try {
            await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status: s } });
            toast.success(`Order marked as ${DISPLAY_STATUS[s] || s}`);
            await load();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusyId('');
        }
    };

    const items = data?.items || [];
    const pages = data?.pages || 1;
    const statusCounts = data?.statusCounts || {};

    // Har status tab ka exact number nikalne ke liye (API statusCounts + fallback)
    const tabCounts = useMemo(() => {
        if (!data) {
            return {
                '': null,
                pending: null,
                Processing: null,
                Shipped: null,
                Delivered: null,
                Cancelled: null,
            };
        }

        const localPlaced = items.filter((o) => o.status === 'Placed').length;
        const localProcessing = items.filter((o) => o.status === 'Processing').length;
        const localShipped = items.filter((o) => o.status === 'Shipped').length;
        const localDelivered = items.filter((o) => o.status === 'Delivered').length;
        const localCancelled = items.filter((o) => o.status === 'Cancelled').length;

        const placed = statusCounts.Placed ?? localPlaced;
        const processing = statusCounts.Processing ?? localProcessing;
        const shipped = statusCounts.Shipped ?? localShipped;
        const delivered = statusCounts.Delivered ?? localDelivered;
        const cancelled = statusCounts.Cancelled ?? localCancelled;

        return {
            '': data.total ?? items.length,
            pending: placed + processing,
            Processing: processing,
            Shipped: shipped,
            Delivered: delivered,
            Cancelled: cancelled,
        };
    }, [data, items, statusCounts]);

    const chips = [];
    if (date) {
        chips.push([
            'Date',
            new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            () => update({ date: '' }),
        ]);
    }
    if (month) {
        chips.push([
            'Month',
            new Date(`${month}-01`).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
            }),
            () => update({ month: '' }),
        ]);
    }

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Page Title & Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Orders
                    </h1>
                    <p className="text-xs font-medium text-slate-400">
                        Admin / Orders{data ? ` · ${data.total ?? 0} total orders` : ''}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setLoading(true);
                        load().finally(() => setLoading(false));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filter Pills + Search Input */}
            <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
                <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
                    {QUICK_TABS.map((tab) => {
                        const active = status === tab.key;
                        const count = tabCounts[tab.key];

                        return (
                            <button
                                key={tab.key || 'all'}
                                type="button"
                                onClick={() => update({ status: tab.key })}
                                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 sm:text-sm ${active
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums ${active ? tab.activeBadge : tab.badgeClass
                                        }`}
                                >
                                    {count == null ? '…' : count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-80 xl:w-88">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone, order ID"
                        className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 sm:text-sm"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Active Date / Month Chips */}
            {chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {chips.map(([k, v, rm]) => (
                        <button
                            key={k}
                            type="button"
                            onClick={rm}
                            className="group inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
                        >
                            <span>
                                {k}: {v}
                            </span>
                            <X size={13} className="text-blue-500 group-hover:text-rose-600" />
                        </button>
                    ))}
                </div>
            )}

            {/* Order Cards List */}
            <div className={`space-y-3.5 transition-opacity duration-200 ${loading && data ? 'opacity-60' : ''}`}>
                {!data &&
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
                    ))}

                {data && items.length === 0 && (
                    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
                        <div>
                            <SearchX className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-2.5 text-base font-bold text-slate-800">
                                No matching orders found
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Try clearing your search or status filter.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.replace('/admin/orders')}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0b2a5b] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-900 sm:text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                {items.map((o) => (
                    <OrderCard
                        key={o._id}
                        o={o}
                        onStatusChange={changeStatus}
                        busyId={busyId}
                    />
                ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => update({ page: page - 1 })}
                        aria-label="Previous page"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700 sm:text-sm">
                        Page {page} of {pages}
                    </span>
                    <button
                        type="button"
                        disabled={page >= pages}
                        onClick={() => update({ page: page + 1 })}
                        aria-label="Next page"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense
            fallback={
                <div className="py-20 text-center text-sm font-medium text-slate-500">
                    Loading orders...
                </div>
            }
        >
            <Orders />
        </Suspense>
    );
}