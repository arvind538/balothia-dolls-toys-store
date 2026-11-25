'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Heart, Star, Minus, Plus, Eye } from 'lucide-react';
import { inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

// export function Stars({ value = 0, count }) {
//     return (
//         <div className="flex items-center gap-1">
//             <div className="flex items-center gap-0.5">
//                 {[1, 2, 3, 4, 5].map((i) => (
//                     <Star
//                         key={i}
//                         size={11}
//                         className={
//                             i <= Math.round(value)
//                                 ? 'fill-amber-400 text-amber-400'
//                                 : 'fill-slate-100 text-slate-300'
//                         }
//                     />
//                 ))}
//             </div>
//             {count != null && (
//                 <span className="text-[11px] font-medium text-slate-400">({count})</span>
//             )}
//         </div>
//     );
// }

export function Stars({ value = 0, count, size = 13, showValue = true }) {
    const v = Math.min(5, Math.max(0, Number(value) || 0));

    // A rating of 0 means the admin has not set a rating yet.
    if (v <= 0) return <span className="text-xs text-slate-400">No ratings yet</span>;

    return (
        <div className="flex items-center gap-1.5" aria-label={`Rated ${v.toFixed(1)} out of 5`}>
            <div className="relative inline-flex">
                {/* Grey stars underneath */}
                <div className="flex text-slate-300">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className="shrink-0 fill-current" />)}
                </div>
                {/* Amber stars on top, cut to the exact rating (for example 4.3 out of 5) */}
                <div className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-400" style={{ width: `${(v / 5) * 100}%` }}>
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className="shrink-0 fill-current" />)}
                </div>
            </div>
            {showValue && <span className="text-xs font-semibold text-slate-700">{v.toFixed(1)}</span>}
            {count > 0 && <span className="text-xs text-slate-500">({count})</span>}
        </div>
    );
}

