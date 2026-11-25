'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Heart, ShoppingCart, Minus, Plus, Trash2, ChevronRight, ChevronLeft,
    ArrowLeft, Zap, ZoomIn, ZoomOut, ShieldCheck, Truck, RotateCcw,
    Sparkles, PackageCheck,
} from 'lucide-react';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Stars } from '@/components/ProductCard';
import ProductRow from '@/components/ProductRow';

const FALLBACK = 'https://placehold.co/800x800?text=Toy';
const clamp = (n) => Math.min(100, Math.max(0, n));
const pointOrigin = (x, y, el) => {
    const r = el.getBoundingClientRect();
    return {
        x: clamp(((x - r.left) / r.width) * 100),
        y: clamp(((y - r.top) / r.height) * 100),
    };
};

function CartControl({ p, h = 'h-11 sm:h-12' }) {
    const { add, setQty, remove, qtyOf } = useCart();
    const qty = qtyOf(p._id);
    const out = p.stock < 1;

    if (out) {
        return (
            <button
                type="button"
                disabled
                className={`flex ${h} w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-bold text-slate-400 sm:text-sm`}
            >
                Out of Stock
            </button>
        );
    }

    if (qty < 1) {
        return (
            <button
                type="button"
                onClick={() => add(p, 1)}
                className={`flex ${h} w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-4 text-xs font-bold text-blue-700 shadow-2xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-sm active:translate-y-0 active:scale-[0.98] sm:text-sm`}
            >
                <ShoppingCart size={16} strokeWidth={2.2} className="shrink-0" />
                <span className="truncate">Add to Cart</span>
            </button>
        );
    }

    const inc = () => {
        if (qty >= p.stock) {
            return toast.error(`Only ${p.stock} item${p.stock > 1 ? 's' : ''} available in stock.`);
        }
        add(p, 1, true);
    };

    const dec = () => (qty > 1 ? setQty(p._id, qty - 1) : remove(p._id));

    const stepBtn =
        'grid h-full w-10 shrink-0 place-items-center text-blue-700 transition-colors duration-150 hover:bg-blue-600 hover:text-white active:scale-95 sm:w-11 ' +
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-700';

    return (
        <div
            className={`flex ${h} w-full items-center justify-between overflow-hidden rounded-xl border border-blue-600 bg-blue-50/70`}
        >
            <button
                type="button"
                onClick={dec}
                aria-label={qty > 1 ? 'Decrease quantity' : 'Remove item from cart'}
                title={qty > 1 ? 'Decrease quantity' : 'Remove item from cart'}
                className={stepBtn}
            >
                {qty > 1 ? <Minus size={15} strokeWidth={2.5} /> : <Trash2 size={14} />}
            </button>

            <span className="min-w-7 px-1 text-center text-xs font-extrabold text-blue-900 sm:text-sm" aria-live="polite">
                {qty}
            </span>

            <button
                type="button"
                onClick={inc}
                disabled={qty >= p.stock}
                aria-label="Increase quantity"
                title="Increase quantity"
                className={stepBtn}
            >
                <Plus size={15} strokeWidth={2.5} />
            </button>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="wrap py-6 sm:py-8">
            <div className="mb-5 h-4 w-56 animate-pulse rounded bg-slate-200" />
            <div className="grid gap-6 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-6">
                    <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-slate-200 sm:aspect-square" />
                </div>
                <div className="space-y-4 md:col-span-6">
                    <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200" />
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { add, qtyOf } = useCart();
    const { isWished, toggleWish } = useAuth();

    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [img, setImg] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });
    const touchX = useRef(null);

    useEffect(() => {
        let alive = true;
        setErr('');
        setImg(0);
        setZoomed(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        api(`/products/${id}`, { auth: false })
            .then((d) => alive && setData(d))
            .catch((e) => alive && setErr(e.message));

        return () => {
            alive = false;
        };
    }, [id]);

    useEffect(() => {
        setZoomed(false);
    }, [img]);

    useEffect(() => {
        if (!zoomed) return;
        const onKey = (e) => e.key === 'Escape' && setZoomed(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [zoomed]);

    if (err) {
        return (
            <div className="wrap py-20 text-center">
                <p className="text-5xl">🧸</p>
                <h1 className="mt-3 text-xl font-bold text-[#0b2a5b]">Product Not Found</h1>
                <p className="mt-1 text-sm text-slate-500">{err}</p>
                <Link
                    href="/products"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <ArrowLeft size={16} /> Browse All Toys
                </Link>
            </div>
        );
    }

    if (!data?.product) return <Skeleton />;

    const { product: p, related = [] } = data;
    const images = Array.isArray(p.images) && p.images.length ? p.images.filter(Boolean) : [FALLBACK];
    const safeImages = images.length ? images : [FALLBACK];
    const currentSrc = safeImages[img] ? cld(safeImages[img], 700) : FALLBACK;

    const out = p.stock < 1;
    const inCart = qtyOf(p._id);
    const savings = p.mrp > p.price ? p.mrp - p.price : 0;
    const wished = isWished(p._id);

    const descriptionParagraphs = p.description
        ? p.description
            .split(/\n+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const go = (d) => setImg((i) => (i + d + safeImages.length) % safeImages.length);

    const buyNow = () => {
        if (!out && inCart < 1) add(p, 1, true);
        router.push('/checkout');
    };

    const toggleZoom = (e) => {
        if (!zoomed) setOrigin(pointOrigin(e.clientX, e.clientY, e.currentTarget));
        setZoomed((z) => !z);
    };

    const onKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setZoomed((z) => !z);
        }
    };

    const onMove = (e) => {
        if (zoomed) setOrigin(pointOrigin(e.clientX, e.clientY, e.currentTarget));
    };

    const onTouchStart = (e) => {
        touchX.current = zoomed ? null : e.touches[0].clientX;
    };

    const onTouchMove = (e) => {
        if (zoomed) setOrigin(pointOrigin(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget));
    };

    const onTouchEnd = (e) => {
        if (zoomed || touchX.current == null || safeImages.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    };

    const arrow =
        'absolute top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-all duration-150 hover:border-blue-600 hover:bg-blue-600 hover:text-white ' +
        'opacity-100 md:opacity-0 md:group-hover:opacity-100';

    return (
        <div className="wrap pb-24 pt-4 sm:pt-6 md:pb-12">
            {/* Breadcrumb */}
            <nav
                aria-label="Breadcrumb"
                className="no-scrollbar mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs text-slate-500 sm:mb-5 sm:text-sm"
            >
                <Link href="/" className="transition hover:text-blue-700 hover:underline">
                    Home
                </Link>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
                {p.category && (
                    <>
                        <Link
                            href={`/products?category=${p.category.slug}`}
                            className="transition hover:text-blue-700 hover:underline"
                        >
                            {p.category.name}
                        </Link>
                        <ChevronRight size={14} className="shrink-0 text-slate-300" />
                    </>
                )}
                <span
                    aria-current="page"
                    className="max-w-[55vw] truncate font-semibold text-slate-800 sm:max-w-md"
                >
                    {p.name}
                </span>
            </nav>

            {/* Main Grid */}
            <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8 lg:gap-10">
                {/* Left: Main Image + Thumbnails */}
                <div className="md:col-span-6 md:sticky md:top-20">
                    <div className="mx-auto flex w-full max-w-[500px] flex-col gap-3 sm:flex-row sm:items-start">
                        {/* Desktop Vertical Thumbnails */}
                        {safeImages.length > 1 && (
                            <div
                                role="tablist"
                                aria-label="Product gallery thumbnails"
                                className="no-scrollbar hidden sm:flex sm:max-h-[380px] sm:w-14 sm:shrink-0 sm:flex-col sm:overflow-y-auto sm:pr-0.5 md:w-[58px]"
                            >
                                {safeImages.map((src, i) => {
                                    const active = i === img;
                                    return (
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            key={`${src}-${i}`}
                                            onClick={() => setImg(i)}
                                            onMouseEnter={() => setImg(i)}
                                            aria-label={`View image ${i + 1}`}
                                            className={`group/thumb relative mb-2 h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition-all duration-200 last:mb-0 ${active
                                                ? 'border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                                                : 'border-slate-200/90 opacity-75 hover:border-blue-300 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={cld(src, 140)}
                                                alt={`${p.name} thumbnail ${i + 1}`}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = FALLBACK;
                                                }}
                                                className="h-full w-full object-contain transition-transform duration-200 group-hover/thumb:scale-105"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Main Zoomable Image Box */}
                        <div className="group relative aspect-[4/3] w-full min-w-0 flex-1 select-none overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 shadow-2xs sm:aspect-square sm:max-h-[380px]">
                            <div
                                role="button"
                                tabIndex={0}
                                aria-label={zoomed ? 'Zoom out image' : 'Zoom in image'}
                                aria-pressed={zoomed}
                                onClick={toggleZoom}
                                onKeyDown={onKey}
                                onMouseMove={onMove}
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                                style={{ touchAction: zoomed ? 'none' : 'pan-y' }}
                                className={`h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                                    }`}
                            >
                                <img
                                    key={`${p._id}-${img}`}
                                    src={currentSrc}
                                    alt={p.name}
                                    draggable={false}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = FALLBACK;
                                    }}
                                    className={`pointer-events-none block h-full w-full object-contain p-3 transition-transform duration-300 ease-out sm:p-4 ${zoomed
                                        ? 'scale-[2]'
                                        : 'scale-100 group-hover:scale-[1.03]'
                                        }`}
                                    style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
                                />
                            </div>

                            {p.discount > 0 && !out && (
                                <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                                    {p.discount}% OFF
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => toggleWish(p._id)}
                                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                                title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-slate-200/80 bg-white/95 shadow-xs transition-all duration-150 hover:scale-105 hover:border-rose-200 hover:bg-rose-50 active:scale-95"
                            >
                                <Heart
                                    size={14}
                                    className={`transition-colors ${wished
                                        ? 'fill-rose-500 text-rose-500'
                                        : 'text-slate-600 hover:text-rose-500'
                                        }`}
                                />
                            </button>

                            {safeImages.length > 1 && !zoomed && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => go(-1)}
                                        aria-label="Previous image"
                                        className={`${arrow} left-2.5`}
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => go(1)}
                                        aria-label="Next image"
                                        className={`${arrow} right-2.5`}
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </>
                            )}

                            <span className="pointer-events-none absolute bottom-2.5 left-3 z-10 flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                                {zoomed ? <ZoomOut size={11} /> : <ZoomIn size={11} />}
                                <span>
                                    <span className="hidden md:inline">Click</span>
                                    <span className="md:hidden">Tap</span>{' '}
                                    {zoomed ? 'to reset' : 'to zoom'}
                                </span>
                            </span>

                            {safeImages.length > 1 && (
                                <span className="pointer-events-none absolute bottom-2.5 right-3 z-10 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                    {img + 1}/{safeImages.length}
                                </span>
                            )}
                        </div>

                        {/* Mobile Horizontal Thumbnails Below Main Image */}
                        {safeImages.length > 1 && (
                            <div
                                role="tablist"
                                aria-label="Product gallery thumbnails mobile"
                                className="no-scrollbar flex justify-center gap-2 overflow-x-auto pb-1 sm:hidden"
                            >
                                {safeImages.map((src, i) => {
                                    const active = i === img;
                                    return (
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            key={`m-${src}-${i}`}
                                            onClick={() => setImg(i)}
                                            aria-label={`View image ${i + 1}`}
                                            className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition-all duration-200 ${active
                                                ? 'border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                                                : 'border-slate-200/90 opacity-75'
                                                }`}
                                        >
                                            <img
                                                src={cld(src, 140)}
                                                alt={`${p.name} thumbnail ${i + 1}`}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = FALLBACK;
                                                }}
                                                className="h-full w-full object-contain"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="min-w-0 md:col-span-6">
                    {p.category && (
                        <Link
                            href={`/products?category=${p.category.slug}`}
                            className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                        >
                            {p.category.name}
                        </Link>
                    )}

                    <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        {p.name}
                    </h1>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                        <Stars value={p.rating} count={p.numReviews} />
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500">
                            Kid-Safe &amp; Quality Checked
                        </span>
                    </div>

                    {/* Price & Stock Box */}
                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                {inr(p.price)}
                            </span>
                            {p.mrp > p.price && (
                                <>
                                    <span className="text-sm font-medium text-slate-400 line-through">
                                        {inr(p.mrp)}
                                    </span>
                                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                                        {p.discount}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            {savings > 0 && !out && (
                                <span className="font-bold text-emerald-700">
                                    You save {inr(savings)}
                                </span>
                            )}
                            <span className="text-slate-500">Inclusive of all taxes (GST)</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${out
                                    ? 'bg-rose-100 text-rose-700'
                                    : p.stock <= 5
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${out
                                        ? 'bg-rose-600'
                                        : p.stock <= 5
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-600'
                                        }`}
                                />
                                {out
                                    ? 'Out of Stock'
                                    : p.stock <= 5
                                        ? `Only ${p.stock} left in stock`
                                        : 'In Stock & Ready to Ship'}
                            </span>

                            {p.ageGroup && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-3 py-1 font-semibold text-blue-800">
                                    <Sparkles size={12} /> Age: {p.ageGroup} yrs
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Desktop/Tablet Buttons */}
                    <div className="mt-4 hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
                        <CartControl p={p} h="h-11 sm:h-12" />
                        <button
                            type="button"
                            disabled={out}
                            onClick={buyNow}
                            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold transition-all duration-200 ease-out sm:h-12 sm:text-sm ${out
                                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                                : 'bg-blue-600 text-white shadow-xs hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:translate-y-0 active:scale-[0.98]'
                                }`}
                        >
                            <Zap size={16} strokeWidth={2.2} className="shrink-0" />
                            <span>Buy Now</span>
                        </button>
                    </div>

                    {!out && inCart >= p.stock && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                            Maximum available stock ({p.stock}) is already in your cart.
                        </p>
                    )}

                    {/* Trust Strip */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center sm:p-3">
                        <div className="flex flex-col items-center gap-1">
                            <Truck size={17} className="text-blue-600" />
                            <span className="text-[11px] font-semibold text-slate-700">Fast Delivery</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 border-x border-slate-100">
                            <ShieldCheck size={17} className="text-emerald-600" />
                            <span className="text-[11px] font-semibold text-slate-700">Child-Safe Quality</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <RotateCcw size={17} className="text-amber-600" />
                            <span className="text-[11px] font-semibold text-slate-700">Easy Support</span>
                        </div>
                    </div>

                    {/* Full Description */}
                    <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
                        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <PackageCheck size={17} className="text-blue-600" />
                            <span>Product Description &amp; Details</span>
                        </h2>

                        {descriptionParagraphs.length > 0 ? (
                            <div className="mt-2.5 space-y-2 text-sm leading-relaxed text-slate-600">
                                {descriptionParagraphs.map((para, idx) => (
                                    <p key={idx}>{para}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                                {p.name} is designed for engaging play, learning, and everyday comfort. Made
                                with child-friendly materials and thoughtful detailing for kids and gifting.
                            </p>
                        )}
                    </div>

                    {/* Specifications */}
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Specifications
                            </h3>
                        </div>
                        <dl className="divide-y divide-slate-100 text-sm">
                            {[
                                ['Product Name', p.name],
                                ['Category', p.category?.name || 'General Toys'],
                                ['Age Group', p.ageGroup ? `${p.ageGroup} years` : 'All Ages'],
                                ['Availability', out ? 'Out of Stock' : `In Stock`],
                                ['MRP', inr(p.mrp)],
                                ['Selling Price', inr(p.price)],
                            ].map(([label, val]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-slate-50/70"
                                >
                                    <dt className="shrink-0 text-slate-500">{label}</dt>
                                    <dd className="min-w-0 break-words text-right font-semibold text-slate-800">{val}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
                <section className="mt-10 sm:mt-12">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                            You May Also Like
                        </h2>
                        {p.category && (
                            <Link
                                href={`/products?category=${p.category.slug}`}
                                className="text-xs font-bold text-blue-600 hover:underline sm:text-sm"
                            >
                                View All →
                            </Link>
                        )}
                    </div>
                    <ProductRow key={p._id} items={related} />
                </section>
            )}

            {/* Mobile Sticky Bottom Bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 border-t border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md sm:hidden">
                <div className="shrink-0 pr-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Price
                    </p>
                    <p className="text-sm font-extrabold leading-tight text-slate-900">
                        {inr(p.price)}
                    </p>
                </div>
                <div className="min-w-0 flex-1">
                    <CartControl p={p} h="h-11" />
                </div>
                <button
                    type="button"
                    disabled={out}
                    onClick={buyNow}
                    className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${out
                        ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                        }`}
                >
                    <Zap size={14} className="shrink-0" />
                    <span>Buy Now</span>
                </button>
            </div>
        </div>
    );
}