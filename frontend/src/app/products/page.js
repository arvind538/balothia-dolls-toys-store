'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    SlidersHorizontal,
    X,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import CategoryIcon from '@/components/CategoryIcon';

const AGE = ['0-3', '3-6', '6-9', '9-12', '12+'];
const PRICES = [
    ['Under ₹500', '', '500'],
    ['₹500 – ₹1,000', '500', '1000'],
    ['₹1,000 – ₹2,000', '1000', '2000'],
    ['Above ₹2,000', '2000', ''],
];
const RATINGS = [4, 3];
const SORTS = [
    ['newest', 'Newest'],
    ['popular', 'Best Selling'],
    ['price-asc', 'Price: Low to High'],
    ['price-desc', 'Price: High to Low'],
    ['rating', 'Top Rated'],
];

/* ---------- Sidebar sticky top & height calculation ---------- */
function useStickyAside() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let raf = 0;
        const calc = () => {
            raf = 0;
            const h = document.getElementById('site-header');
            const bottom = h ? Math.max(h.getBoundingClientRect().bottom, 0) : 0;
            const top = bottom + 12;
            el.style.top = `${top}px`;
            el.style.maxHeight = `${Math.max(window.innerHeight - top - 16, 260)}px`;
        };
        const on = () => {
            if (!raf) raf = requestAnimationFrame(calc);
        };
        calc();
        window.addEventListener('scroll', on, { passive: true });
        window.addEventListener('resize', on);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', on);
            window.removeEventListener('resize', on);
        };
    }, []);
    return ref;
}

/* ---------- Reusable Filter Option ---------- */
function Option({ checked, onClick, round, children }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={onClick}
            className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150 active:scale-[0.99] ${checked
                ? 'bg-blue-50 font-semibold text-blue-800'
                : 'text-slate-700 hover:bg-slate-100/80'
                }`}
        >
            <span
                className={`grid h-[18px] w-[18px] shrink-0 place-items-center border transition-all duration-150 ${round ? 'rounded-full' : 'rounded'
                    } ${checked
                        ? 'border-blue-700 bg-blue-700 shadow-2xs'
                        : 'border-slate-300 bg-white group-hover:border-blue-500'
                    }`}
            >
                {checked &&
                    (round ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : (
                        <Check size={12} strokeWidth={3} className="text-white" />
                    ))}
            </span>
            <span className="min-w-0 flex-1 truncate">{children}</span>
        </button>
    );
}

/* ---------- Collapsible Filter Section ---------- */
function Group({ title, active = 0, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-1">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-slate-50"
            >
                <span className="flex items-center font-bold text-[#0b2a5b]">
                    <span>{title}</span>
                    {active > 0 && (
                        <span className="ml-2 rounded-full bg-blue-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {active}
                        </span>
                    )}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''
                        }`}
                />
            </button>
            {open && <div className="anim-fade space-y-0.5 pt-1">{children}</div>}
        </div>
    );
}

/* ---------- Custom Price Range Form ---------- */
function PriceRange({ min, max, apply }) {
    const [a, setA] = useState(min);
    const [b, setB] = useState(max);
    useEffect(() => {
        setA(min);
        setB(max);
    }, [min, max]);
    const bad = a !== '' && b !== '' && Number(a) > Number(b);
    const submit = (e) => {
        e.preventDefault();
        if (!bad) apply(a, b);
    };
    return (
        <form onSubmit={submit} className="mt-2 px-1">
            <div className="flex items-center gap-1.5">
                <input
                    inputMode="numeric"
                    value={a}
                    onChange={(e) => setA(e.target.value.replace(/\D/g, ''))}
                    placeholder="Min ₹"
                    aria-label="Minimum price"
                    className="input min-w-0 flex-1 !px-2 !py-1.5 text-xs"
                />
                <span className="text-slate-400">–</span>
                <input
                    inputMode="numeric"
                    value={b}
                    onChange={(e) => setB(e.target.value.replace(/\D/g, ''))}
                    placeholder="Max ₹"
                    aria-label="Maximum price"
                    className="input min-w-0 flex-1 !px-2 !py-1.5 text-xs"
                />
                <button disabled={bad || (a === '' && b === '')} className="btn !px-3 !py-1.5 text-xs">
                    Go
                </button>
            </div>
            {bad && <p className="mt-1 text-xs text-red-600">Min, Max se zyada nahi ho sakta</p>}
        </form>
    );
}

