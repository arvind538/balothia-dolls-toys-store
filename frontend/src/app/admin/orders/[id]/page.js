'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Check,
    Loader2,
    XCircle,
    Package,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { dateTime, shortId, STATUS_FLOW, STATUS_PILL } from '@/lib/format';

const STAGE_NOTES = {
    Placed: 'Order received and awaiting confirmation',
    Processing: 'Confirmed and being packed for dispatch',
    Shipped: 'Dispatched and on the way to the customer',
    Delivered: 'Delivered to the customer address',
};

const NEXT_ACTION_LABEL = {
    Placed: 'Confirm Order',
    Processing: 'Mark as Shipped',
    Shipped: 'Mark as Delivered',
};

export default function OrderDetail() {
    const { id } = useParams();
    const [o, setO] = useState(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(
        () => api(`/admin/orders/${id}`).then(setO).catch((e) => setErr(e.message)),
        [id]
    );

    useEffect(() => {
        load();
    }, [load]);

    const setStatus = async (s) => {
        if (
            s === 'Cancelled' &&
            !confirm('Cancel this order? Stock will be restored automatically.')
        ) {
            return;
        }
        setBusy(true);
        try {
            await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status: s } });
            toast.success(`Status updated to ${s}`);
            await load();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    if (err) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <p className="text-base font-bold text-slate-800">{err}</p>
                <Link
                    href="/admin/orders"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0b2a5b] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-900"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Orders</span>
                </Link>
            </div>
        );
    }

    if (!o) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
            </div>
        );
    }

    const idx = STATUS_FLOW.indexOf(o.status);
    const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
    const locked = ['Cancelled', 'Delivered', 'Pending Payment'].includes(o.status);
    const a = o.shippingAddress || {};

    return (
        <div className="space-y-5">
            <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 transition hover:underline"
            >
                <ArrowLeft size={16} />
                <span>Back to orders</span>
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Order #{shortId(o._id)}
                    </h1>
                    <p className="text-xs font-medium text-slate-500 sm:text-sm">
                        Placed on {dateTime(o.createdAt)}
                    </p>
                </div>
                <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold sm:text-sm ${STATUS_PILL[o.status] || 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                >
                    {o.status}
                </span>
            </div>

            {/* Live Fulfillment Progress */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-700">
                        <Package size={16} className="text-blue-600" />
                        <span>Fulfillment Progress</span>
                    </h2>
                    {idx >= 0 && o.status !== 'Cancelled' && (
                        <span className="text-xs font-semibold text-slate-500">
                            {STAGE_NOTES[o.status]}
                        </span>
                    )}
                </div>

                {o.status === 'Cancelled' ? (
                    <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                        <XCircle size={18} />
                        <span>This order has been cancelled.</span>
                    </p>
                ) : o.status === 'Pending Payment' ? (
                    <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        <Clock size={18} />
                        <span>Payment is still pending. Status updates unlock once payment succeeds.</span>
                    </p>
                ) : (
                    <div className="overflow-x-auto pb-2">
                        <div className="flex min-w-[420px] items-center">
                            {STATUS_FLOW.map((s, i) => {
                                const done = i <= idx;
                                const completedBefore = i < idx;
                                return (
                                    <div key={s} className="flex flex-1 items-center last:flex-none">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span
                                                className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold transition-all ${done
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-400'
                                                    }`}
                                            >
                                                {completedBefore ? <Check size={16} /> : i + 1}
                                            </span>
                                            <span
                                                className={`text-xs font-bold ${done ? 'text-blue-700' : 'text-slate-400'
                                                    }`}
                                            >
                                                {s}
                                            </span>
                                        </div>
                                        {i < STATUS_FLOW.length - 1 && (
                                            <span
                                                className={`mx-2 mb-5 h-1 flex-1 rounded-full transition-colors ${completedBefore ? 'bg-blue-600' : 'bg-slate-200'
                                                    }`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!locked && (
                    <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
                        {next && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setStatus(next)}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-2xs transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                            >
                                {busy && <Loader2 size={16} className="animate-spin" />}
                                <span>{NEXT_ACTION_LABEL[o.status] || `Mark as ${next}`}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus('Cancelled')}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                        >
                            <XCircle size={16} />
                            <span>Cancel order</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Items & Summary + Customer, Delivery & Payment */}
            <div className="grid gap-5 lg:grid-cols-12">
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-7">
                    <h2 className="p-4 text-sm font-extrabold uppercase tracking-wider text-slate-600">
                        Items ({(o.items || []).reduce((s, i) => s + (i.qty || 1), 0)})
                    </h2>
                    {(o.items || []).map((i, idxItem) => (
                        <div
                            key={i.product || i._id || idxItem}
                            className="flex items-center gap-3.5 p-4 transition-colors hover:bg-slate-50/60"
                        >
                            <img
                                src={cld(i.image, 160)}
                                alt={i.name}
                                className="h-16 w-16 shrink-0 rounded-xl border border-slate-200/70 bg-slate-50 object-contain p-1"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://placehold.co/160x160?text=Toy';
                                }}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-bold text-slate-900">
                                    {i.name}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    {inr(i.price)} × {i.qty || 1}
                                </p>
                            </div>
                            <p className="shrink-0 text-sm font-extrabold text-slate-900">
                                {inr((i.price || 0) * (i.qty || 1))}
                            </p>
                        </div>
                    ))}
                    <div className="space-y-2 p-4 text-sm">
                        <p className="flex justify-between">
                            <span className="text-slate-500">Items total</span>
                            <span className="font-semibold text-slate-800">{inr(o.itemsPrice)}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-slate-500">Delivery</span>
                            <span
                                className={
                                    o.shippingPrice
                                        ? 'font-semibold text-slate-800'
                                        : 'font-bold text-emerald-600'
                                }
                            >
                                {o.shippingPrice ? inr(o.shippingPrice) : 'FREE'}
                            </span>
                        </p>
                        {o.gstIncluded != null && (
                            <p className="flex justify-between">
                                <span className="text-slate-500">GST (included)</span>
                                <span className="font-semibold text-slate-800">
                                    {inr(o.gstIncluded)}
                                </span>
                            </p>
                        )}
                        <p className="flex justify-between border-t border-slate-200 pt-2.5 text-lg font-extrabold text-slate-900">
                            <span>Total</span>
                            <span>{inr(o.totalPrice)}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-5 lg:col-span-5">
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
                        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-600">
                            Customer
                        </h2>
                        {o.user ? (
                            <>
                                <Link
                                    href={`/admin/users/${o.user._id}`}
                                    className="text-base font-bold text-blue-700 hover:underline"
                                >
                                    {o.user.name}
                                </Link>
                                {o.user.email && (
                                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                        <Mail size={14} className="shrink-0 text-slate-400" />
                                        <a href={`mailto:${o.user.email}`} className="truncate hover:underline">
                                            {o.user.email}
                                        </a>
                                    </p>
                                )}
                                {o.user.phone && (
                                    <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
                                        <Phone size={14} className="shrink-0 text-slate-400" />
                                        <a href={`tel:${o.user.phone}`} className="hover:underline">
                                            {o.user.phone}
                                        </a>
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Customer account no longer exists</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-600">
                            <MapPin size={15} className="text-orange-500" />
                            <span>Delivery address</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{a.name}</p>
                            {a.addressType && (
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {a.addressType}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {[a.address, a.landmark, a.city, a.state]
                                .filter(Boolean)
                                .join(', ')}
                            {a.pincode ? ` - ${a.pincode}` : ''}
                        </p>
                        {a.phone && (
                            <a
                                href={`tel:${a.phone}`}
                                className="mt-1.5 inline-block text-sm font-semibold text-blue-700 hover:underline"
                            >
                                {a.phone}
                            </a>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-sm shadow-2xs sm:p-5">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-600">
                            <CreditCard size={15} className="text-blue-600" />
                            <span>Payment</span>
                        </h2>
                        <p className="font-semibold text-slate-800">
                            {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
                        </p>
                        <p
                            className={`mt-1 font-bold ${o.isPaid ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                        >
                            {o.isPaid ? `Paid · ${dateTime(o.paidAt)}` : 'Payment pending'}
                        </p>
                        {o.razorpayPaymentId && (
                            <p className="mt-1.5 break-all font-mono text-xs text-slate-400">
                                Payment ID: {o.razorpayPaymentId}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}