export default function ProductCard({ p }) {
    const { add, setQty, remove, qtyOf } = useCart();
    const { isWished, toggleWish } = useAuth();

    const wished = isWished(p._id);
    const out = p.stock < 1;
    const qty = qtyOf(p._id);

    const discountPct =
        p.discount > 0
            ? Math.round(p.discount)
            : p.mrp > p.price
                ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
                : 0;

    const imgs = useMemo(() => {
        const list = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
        return list.length > 0 ? list : [null];
    }, [p.images]);

    const [activeIdx, setActiveIdx] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [failedMap, setFailedMap] = useState({});
    const touchStartX = useRef(null);

    useEffect(() => {
        if (!hovered || imgs.length <= 1) {
            setActiveIdx(0);
            return;
        }

        setActiveIdx(1);

        const timer = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % imgs.length);
        }, 1400);

        return () => clearInterval(timer);
    }, [hovered, imgs.length]);

    const inc = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (qty >= p.stock) {
            return toast.error(`Only ${p.stock} item${p.stock > 1 ? 's' : ''} available.`);
        }
        add(p, 1, true);
    };

    const dec = (e) => {
        e.preventDefault();
        e.stopPropagation();
        qty > 1 ? setQty(p._id, qty - 1) : remove(p._id);
    };

    const handleWish = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWish(p._id);
    };

    const handleImgError = (idx) => {
        setFailedMap((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));
    };

    const handleTouchStart = (e) => {
        if (e.touches?.length) {
            touchStartX.current = e.touches[0].clientX;
        }
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current == null || imgs.length <= 1) return;
        const endX = e.changedTouches?.[0]?.clientX;
        if (typeof endX !== 'number') return;

        const diff = endX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(diff) > 30) {
            setActiveIdx((prev) =>
                diff < 0 ? (prev + 1) % imgs.length : (prev - 1 + imgs.length) % imgs.length
            );
        }
    };

    // Show age group only once (in the top pill), and keep subtitle strictly for unit/category without repeating ageGroup
    const badgeLabel = p.ageGroup || p.category?.name || 'Classic Toy';
    const metaLabel =
        p.unit || (p.ageGroup && p.category?.name ? p.category.name : '');
    const showLowStock = !out && p.stock > 0 && p.stock <= 5;

    return (
        <article
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group relative flex h-full min-w-0 flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_10px_24px_-6px_rgba(15,23,42,0.1)] sm:p-3"
        >
            <div>
                {/* Image container with top-left discount tag & top-right wishlist */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-50"
                >
                    {!out && discountPct > 0 && (
                        <span className="pointer-events-none absolute left-2 top-0 z-20 rounded-b-md bg-blue-600 px-1.5 py-1 text-center text-[10px] font-extrabold leading-[1.1] tracking-tight text-white shadow-xs">
                            {discountPct}%
                            <span className="block text-[9px] font-bold">OFF</span>
                        </span>
                    )}

                    {out && (
                        <span className="pointer-events-none absolute left-2 top-2 z-20 rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Sold Out
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleWish}
                        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                        className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-xs ring-1 ring-slate-200/80 transition-all duration-200 hover:scale-105 hover:bg-rose-50 active:scale-95"
                    >
                        <Heart
                            size={13}
                            className={`transition-colors duration-200 ${wished ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                        />
                    </button>

                    <Link
                        href={`/products/${p._id}`}
                        className="relative block h-full w-full p-2"
                    >
                        {imgs.map((rawSrc, idx) => {
                            const isCurrent = idx === activeIdx;
                            const src = failedMap[idx]
                                ? 'https://placehold.co/600x600?text=Toy'
                                : cld(rawSrc, 450);

                            return (
                                <img
                                    key={`${rawSrc || 'fallback'}-${idx}`}
                                    src={src}
                                    alt={`${p.name} view ${idx + 1}`}
                                    loading={idx === 0 ? 'lazy' : 'eager'}
                                    onError={() => handleImgError(idx)}
                                    className={`absolute inset-0 h-full w-full object-contain p-2 transition-all duration-700 ease-in-out will-change-[opacity,transform] ${isCurrent
                                        ? hovered
                                            ? 'scale-[1.04] opacity-100'
                                            : 'scale-100 opacity-100'
                                        : 'pointer-events-none scale-[0.98] opacity-0'
                                        } ${out ? 'opacity-55 grayscale' : ''}`}
                                />
                            );
                        })}

                        {imgs.length <= 1 && (
                            <div className="pointer-events-none absolute inset-x-2 bottom-1.5 hidden translate-y-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:flex sm:justify-center">
                                <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200/70">
                                    <Eye size={10} className="text-blue-600" /> Quick View
                                </span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Single age/category pill + Rating */}
                <div className="mt-2 flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-200/70">
                        {badgeLabel}
                    </span>
                    {p.rating > 0 && <Stars value={p.rating} count={p.numReviews} />}
                </div>

                {/* Product title without forced blank gap */}
                <Link
                    href={`/products/${p._id}`}
                    className="mt-1 line-clamp-2 text-[13px] font-semibold leading-[1.35] text-slate-900 transition-colors duration-200 hover:text-blue-700 sm:text-sm"
                >
                    {p.name}
                </Link>

                {/* Optional unit/category & low-stock row (no duplicate ageGroup) */}
                {(metaLabel || showLowStock) && (
                    <div className="mt-1 flex items-center justify-between gap-1 text-xs text-slate-500">
                        {metaLabel && <span className="truncate">{metaLabel}</span>}
                        {showLowStock && (
                            <span className="ml-auto shrink-0 text-[10px] font-semibold text-rose-600">
                                Only {p.stock} left
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Price + Blue ADD / Active Stepper Row */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 leading-tight">
                    <div className="text-sm font-extrabold text-slate-900 sm:text-[15px]">
                        {inr(p.price)}
                    </div>
                    {p.mrp > p.price && (
                        <div className="text-[11px] font-medium text-slate-400 line-through">
                            {inr(p.mrp)}
                        </div>
                    )}
                </div>

                {out ? (
                    <button
                        type="button"
                        disabled
                        className="h-8 shrink-0 cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400"
                    >
                        OUT
                    </button>
                ) : qty > 0 ? (
                    /* Active Blue Quantity Stepper (- qty +) */
                    <div
                        role="group"
                        aria-label="Quantity controls"
                        className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg bg-blue-600 text-white shadow-xs transition-all duration-200"
                    >
                        <button
                            type="button"
                            onClick={dec}
                            aria-label="Decrease quantity"
                            className="grid h-full w-7 place-items-center transition-colors duration-150 hover:bg-blue-700 active:scale-95"
                        >
                            <Minus size={13} strokeWidth={2.6} />
                        </button>

                        <span
                            className="min-w-[1.5rem] px-1 text-center text-xs font-extrabold tabular-nums"
                            aria-live="polite"
                        >
                            {qty}
                        </span>

                        <button
                            type="button"
                            onClick={inc}
                            disabled={qty >= p.stock}
                            aria-label="Increase quantity"
                            className="grid h-full w-7 place-items-center transition-colors duration-150 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <Plus size={13} strokeWidth={2.6} />
                        </button>
                    </div>
                ) : (
                    /* Default Blue ADD button */
                    <button
                        type="button"
                        onClick={() => add(p)}
                        className="h-8 shrink-0 rounded-lg border border-blue-600 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-blue-600 transition-all duration-200 hover:bg-blue-600 hover:text-white active:scale-95"
                    >
                        ADD
                    </button>
                )}
            </div>
        </article>
    );
}

