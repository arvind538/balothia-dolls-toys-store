'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck,
    Truck, Sparkles, Tag,
} from 'lucide-react';
import { inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const FREE_DELIVERY_THRESHOLD = 999;

export default function CartPage() {
    const { items, setQty, remove, subtotal, shipping, total } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
    const deliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
    const totalCount = items.reduce((sum, i) => sum + (i.qty || 1), 0);

    const handleInc = (item) => {
        if (item.stock != null && item.qty >= item.stock) {
            return toast.error(`Only ${item.stock} item${item.stock > 1 ? 's' : ''} available in stock.`);
        }
        setQty(item.product, item.qty + 1);
    };

    const handleDec = (item) => {
        if (item.qty > 1) {
            setQty(item.product, item.qty - 1);
        } else {
            remove(item.product);
            toast.success('Item removed from cart.');
        }
    };

    const handleRemove = (item) => {
        remove(item.product);
        toast.success('Item removed from cart.');
    };

    const handleCheckout = () => {
        router.push(user ? '/checkout' : '/login?next=/checkout');
    };

    if (!items.length) {
        return (
            <div className="wrap py-16 sm:py-20">
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white px-6 py-12 text-center shadow-xs">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                        <ShoppingBag size={30} />
                    </div>
                    <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                        Your cart is empty
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Looks like you haven&apos;t added any dolls or learning toys yet.
                    </p>
                    <Link
                        href="/products"
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                    >
                        <span>Start Shopping</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="wrap pb-28 pt-5 sm:pt-7 lg:pb-12">
            {/* Page Header */}
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#0b2a5b] sm:text-3xl">
                        Shopping Cart
                    </h1>
                    <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                        {totalCount} {totalCount === 1 ? 'item' : 'items'} ready for checkout
                    </p>
                </div>

                <Link
                    href="/products"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-700 hover:underline sm:text-sm"
                >
                    <span>Continue Shopping</span>
                    <ArrowRight size={14} />
                </Link>
            </div>

            {/* Free Delivery Banner */}
            <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:px-4">
                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        {shipping === 0 ? (
                            <>
                                <Sparkles size={16} className="shrink-0 text-emerald-600" />
                                <span className="font-bold text-emerald-700">
                                    You&apos;ve unlocked FREE delivery on this order!
                                </span>
                            </>
                        ) : (
                            <>
                                <Truck size={16} className="shrink-0 text-blue-600" />
                                <span>
                                    Add <strong className="font-extrabold text-slate-900">{inr(remainingForFreeDelivery)}</strong> more to unlock{' '}
                                    <strong className="font-bold text-emerald-700">FREE delivery</strong>
                                </span>
                            </>
                        )}
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">
                        {deliveryProgress}%
                    </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${shipping === 0 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                        style={{ width: `${deliveryProgress}%` }}
                    />
                </div>
            </div>

            {/* Main Grid: Cart Items + Order Summary */}
            <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
                {/* -------- Cart Item Cards -------- */}
                <div className="space-y-3.5 lg:col-span-8">
                    {items.map((item) => {
                        const lineTotal = (item.price || 0) * (item.qty || 1);
                        const atMaxStock = item.stock != null && item.qty >= item.stock;

                        return (
                            <article
                                key={item.product}
                                className="group flex gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:gap-4 sm:p-4"
                            >
                                {/* Thumbnail */}
                                <Link
                                    href={`/products/${item.product}`}
                                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50 p-1.5 sm:h-28 sm:w-28"
                                >
                                    <img
                                        src={cld(item.image, 260)}
                                        alt={item.name}
                                        className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'https://placehold.co/200x200?text=Toy';
                                        }}
                                    />
                                </Link>

                                {/* Item Details & Controls */}
                                <div className="flex min-w-0 flex-1 flex-col justify-between">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <Link
                                                href={`/products/${item.product}`}
                                                className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors hover:text-blue-700 sm:text-base"
                                            >
                                                {item.name}
                                            </Link>
                                            <div className="mt-1 flex flex-wrap items-baseline gap-2">
                                                <span className="text-sm font-extrabold text-slate-900 sm:text-base">
                                                    {inr(item.price)}
                                                </span>
                                                {item.mrp > item.price && (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        {inr(item.mrp)}
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-medium text-slate-400">
                                                    each
                                                </span>
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item)}
                                            aria-label={`Remove ${item.name}`}
                                            title="Remove item"
                                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Quantity Stepper + Item Subtotal */}
                                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
                                        <div className="flex h-9 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
                                            <button
                                                type="button"
                                                onClick={() => handleDec(item)}
                                                aria-label="Decrease quantity"
                                                title="Decrease quantity"
                                                className="grid h-full w-8 place-items-center text-slate-700 transition-colors hover:bg-blue-600 hover:text-white active:scale-95 sm:w-9"
                                            >
                                                <Minus size={14} strokeWidth={2.4} />
                                            </button>

                                            <span
                                                className="min-w-7 px-1 text-center text-xs font-extrabold text-slate-900 sm:text-sm"
                                                aria-live="polite"
                                            >
                                                {item.qty}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleInc(item)}
                                                disabled={atMaxStock}
                                                aria-label="Increase quantity"
                                                title={atMaxStock ? 'Maximum stock reached' : 'Increase quantity'}
                                                className="grid h-full w-8 place-items-center text-slate-700 transition-colors hover:bg-blue-600 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 sm:w-9"
                                            >
                                                <Plus size={14} strokeWidth={2.4} />
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                                Item Total
                                            </p>
                                            <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                                                {inr(lineTotal)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* -------- Order Summary Sidebar -------- */}
                <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all lg:sticky lg:top-36 lg:col-span-4 sm:p-5">
                    <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                        <Tag size={17} className="text-blue-600" />
                        <span>Order Summary</span>
                    </h2>

                    <div className="mt-4 space-y-2.5 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Subtotal ({totalCount} {totalCount === 1 ? 'item' : 'items'})</span>
                            <span className="font-bold text-slate-800">{inr(subtotal)}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                            <span>Delivery Charges</span>
                            <span
                                className={
                                    shipping === 0
                                        ? 'font-extrabold text-emerald-600'
                                        : 'font-bold text-slate-800'
                                }
                            >
                                {shipping === 0 ? 'FREE' : inr(shipping)}
                            </span>
                        </div>

                        {shipping > 0 && (
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-800">
                                Add <strong className="font-bold">{inr(remainingForFreeDelivery)}</strong> more to get free delivery.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-slate-200/80 pt-3.5">
                        <div>
                            <span className="text-base font-extrabold text-slate-900">Total</span>
                            <p className="text-[11px] text-slate-400">Inclusive of all taxes (GST)</p>
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                            {inr(total)}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCheckout}
                        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                    >
                        <span>Proceed to Checkout</span>
                        <ArrowRight size={16} />
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                        <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
                        <span>Safe &amp; reliable checkout for kids&apos; essentials</span>
                    </div>
                </aside>
            </div>

            {/* Mobile & Tablet Sticky Checkout Bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total ({totalCount} {totalCount === 1 ? 'item' : 'items'})
                    </p>
                    <p className="truncate text-base font-extrabold leading-tight text-slate-900">
                        {inr(total)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCheckout}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 sm:h-11 sm:px-5 sm:text-sm"
                >
                    <span>Checkout</span>
                    <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}