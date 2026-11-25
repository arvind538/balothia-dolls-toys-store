'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Clock, CheckCircle2, Truck, Home, Package, RefreshCw,
    ChevronDown, ChevronUp, ShoppingBag, MapPin, CreditCard,
    Sparkles, XCircle,
} from 'lucide-react';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const STEPS = [
    {
        key: 'Placed',
        label: 'Order placed',
        desc: 'We have received your order',
        icon: Clock,
    },
    {
        key: 'Processing',
        label: 'Confirmed',
        desc: 'Your order is confirmed and being packed',
        icon: Package,
    },
    {
        key: 'Shipped',
        label: 'Shipped',
        desc: 'Your order is on the way',
        icon: Truck,
    },
    {
        key: 'Delivered',
        label: 'Delivered',
        desc: 'Order delivered successfully',
        icon: Home,
    },
];

const STATUS_BADGE = {
    Placed: 'bg-amber-100/90 text-amber-800 border-amber-200',
    Processing: 'bg-blue-100/90 text-blue-800 border-blue-200',
    Shipped: 'bg-purple-100/90 text-purple-800 border-purple-200',
    Delivered: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-rose-100/90 text-rose-800 border-rose-200',
};

function formatOrderDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return `${day}, ${time}`;
}

function formatExpectedDelivery(order) {
    if (order.deliveredAt) {
        return `Delivered on ${new Date(order.deliveredAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })}`;
    }
    const base = order.createdAt ? new Date(order.createdAt) : new Date();
    const eta = new Date(base);
    eta.setDate(eta.getDate() + 5);
    return `Expected delivery by ${eta.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
    })}`;
}

function getStepIndex(status) {
    if (status === 'Cancelled') return -1;
    const idx = STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
}