/* ---------- Unified Smooth Filters List (Single Scroll Flow) ---------- */
function Filters({ sp, cats, toggleList, update }) {
    const [catQuery, setCatQuery] = useState('');
    const [showAllCats, setShowAllCats] = useState(false);

    const selectedCats = useMemo(
        () => (sp.get('category') || '').split(',').filter(Boolean),
        [sp]
    );

    const filteredCats = useMemo(() => {
        const q = catQuery.trim().toLowerCase();
        const list = q ? cats.filter((c) => c.name.toLowerCase().includes(q)) : cats;
        return [...list].sort((a, b) => {
            const aSel = selectedCats.includes(a.slug) ? 0 : 1;
            const bSel = selectedCats.includes(b.slug) ? 0 : 1;
            return aSel - bSel;
        });
    }, [cats, catQuery, selectedCats]);

    // Default 8 categories dikhayein aur "Show more" se baaki khulein (taaki bina nested scrollbar ke sab smoothly scroll ho)
    const INITIAL_CAT_LIMIT = 8;
    const isSearching = catQuery.trim().length > 0;
    const visibleCats =
        isSearching || showAllCats
            ? filteredCats
            : filteredCats.slice(0, Math.max(INITIAL_CAT_LIMIT, selectedCats.length));
    const hiddenCount = Math.max(0, filteredCats.length - visibleCats.length);

    const list = (k) => (sp.get(k) || '').split(',').filter(Boolean);
    const has = (k, v) => list(k).includes(v);
    const minP = sp.get('minPrice') || '';
    const maxP = sp.get('maxPrice') || '';
    const isPrice = (a, b) => minP === a && maxP === b;
    const rating = sp.get('rating') || '';

    const togglePrice = (a, b) =>
        isPrice(a, b) ? update({ minPrice: '', maxPrice: '' }) : update({ minPrice: a, maxPrice: b });
    const toggleRating = (r) =>
        rating === String(r) ? update({ rating: '' }) : update({ rating: r });
    const toggleFlag = (k) => update({ [k]: sp.get(k) === 'true' ? '' : 'true' });

    return (
        <div className="space-y-1.5 text-sm">
            <Group title="Categories" active={selectedCats.length}>
                {cats.length > 6 && (
                    <div className="relative mb-2 px-1">
                        <Search
                            size={13}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={catQuery}
                            onChange={(e) => setCatQuery(e.target.value)}
                            placeholder="Find category..."
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-7 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                        {catQuery && (
                            <button
                                type="button"
                                onClick={() => setCatQuery('')}
                                aria-label="Clear category search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                )}

                <div className="space-y-0.5">
                    {visibleCats.length === 0 ? (
                        <p className="py-3 text-center text-xs text-slate-400">No category found</p>
                    ) : (
                        visibleCats.map((c) => (
                            <Option
                                key={c._id}
                                checked={has('category', c.slug)}
                                onClick={() => toggleList('category', c.slug)}
                            >
                                <span className="flex items-center gap-2.5">
                                    <CategoryIcon c={c} size={24} rounded="rounded" />
                                    <span className="truncate">{c.name}</span>
                                </span>
                            </Option>
                        ))
                    )}
                </div>

                {!isSearching && filteredCats.length > INITIAL_CAT_LIMIT && (
                    <button
                        type="button"
                        onClick={() => setShowAllCats((v) => !v)}
                        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50"
                    >
                        <span>
                            {showAllCats ? 'Show fewer categories' : `+${hiddenCount} more categories`}
                        </span>
                        <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${showAllCats ? 'rotate-180' : ''
                                }`}
                        />
                    </button>
                )}
            </Group>

            <Group title="Age Group" active={list('ageGroup').length}>
                {AGE.map((a) => (
                    <Option key={a} checked={has('ageGroup', a)} onClick={() => toggleList('ageGroup', a)}>
                        {a} Years
                    </Option>
                ))}
            </Group>

            <Group title="Price" active={minP || maxP ? 1 : 0}>
                {PRICES.map(([l, a, b]) => (
                    <Option key={l} round checked={isPrice(a, b)} onClick={() => togglePrice(a, b)}>
                        {l}
                    </Option>
                ))}
                <PriceRange min={minP} max={maxP} apply={(a, b) => update({ minPrice: a, maxPrice: b })} />
            </Group>

            <Group title="Rating" active={rating ? 1 : 0}>
                {RATINGS.map((r) => (
                    <Option key={r} round checked={rating === String(r)} onClick={() => toggleRating(r)}>
                        {r}★ &amp; above
                    </Option>
                ))}
            </Group>

            <Group
                title="Availability"
                active={(sp.get('inStock') === 'true' ? 1 : 0) + (sp.get('offers') === 'true' ? 1 : 0)}
            >
                <Option checked={sp.get('inStock') === 'true'} onClick={() => toggleFlag('inStock')}>
                    In stock only
                </Option>
                <Option checked={sp.get('offers') === 'true'} onClick={() => toggleFlag('offers')}>
                    Offers / Discounted
                </Option>
            </Group>
        </div>
    );
}

const pageList = (page, pages) => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const s = new Set([1, pages, page - 1, page, page + 1]);
    if (page <= 3) [2, 3, 4].forEach((n) => s.add(n));
    if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((n) => s.add(n));
    const arr = [...s].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    const out = [];
    arr.forEach((n, i) => {
        if (i && n - arr[i - 1] > 1) out.push(`gap${n}`);
        out.push(n);
    });
    return out;
};

/* ---------- Main Shop Component ---------- */
function Shop() {
    const sp = useSearchParams();
    const router = useRouter();
    const asideRef = useStickyAside();
    const topRef = useRef(null);

    const [data, setData] = useState(null);
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const qs = sp.toString();
    const page = Number(sp.get('page') || 1);

    useEffect(() => {
        api('/categories', { auth: false })
            .then(setCats)
            .catch(() => { });
    }, []);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        api(`/products?limit=12&${qs}`, { auth: false })
            .then((d) => alive && setData(d))
            .catch((e) => alive && toast.error(e.message))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [qs]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open]);

    const update = useCallback(
        (obj) => {
            const p = new URLSearchParams(sp.toString());
            Object.entries(obj).forEach(([k, v]) =>
                v === '' || v == null || v === false ? p.delete(k) : p.set(k, v)
            );
            if (!('page' in obj) || obj.page === 1) p.delete('page');
            const q = p.toString();
            router.replace(q ? `/products?${q}` : '/products', { scroll: false });
        },
        [sp, router]
    );

    const toggleList = (key, val) => {
        const cur = (sp.get(key) || '').split(',').filter(Boolean);
        update({
            [key]: (cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]).join(','),
        });
    };
    const clear = () => router.replace('/products', { scroll: false });
    const goPage = (n) => {
        update({ page: n });
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ---- Active filter chips ---- */
    const minP = sp.get('minPrice');
    const maxP = sp.get('maxPrice');
    const chips = [];
    if (sp.get('search'))
        chips.push({
            id: 'search',
            label: `“${sp.get('search')}”`,
            remove: () => update({ search: '' }),
        });
    (sp.get('category') || '')
        .split(',')
        .filter(Boolean)
        .forEach((slug) => {
            const c = cats.find((x) => x.slug === slug);
            chips.push({
                id: `c-${slug}`,
                label: c ? `${c.icon || ''} ${c.name}`.trim() : slug,
                remove: () => toggleList('category', slug),
            });
        });
    (sp.get('ageGroup') || '')
        .split(',')
        .filter(Boolean)
        .forEach((a) =>
            chips.push({ id: `a-${a}`, label: `${a} yrs`, remove: () => toggleList('ageGroup', a) })
        );
    if (minP || maxP) {
        const label =
            minP && maxP
                ? `${inr(minP)} – ${inr(maxP)}`
                : minP
                    ? `${inr(minP)}+`
                    : `Under ${inr(maxP)}`;
        chips.push({ id: 'price', label, remove: () => update({ minPrice: '', maxPrice: '' }) });
    }
    if (sp.get('rating'))
        chips.push({
            id: 'rating',
            label: `${sp.get('rating')}★ & above`,
            remove: () => update({ rating: '' }),
        });
    if (sp.get('inStock') === 'true')
        chips.push({ id: 'stock', label: 'In stock', remove: () => update({ inStock: '' }) });
    if (sp.get('offers') === 'true')
        chips.push({ id: 'offers', label: 'Offers', remove: () => update({ offers: '' }) });

    const selectedCats = (sp.get('category') || '').split(',').filter(Boolean);
    const oneCat = selectedCats.length === 1 ? cats.find((c) => c.slug === selectedCats[0]) : null;
    const title = sp.get('search')
        ? `Results for “${sp.get('search')}”`
        : oneCat
            ? `${oneCat.name}`
            : 'Electronic Toys & Learning';

    const items = data?.items || [];
    const total = data?.total ?? 0;
    const pages = data?.pages ?? 1;
    const fp = { sp, cats, toggleList, update };

    return (
        <div className="wrap py-5 sm:py-7">
            <div ref={topRef} className="scroll-mt-44" />

            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-xl font-extrabold text-[#0b2a5b] sm:text-2xl">
                        {title}
                    </h1>
                    <p className="text-xs text-slate-500 sm:text-sm">
                        {data ? `${total} products` : 'Loading…'}
                    </p>
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="btn-outline flex-1 justify-center sm:flex-none lg:hidden"
                    >
                        <SlidersHorizontal size={16} />
                        <span>Filters</span>
                        {chips.length > 0 && (
                            <span className="rounded-full bg-blue-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {chips.length}
                            </span>
                        )}
                    </button>

                    <select
                        aria-label="Sort products"
                        value={sp.get('sort') || 'newest'}
                        onChange={(e) => update({ sort: e.target.value })}
                        className="input flex-1 sm:!w-auto sm:flex-none"
                    >
                        {SORTS.map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {chips.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {chips.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={c.remove}
                            title="Remove filter"
                            className="anim-fade group flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-100"
                        >
                            <span>{c.label}</span>
                            <X
                                size={13}
                                className="text-blue-500 transition-colors group-hover:text-red-500"
                            />
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={clear}
                        className="px-2 text-xs font-semibold text-slate-500 underline-offset-2 transition-colors hover:text-red-600 hover:underline"
                    >
                        Clear all
                    </button>
                </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[268px_1fr]">
                {/* Desktop Sidebar — Single unified smooth scroll container */}
                <aside
                    ref={asideRef}
                    className="card sticky top-3 hidden self-start overflow-y-auto overscroll-y-auto scroll-smooth p-3.5 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5 lg:block"
                >
                    <div className="sticky -top-3.5 z-10 -mx-3.5 -mt-3.5 mb-2 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-2.5 backdrop-blur-xs">
                        <span className="flex items-center gap-2 font-extrabold text-[#0b2a5b]">
                            <SlidersHorizontal size={16} />
                            <span>Filters</span>
                        </span>
                        {chips.length > 0 && (
                            <button
                                type="button"
                                onClick={clear}
                                className="text-xs font-semibold text-blue-700 hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                    <Filters {...fp} />
                </aside>

                {/* Products Grid */}
                <div className="relative min-w-0">
                    {loading && data && (
                        <div className="absolute inset-x-0 -top-2 z-10 h-0.5 overflow-hidden rounded bg-blue-100">
                            <div className="h-full w-1/2 animate-pulse rounded bg-blue-600" />
                        </div>
                    )}

                    {!data ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-100" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="anim-fade grid place-items-center rounded-2xl border border-dashed py-20 px-4 text-center">
                            <div>
                                <SearchX className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-3 font-semibold text-slate-700">No products found</p>
                                <p className="text-sm text-slate-500">
                                    Try removing some filters or searching for something else.
                                </p>
                                <button type="button" onClick={clear} className="btn mt-4">
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ease-out sm:gap-4 md:grid-cols-3 xl:grid-cols-4 ${loading ? 'pointer-events-none opacity-55' : 'opacity-100'
                                }`}
                        >
                            {items.map((p) => (
                                <ProductCard key={p._id} p={p} />
                            ))}
                        </div>
                    )}

                    {pages > 1 && (
                        <nav
                            aria-label="Pagination"
                            className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
                        >
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => goPage(page - 1)}
                                aria-label="Previous page"
                                className="grid h-9 w-9 place-items-center rounded-lg border transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {pageList(page, pages).map((n) =>
                                typeof n === 'string' ? (
                                    <span key={n} className="px-1 text-slate-400">
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => goPage(n)}
                                        aria-current={n === page ? 'page' : undefined}
                                        className={`h-9 min-w-9 rounded-lg border px-2 text-sm font-semibold transition ${n === page
                                            ? 'border-blue-700 bg-blue-700 text-white'
                                            : 'hover:bg-blue-50'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                )
                            )}
                            <button
                                type="button"
                                disabled={page >= pages}
                                onClick={() => goPage(page + 1)}
                                aria-label="Next page"
                                className="grid h-9 w-9 place-items-center rounded-lg border transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                    )}
                </div>
            </div>

            {/* Mobile & Tablet Filter Drawer (Unified Smooth Touch Scroll) */}
            <div
                className={`fixed inset-0 z-50 lg:hidden ${open ? 'visible' : 'invisible'}`}
                aria-hidden={!open}
            >
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'
                        }`}
                    onClick={() => setOpen(false)}
                />
                <div
                    className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[86dvh] w-full max-w-xl flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'
                        }`}
                >
                    <div className="flex shrink-0 items-center justify-between border-b px-4 py-3.5">
                        <span className="flex items-center gap-2 font-extrabold text-[#0b2a5b]">
                            <SlidersHorizontal size={16} />
                            <span>Filters</span>
                        </span>
                        <div className="flex items-center gap-3">
                            {chips.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clear}
                                    className="text-xs font-bold text-blue-700 sm:text-sm"
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close filters"
                                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-3 [-webkit-overflow-scrolling:touch]">
                        <Filters {...fp} />
                    </div>

                    <div className="shrink-0 border-t bg-white p-3.5">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="btn w-full !py-3 text-sm font-bold"
                        >
                            Show {total} products
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="wrap py-20 text-center text-slate-500">Loading…</div>}>
            <Shop />
        </Suspense>
    );
}