function OrderSkeleton() {
    return (
        <div className="wrap max-w-4xl py-6 sm:py-8">
            <div className="mb-5 h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
            <div className="space-y-4">
                {[1, 2].map((n) => (
                    <div
                        key={n}
                        className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                                <div className="space-y-1.5">
                                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                                    <div className="h-3 w-44 animate-pulse rounded bg-slate-200" />
                                </div>
                            </div>
                            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                        </div>
                        <div className="mt-4 flex gap-2.5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />
                            ))}
                        </div>
                        <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                            <div className="h-9 animate-pulse rounded-lg bg-slate-200" />
                            <div className="h-9 animate-pulse rounded-lg bg-slate-200" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function OrderCard({ order, defaultExpanded = false, onReorder, onRefresh, refreshing }) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const activeIdx = getStepIndex(order.status);
    const isCancelled = order.status === 'Cancelled';

    const items = order.items || [];
    const itemTotal = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
    );
    const discount =
        typeof order.discount === 'number'
            ? order.discount
            : Math.max(0, itemTotal + (order.shippingPrice || 0) - (order.totalPrice || itemTotal));
    const deliveryCharge =
        typeof order.shippingPrice === 'number' ? order.shippingPrice : 0;
    const billTotal = order.totalPrice ?? Math.max(0, itemTotal - discount + deliveryCharge);

    const progressPercent =
        isCancelled || activeIdx <= 0
            ? 0
            : Math.min(100, Math.round((activeIdx / (STEPS.length - 1)) * 100));

    const addr = order.shippingAddress || order.address || {};
    const formattedAddress = [
        addr.address || addr.street || addr.line1,
        addr.landmark,
        addr.city,
        addr.state,
        addr.postalCode || addr.pincode || addr.zip,
    ]
        .filter(Boolean)
        .join(', ');

    const paymentLabel =
        order.paymentMethod === 'cod'
            ? `Cash on Delivery · ${order.isPaid ? 'Paid' : 'Pay on delivery'}`
            : order.isPaid
                ? 'Online Payment · Paid'
                : 'Online Payment · Pending';

    const lastUpdatedTime = new Date(order.updatedAt || order.createdAt || Date.now()).toLocaleTimeString(
        'en-IN',
        { hour: 'numeric', minute: '2-digit', hour12: true }
    );

    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            {/* Top Summary Header */}
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isCancelled
                                ? 'border-rose-200 bg-rose-50 text-rose-600'
                                : activeIdx >= 3
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                    : 'border-amber-200/80 bg-amber-50 text-amber-600'
                                }`}
                        >
                            {isCancelled ? (
                                <XCircle size={19} />
                            ) : activeIdx >= 3 ? (
                                <CheckCircle2 size={19} />
                            ) : (
                                <Clock size={19} />
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                                    {order.status}
                                </h2>
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                    #{order._id?.slice(-6).toUpperCase()}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                                <span className="font-bold text-slate-800">{inr(billTotal)}</span>
                                {' · '}
                                <span>{formatOrderDate(order.createdAt)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span
                            className={`hidden rounded-full border px-2.5 py-0.5 text-[11px] font-bold sm:inline-flex ${STATUS_BADGE[order.status] || 'border-slate-200 bg-slate-100 text-slate-700'
                                }`}
                        >
                            {order.status}
                        </span>
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={refreshing}
                            aria-label="Refresh live order status"
                            title="Refresh live status"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        >
                            <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
                        </button>
                    </div>
                </div>

                {/* Product Thumbnail Strip */}
                {items.length > 0 && (
                    <div className="no-scrollbar mt-4 flex items-center gap-2.5 overflow-x-auto pb-1">
                        {items.map((item, idx) => (
                            <Link
                                key={item.product || item._id || idx}
                                href={item.product ? `/products/${item.product}` : '/products'}
                                title={`${item.name} × ${item.qty || 1}`}
                                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 p-1 transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xs sm:h-16 sm:w-16"
                            >
                                <img
                                    src={cld(item.image, 220)}
                                    alt={item.name || 'Toy item'}
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = 'https://placehold.co/200x200?text=Toy';
                                    }}
                                />
                                {(item.qty || 1) > 1 && (
                                    <span className="absolute bottom-0.5 right-0.5 rounded bg-slate-900/80 px-1 text-[10px] font-bold text-white">
                                        ×{item.qty}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Horizontal Live Progress Bar */}
                {!isCancelled ? (
                    <div className="mt-5">
                        <div className="relative flex items-center">
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                            <div
                                className="absolute left-0 h-1 rounded-full bg-emerald-600 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                            <div
                                className="absolute z-10 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-emerald-600 text-white shadow-sm transition-all duration-500 ease-out"
                                style={{ left: `${progressPercent}%` }}
                            >
                                <Truck size={12} strokeWidth={2.4} />
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-4 text-[11px] sm:text-xs">
                            {STEPS.map((step, idx) => {
                                const done = idx <= activeIdx;
                                const isCurrent = idx === activeIdx;
                                return (
                                    <span
                                        key={step.key}
                                        className={`truncate transition-colors ${idx === 0
                                            ? 'text-left'
                                            : idx === STEPS.length - 1
                                                ? 'text-right'
                                                : 'text-center'
                                            } ${isCurrent
                                                ? 'font-bold text-emerald-700'
                                                : done
                                                    ? 'font-semibold text-slate-700'
                                                    : 'font-medium text-slate-400'
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
                        This order was cancelled. You can tap Reorder below to place it again.
                    </div>
                )}
            </div>

            {/* Bottom Split Actions: Reorder | Track order */}
            <div className="grid grid-cols-2 divide-x divide-slate-200/80 border-t border-slate-200/80 bg-slate-50/40">
                <button
                    type="button"
                    onClick={() => onReorder(order)}
                    className="flex h-11 items-center justify-center gap-1.5 px-3 text-xs font-bold text-emerald-700 transition-colors duration-150 hover:bg-emerald-50/80 hover:text-emerald-800 active:bg-emerald-100/70 sm:text-sm"
                >
                    <RefreshCw size={14} className="shrink-0" />
                    <span>Reorder</span>
                </button>

                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    aria-expanded={expanded}
                    className="flex h-11 items-center justify-center gap-1.5 px-3 text-xs font-bold text-emerald-700 transition-colors duration-150 hover:bg-emerald-50/80 hover:text-emerald-800 active:bg-emerald-100/70 sm:text-sm"
                >
                    <span>{expanded ? 'Hide details' : 'Track order'}</span>
                    {expanded ? (
                        <ChevronUp size={15} className="shrink-0" />
                    ) : (
                        <ChevronDown size={15} className="shrink-0" />
                    )}
                </button>
            </div>

            {/* Expandable Live Tracking, Items, Bill Details & Order Details */}
            {expanded && (
                <div className="space-y-6 border-t border-slate-200/90 bg-slate-50/50 p-4 sm:p-6">
                    {/* 1. Track Order Timeline */}
                    <section>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                                Track Order
                            </h3>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>Live · updated {lastUpdatedTime}</span>
                            </span>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
                            <p className="text-sm font-bold text-slate-900">
                                {formatExpectedDelivery(order)}
                            </p>

                            <div className="mt-4 space-y-0">
                                {STEPS.map((step, idx) => {
                                    const Icon = step.icon;
                                    const reached = !isCancelled && idx <= activeIdx;
                                    const isCurrent = !isCancelled && idx === activeIdx;
                                    const isLast = idx === STEPS.length - 1;

                                    return (
                                        <div key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
                                            {!isLast && (
                                                <span
                                                    aria-hidden="true"
                                                    className={`absolute left-4 top-8 -ml-px h-[calc(100%-1.5rem)] w-0.5 transition-colors ${!isCancelled && idx < activeIdx
                                                        ? 'bg-emerald-500'
                                                        : 'bg-slate-200'
                                                        }`}
                                                />
                                            )}

                                            <div
                                                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all ${isCurrent
                                                    ? 'border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-100'
                                                    : reached
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-200 bg-slate-100 text-slate-400'
                                                    }`}
                                            >
                                                <Icon size={15} strokeWidth={2.2} />
                                            </div>

                                            <div className="min-w-0 flex-1 pt-0.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p
                                                        className={`text-sm ${reached
                                                            ? 'font-bold text-slate-900'
                                                            : 'font-semibold text-slate-400'
                                                            }`}
                                                    >
                                                        {step.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                                            Current stage
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className={`mt-0.5 text-xs ${reached ? 'text-slate-600' : 'text-slate-400'
                                                        }`}
                                                >
                                                    {step.desc}
                                                </p>
                                                {idx === 0 && order.createdAt && (
                                                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                                                        {formatOrderDate(order.createdAt)}
                                                    </p>
                                                )}
                                                {idx === 3 && order.deliveredAt && (
                                                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                                                        {formatOrderDate(order.deliveredAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* 2. Items in This Order */}
                    <section>
                        <h3 className="mb-3 text-base font-extrabold tracking-tight text-slate-900">
                            {items.length} {items.length === 1 ? 'item' : 'items'} in this order
                        </h3>

                        <div className="divide-y divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                            {items.map((item, idx) => {
                                const qty = item.qty || 1;
                                const lineTotal = (item.price || 0) * qty;
                                return (
                                    <div
                                        key={item.product || item._id || idx}
                                        className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50/80 sm:px-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Link
                                                href={item.product ? `/products/${item.product}` : '/products'}
                                                className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 p-1"
                                            >
                                                <img
                                                    src={cld(item.image, 220)}
                                                    alt={item.name}
                                                    className="h-full w-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = 'https://placehold.co/200x200?text=Toy';
                                                    }}
                                                />
                                            </Link>
                                            <div className="min-w-0">
                                                <Link
                                                    href={item.product ? `/products/${item.product}` : '/products'}
                                                    className="line-clamp-1 text-sm font-bold text-slate-900 hover:text-blue-700"
                                                >
                                                    {item.name}
                                                </Link>
                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                    {inr(item.price)} × {qty}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="shrink-0 text-sm font-extrabold text-slate-900">
                                            {inr(lineTotal)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 3. Bill Details */}
                    <section>
                        <h3 className="mb-3 text-base font-extrabold tracking-tight text-slate-900">
                            Bill Details
                        </h3>

                        <div className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-4 text-sm shadow-2xs sm:px-5">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Item total</span>
                                <span className="font-semibold text-slate-800">{inr(itemTotal)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex items-center justify-between text-blue-600">
                                    <span>Order discount</span>
                                    <span className="font-semibold">-{inr(discount)}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-slate-600">
                                <span>Delivery charges</span>
                                <span
                                    className={
                                        deliveryCharge === 0
                                            ? 'font-extrabold tracking-wide text-emerald-600'
                                            : 'font-semibold text-slate-800'
                                    }
                                >
                                    {deliveryCharge === 0 ? 'FREE' : inr(deliveryCharge)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-base font-extrabold text-slate-900">
                                <span>Bill total</span>
                                <span>{inr(billTotal)}</span>
                            </div>
                        </div>
                    </section>

                    {/* 4. Order Details */}
                    <section>
                        <h3 className="mb-3 text-base font-extrabold tracking-tight text-slate-900">
                            Order Details
                        </h3>

                        <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
                            <div>
                                <p className="text-xs font-medium text-slate-400">Order ID</p>
                                <p className="mt-0.5 break-all font-mono text-xs font-bold text-slate-800 sm:text-sm">
                                    #{order._id}
                                </p>
                            </div>

                            <div>
                                <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                    <CreditCard size={13} />
                                    <span>Payment</span>
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                    {paymentLabel.split('·')[0]}
                                    {paymentLabel.includes('·') && (
                                        <span className="font-semibold text-amber-600">
                                            {' · '}
                                            {paymentLabel.split('·')[1].trim()}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400">Order placed</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                    {formatOrderDate(order.createdAt)}
                                </p>
                            </div>

                            {(addr.fullName || addr.name || formattedAddress || addr.phone) && (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-400">
                                            Delivering to
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                            <Home size={11} />
                                            <span>{addr.label || addr.addressType || 'Home'}</span>
                                        </span>
                                    </div>

                                    {(addr.fullName || addr.name || addr.phone) && (
                                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                                            {[
                                                addr.fullName || addr.name,
                                                addr.phone ? `+91 ${String(addr.phone).replace(/^\+91\s*/, '')}` : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    )}

                                    {formattedAddress && (
                                        <p className="mt-0.5 flex items-start gap-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                                            <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                                            <span>{formattedAddress}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Primary Repeat Order CTA */}
                    <button
                        type="button"
                        onClick={() => onReorder(order)}
                        className="flex w-full flex-col items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-sm shadow-emerald-600/20 transition-all duration-150 hover:bg-emerald-700 hover:shadow-md active:scale-[0.99]"
                    >
                        <span className="text-sm font-extrabold tracking-wide sm:text-base">
                            Repeat Order
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                            Add Items & Continue
                        </span>
                    </button>
                </div>
            )}
        </article>
    );
}

export default function MyOrders() {
    const { user, loading } = useAuth();
    const { add } = useCart();
    const router = useRouter();

    const [orders, setOrders] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const data = await api('/orders/mine');
            setOrders(Array.isArray(data) ? data : data?.orders || []);
            if (isManual) toast.success('Order status refreshed.');
        } catch {
            if (!orders) setOrders([]);
            if (isManual) toast.error('Could not refresh orders right now.');
        } finally {
            if (isManual) setRefreshing(false);
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login?next=/orders');
            return;
        }
        fetchOrders(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading, router]);

    const handleReorder = (order) => {
        const items = order.items || [];
        if (!items.length) {
            return router.push('/products');
        }
        items.forEach((item) => {
            add(
                {
                    _id: item.product || item._id,
                    name: item.name,
                    price: item.price,
                    images: item.image ? [item.image] : [],
                    stock: item.stock ?? 99,
                },
                item.qty || 1,
                false
            );
        });
        toast.success('Items added to your cart.');
        router.push('/cart');
    };

    if (loading || !orders) return <OrderSkeleton />;

    return (
        <div className="wrap max-w-4xl py-6 sm:py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#0b2a5b] sm:text-3xl">
                        My Orders
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                        Track live delivery progress, inspect bills, or reorder with one tap.
                    </p>
                </div>

                {orders.length > 0 && (
                    <button
                        type="button"
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
                        <span>{refreshing ? 'Updating...' : 'Refresh Status'}</span>
                    </button>
                )}
            </div>

            {orders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-14 text-center shadow-2xs">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                        <ShoppingBag size={26} />
                    </div>
                    <h2 className="mt-4 text-lg font-extrabold text-slate-900">No orders yet</h2>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                        Explore dolls, learning toys, and playsets to place your first order.
                    </p>
                    <Link
                        href="/products"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
                    >
                        <Sparkles size={15} />
                        <span>Browse Toys</span>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order, index) => (
                        <OrderCard
                            key={order._id}
                            order={order}
                            defaultExpanded={index === 0}
                            onReorder={handleReorder}
                            onRefresh={() => fetchOrders(true)}
                            refreshing={refreshing}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}