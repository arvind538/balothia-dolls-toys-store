'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Plus, Pencil, Trash2, X, ImagePlus, Loader2, Star, Search, MoreVertical,
    Copy, Eye, EyeOff, PackageCheck, ArrowDown, Info, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr, uploadImages } from '@/lib/api';
import { cld } from '@/lib/img';

const AGES = ['0-3', '3-6', '6-9', '9-12', '12+'];
const MAX_IMAGES = 6;
const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMPTY = {
    name: '', description: '', category: '', ageGroup: '6-9',
    price: '', mrp: '', stock: 0, rating: 0, numReviews: 0,
    images: [], tags: '', isFeatured: false, isBestSeller: false, isActive: true,
};
const SORTS = [
    ['newest', 'Newest first'],
    ['sold', 'Best selling'],
    ['stock-asc', 'Lowest stock'],
    ['price-asc', 'Price: low to high'],
    ['price-desc', 'Price: high to low'],
    ['rating', 'Top rated'],
    ['name', 'Name: A to Z'],
];

/* ---------- Small reusable parts ---------- */

function Label({ title, children }) {
    return (
        <label className="block text-xs font-semibold text-slate-700">
            {title}
            {children}
        </label>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-700">
            <span className="relative inline-flex h-6 w-11 items-center">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
                <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-[#0b2a5b] peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300" />
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
            </span>
            {label}
        </label>
    );
}

function Thumb({ src, size = 100, className = '' }) {
    if (!src) {
        return <div className={`${className} grid place-items-center bg-slate-100 text-[10px] font-medium text-slate-400`}>No image</div>;
    }
    return (
        <img
            src={cld(src, size)}
            alt=""
            loading="lazy"
            className={className}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/100?text=No+Image'; }}
        />
    );
}

// Small star display, used for the rating preview and the mobile cards.
function MiniStars({ value = 0, count = 0 }) {
    const v = Math.min(5, Math.max(0, Number(value) || 0));
    if (v <= 0) return <span className="text-xs text-slate-400">No ratings yet</span>;
    return (
        <div className="flex items-center gap-1.5">
            <div className="relative inline-flex">
                <div className="flex text-slate-300">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className="shrink-0 fill-current" />)}</div>
                <div className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-400" style={{ width: `${(v / 5) * 100}%` }}>
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className="shrink-0 fill-current" />)}
                </div>
            </div>
            <span className="text-xs font-semibold text-slate-700">{v.toFixed(1)}</span>
            {count > 0 && <span className="text-xs text-slate-500">({count})</span>}
        </div>
    );
}

// Inline stock editor. Press Enter or click Save.
function StockCell({ p, onSaved }) {
    const [v, setV] = useState(p.stock);
    const [saving, setSaving] = useState(false);
    useEffect(() => setV(p.stock), [p.stock]);
    const dirty = Number(v) !== p.stock;

    const save = async () => {
        if (!dirty || saving) return;
        if (v === '' || Number(v) < 0) return toast.error('Please enter a valid stock quantity');
        setSaving(true);
        try {
            await api(`/admin/products/${p._id}/stock`, { method: 'PATCH', body: { stock: Number(v) } });
            toast.success('Stock updated');
            onSaved();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <input
                type="number" min="0" value={v} aria-label="Stock"
                onChange={(e) => setV(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className={`input !w-20 !py-1.5 text-center font-medium ${p.stock <= 5 ? 'border-red-400 bg-red-50/40 text-red-700' : ''}`}
            />
            {dirty && (
                <button onClick={save} disabled={saving} className="rounded-lg bg-[#0b2a5b] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                </button>
            )}
        </div>
    );
}

// Inline rating editor. The admin decides the rating of each product (0 to 5).
function RatingCell({ p, onSaved }) {
    const [v, setV] = useState(String(p.rating ?? 0));
    const [saving, setSaving] = useState(false);
    useEffect(() => setV(String(p.rating ?? 0)), [p.rating]);

    const num = Number(v);
    const valid = v !== '' && Number.isFinite(num) && num >= 0 && num <= 5;
    const dirty = valid && Math.round(num * 10) / 10 !== (p.rating || 0);

    const save = async () => {
        if (!dirty || saving) return;
        setSaving(true);
        try {
            await api(`/products/${p._id}`, { method: 'PUT', body: { rating: num } });
            toast.success(num > 0 ? `Rating set to ${num.toFixed(1)}` : 'Rating cleared');
            onSaved();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <input
                type="number" min="0" max="5" step="0.1" value={v} aria-label="Rating (0 to 5)"
                onChange={(e) => setV(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                title="0 means no rating yet. The maximum is 5."
                className={`input !w-[76px] !py-1.5 text-center font-medium ${v !== '' && !valid ? 'border-red-400' : ''}`}
            />
            {dirty && (
                <button onClick={save} disabled={saving} className="rounded-lg bg-[#0b2a5b] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                </button>
            )}
        </div>
    );
}

function StatusPill({ p, onToggle }) {
    return (
        <button
            onClick={() => onToggle(p)}
            title={p.isActive ? 'Click to hide this product' : 'Click to make this product visible'}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition hover:brightness-95 ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            {p.isActive ? 'Active' : 'Hidden'}
        </button>
    );
}

/* ---------- Three-dot menu (fixed position: it is never cut off by the table) ---------- */

function RowMenu({ p, onEdit, onDuplicate, onToggleActive, onDelete }) {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const open = !!pos;
    const close = useCallback(() => setPos(null), []);

    const toggle = () => {
        if (open) return close();
        const r = btnRef.current.getBoundingClientRect();
        const openUp = window.innerHeight - r.bottom < 230; // open upwards when there is little room below
        setPos({
            right: Math.max(8, window.innerWidth - r.right),
            top: openUp ? undefined : r.bottom + 6,
            bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
        });
    };

    useEffect(() => {
        if (!open) return;
        const down = (e) => {
            if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) close();
        };
        const key = (e) => e.key === 'Escape' && close();
        document.addEventListener('mousedown', down);
        document.addEventListener('keydown', key);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', down);
            document.removeEventListener('keydown', key);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open, close]);

    const item = 'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition';

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-label="Product actions"
                aria-expanded={open}
                className={`rounded-lg p-2 transition ${open ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
                <MoreVertical size={18} />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', right: pos.right, top: pos.top, bottom: pos.bottom }}
                    className="anim-fade z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
                >
                    <button type="button" onClick={() => { close(); onEdit(p); }} className={`${item} text-slate-700 hover:bg-blue-50 hover:text-blue-700`}>
                        <Pencil size={15} className="text-blue-600" /> Edit product
                    </button>
                    <button type="button" onClick={() => { close(); onDuplicate(p); }} className={`${item} text-slate-700 hover:bg-slate-50`}>
                        <Copy size={15} className="text-slate-500" /> Duplicate
                    </button>
                    <button type="button" onClick={() => { close(); onToggleActive(p); }} className={`${item} text-slate-700 hover:bg-slate-50`}>
                        {p.isActive
                            ? <><EyeOff size={15} className="text-amber-600" /> Hide from the store</>
                            : <><Eye size={15} className="text-emerald-600" /> Show in the store</>}
                    </button>
                    <div className="my-1 border-t" />
                    <button type="button" onClick={() => { close(); onDelete(p); }} className={`${item} font-semibold text-red-600 hover:bg-red-50`}>
                        <Trash2 size={15} /> Delete product
                    </button>
                </div>
            )}
        </>
    );
}

/* ---------- Image upload (Cloudinary) ---------- */

function ImagePicker({ images, setImages, onBusy }) {
    const [uploading, setUploading] = useState(0);
    const [drag, setDrag] = useState(false);
    const [url, setUrl] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { onBusy?.(uploading > 0); }, [uploading, onBusy]);

    const handleFiles = async (list) => {
        const files = [...list];
        if (!files.length) return;
        const room = MAX_IMAGES - images.length;
        if (room <= 0) return toast.error(`You can add up to ${MAX_IMAGES} images`);
        if (files.length > room) toast(`Only ${room} more image(s) can be added (maximum ${MAX_IMAGES})`);

        const valid = [];
        for (const f of files.slice(0, room)) {
            if (!OK_TYPES.includes(f.type)) { toast.error(`${f.name}: only JPG, PNG or WEBP is allowed`); continue; }
            if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name}: the file is larger than ${MAX_MB}MB`); continue; }
            valid.push(f);
        }
        if (!valid.length) return;

        setUploading(valid.length);
        try {
            const { urls } = await uploadImages(valid);
            setImages((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
            toast.success(`${urls.length} image(s) uploaded`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploading(0);
        }
    };

    const addUrl = () => {
        const u = url.trim();
        if (!/^https?:\/\//i.test(u)) return toast.error('Please enter a valid image URL (starting with http or https)');
        if (images.length >= MAX_IMAGES) return toast.error(`You can add up to ${MAX_IMAGES} images`);
        setImages((prev) => [...prev, u]);
        setUrl('');
    };
    const remove = (i) => setImages((prev) => prev.filter((_, k) => k !== i));
    const makeMain = (i) => setImages((prev) => [prev[i], ...prev.filter((_, k) => k !== i)]);
    const canAdd = images.length + uploading < MAX_IMAGES;

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Product images (the first image is the main one)</span>
                <span className="text-slate-400">{images.length}/{MAX_IMAGES}</span>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
                className={`rounded-xl border-2 border-dashed p-3.5 transition ${drag ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50/50'}`}
            >
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {images.map((src, i) => (
                        <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md">
                            <Thumb src={src} size={200} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-[#0b2a5b] px-1.5 py-0.5 text-[10px] font-bold text-white shadow">MAIN</span>}
                            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                                {i !== 0 ? (
                                    <button type="button" onClick={() => makeMain(i)} title="Make this the main image" aria-label="Make main image" className="rounded-full bg-white/95 p-1.5 text-amber-600 shadow transition hover:bg-white"><Star size={14} /></button>
                                ) : <span />}
                                <button type="button" onClick={() => remove(i)} title="Remove image" aria-label="Remove image" className="rounded-full bg-white/95 p-1.5 text-red-600 shadow transition hover:bg-white"><X size={14} /></button>
                            </div>
                        </div>
                    ))}

                    {Array.from({ length: uploading }).map((_, i) => (
                        <div key={`up${i}`} className="grid aspect-square animate-pulse place-items-center rounded-lg bg-slate-100 text-slate-400"><Loader2 className="animate-spin" /></div>
                    ))}

                    {canAdd && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="grid aspect-square place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-center text-xs font-medium text-slate-500 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <span><ImagePlus className="mx-auto mb-1" size={22} />Upload</span>
                        </button>
                    )}
                </div>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
                <p className="mt-2.5 text-center text-[11px] text-slate-400">Drag and drop, or click to upload · JPG, PNG, WEBP · up to {MAX_MB}MB each</p>
            </div>

            <div className="mt-2.5 flex gap-2">
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
                    placeholder="Or paste an image URL"
                    className="input !py-2 text-xs"
                />
                <button type="button" onClick={addUrl} className="btn-outline whitespace-nowrap !py-2 text-xs">Add URL</button>
            </div>
        </div>
    );
}

/* ---------- Add / edit popup (a bottom sheet on mobile, a centred dialog on larger screens) ---------- */

function ProductFormModal({ initial, duplicate, cats, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id);
    const [f, setF] = useState(
        initial
            ? {
                ...EMPTY,
                ...initial,
                category: initial.category?._id || initial.category || cats[0]?._id || '',
                images: initial.images || [],
                tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : initial.tags || '',
                rating: initial.rating ?? 0,
                numReviews: initial.numReviews ?? 0,
            }
            : { ...EMPTY, category: cats[0]?._id || '' }
    );
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
    const setImages = (fn) => setF((s) => ({ ...s, images: typeof fn === 'function' ? fn(s.images) : fn }));

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const price = Number(f.price) || 0;
    const mrp = Number(f.mrp) || 0;
    const discount = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;
    const ratingNum = Number(f.rating) || 0;
    const countNum = Math.max(0, Math.floor(Number(f.numReviews) || 0));

    const submit = async (e) => {
        e.preventDefault();
        if (uploading) return toast('Please wait until the images finish uploading');
        if (!f.images.length) return toast.error('Please add at least one product image');
        if (price <= 0) return toast.error('The selling price must be greater than 0');
        if (mrp && mrp < price) return toast.error('The MRP cannot be lower than the selling price');
        if (ratingNum < 0 || ratingNum > 5) return toast.error('The rating must be between 0 and 5');

        const body = {
            ...f,
            price,
            mrp: mrp || price,
            stock: Number(f.stock) || 0,
            rating: Math.round(ratingNum * 10) / 10,
            numReviews: countNum,
            tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean),
        };
        delete body._id;

        setSaving(true);
        try {
            if (isEdit) await api(`/products/${initial._id}`, { method: 'PUT', body });
            else await api('/products', { method: 'POST', body });
            toast.success(isEdit ? 'Product updated' : 'Product added');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-6"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <form onSubmit={submit} className="anim-pop flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-[#0b2a5b]">{isEdit ? 'Edit product' : duplicate ? 'Duplicate product' : 'Add a new product'}</h2>
                        <p className="text-xs text-slate-500">{isEdit ? 'Update the details, pricing and stock' : 'Fill in the details below to publish a product'}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"><X size={20} /></button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                    {duplicate && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                            This is a copy. It starts as hidden, with no rating and no best-seller tag. Turn on &quot;Visible in the store&quot; when it is ready.
                        </div>
                    )}

                    <ImagePicker images={f.images} setImages={setImages} onBusy={setUploading} />

                    <Label title="Product name *">
                        <input required placeholder="For example, Remote Control Racing Car" value={f.name} onChange={(e) => set('name', e.target.value)} className="input mt-1.5" />
                    </Label>

                    <Label title="Description">
                        <textarea rows={3} placeholder="Describe the key features, material and safety information" value={f.description} onChange={(e) => set('description', e.target.value)} className="input mt-1.5 resize-none" />
                    </Label>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Label title="Category *">
                            <select required value={f.category} onChange={(e) => set('category', e.target.value)} className="input mt-1.5">
                                {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </Label>
                        <Label title="Age group">
                            <select value={f.ageGroup} onChange={(e) => set('ageGroup', e.target.value)} className="input mt-1.5">
                                {AGES.map((a) => <option key={a} value={a}>{a} years</option>)}
                            </select>
                        </Label>
                        <Label title="Selling price (₹) *">
                            <input required type="number" min="1" placeholder="499" value={f.price} onChange={(e) => set('price', e.target.value)} className="input mt-1.5" />
                        </Label>
                        <Label title="MRP (₹)">
                            <input type="number" min="0" placeholder="799" value={f.mrp} onChange={(e) => set('mrp', e.target.value)} className="input mt-1.5" />
                        </Label>
                        <Label title="Stock quantity *">
                            <input required type="number" min="0" value={f.stock} onChange={(e) => set('stock', e.target.value)} className="input mt-1.5" />
                        </Label>
                        <Label title="Search tags (comma separated)">
                            <input placeholder="car, remote, gift, boys" value={f.tags} onChange={(e) => set('tags', e.target.value)} className="input mt-1.5" />
                        </Label>
                    </div>

                    {discount > 0 && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                            Customers will see a {discount}% OFF badge on this product.
                        </div>
                    )}

                    {/* Store rating: decided by the admin */}
                    <div className="rounded-xl border bg-slate-50 p-3.5">
                        <p className="text-sm font-bold text-slate-800">Store rating</p>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <Label title="Rating (0 to 5)">
                                <input type="number" min="0" max="5" step="0.1" value={f.rating} onChange={(e) => set('rating', e.target.value)} className="input mt-1.5 bg-white" />
                            </Label>
                            <Label title="Number of ratings (optional)">
                                <input type="number" min="0" step="1" value={f.numReviews} onChange={(e) => set('numReviews', e.target.value)} className="input mt-1.5 bg-white" />
                            </Label>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                            <span className="text-xs text-slate-500">Customers will see:</span>
                            <MiniStars value={ratingNum} count={countNum} />
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                            Enter 0 to show &quot;No ratings yet&quot;. Fill in &quot;Number of ratings&quot; only if you have that many real customer ratings.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border bg-slate-50/70 p-3.5">
                        <Toggle checked={!!f.isBestSeller} onChange={(v) => set('isBestSeller', v)} label="Best seller" />
                        <Toggle checked={!!f.isFeatured} onChange={(v) => set('isFeatured', v)} label="Featured" />
                        <Toggle checked={!!f.isActive} onChange={(v) => set('isActive', v)} label="Visible in the store" />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-5 py-4 sm:px-6">
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={saving || uploading} className="flex items-center gap-2 rounded-xl bg-[#0b2a5b] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50">
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {saving ? 'Saving…' : uploading ? 'Uploading images…' : isEdit ? 'Update product' : 'Save product'}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ---------- Main page ---------- */

export default function AdminProducts() {
    const [data, setData] = useState({ items: [], pages: 1, total: 0 });
    const [cats, setCats] = useState([]);
    const [filters, setFilters] = useState({ search: '', category: '', stock: '', status: '', sort: 'newest' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const [modal, setModal] = useState(null); // null | { initial, duplicate }
    const closeModal = useCallback(() => setModal(null), []);

    const setFilter = (key, value) => {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
    };

    // When a link from the dashboard opens this page (?category=..&stock=low&search=..), the filters are already applied.
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        setFilters((f) => ({
            ...f,
            search: q.get('search') || '',
            category: q.get('category') || '',
            stock: q.get('stock') || '',
            status: q.get('status') || '',
        }));
        setReady(true);
    }, []);

    const load = useCallback(() => {
        const p = new URLSearchParams({ page, limit: 20, sort: filters.sort });
        if (filters.search.trim()) p.set('search', filters.search.trim());
        ['category', 'stock', 'status'].forEach((k) => filters[k] && p.set(k, filters[k]));
        return api(`/admin/products?${p}`)
            .then(setData)
            .catch((e) => toast.error(e.message))
            .finally(() => setLoading(false));
    }, [filters, page]);

    useEffect(() => {
        if (!ready) return;
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load, ready]);

    useEffect(() => {
        api('/categories', { auth: false }).then(setCats).catch(() => { });
    }, []);

    const del = async (p) => {
        if (!confirm(`Delete "${p.name}"?\nIts images will also be removed from Cloudinary, unless another product uses them.`)) return;
        try {
            await api(`/products/${p._id}`, { method: 'DELETE' });
            toast.success('Product deleted');
            if (data.items.length === 1 && page > 1) setPage(page - 1);
            else load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const toggleActive = async (p) => {
        try {
            await api(`/products/${p._id}`, { method: 'PUT', body: { isActive: !p.isActive } });
            toast.success(p.isActive ? 'Product hidden from the store' : 'Product is now visible');
            load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    // A copy starts as a hidden draft, without a rating or a best-seller tag.
    const duplicateProduct = (p) =>
        setModal({
            duplicate: true,
            initial: { ...p, _id: undefined, name: `${p.name} (Copy)`, isActive: false, isBestSeller: false, rating: 0, numReviews: 0 },
        });

    const items = data.items;
    const hasFilters = filters.search || filters.category || filters.stock || filters.status || filters.sort !== 'newest';
    const resetFilters = () => {
        setFilters({ search: '', category: '', stock: '', status: '', sort: 'newest' });
        setPage(1);
    };
    const sortBySold = () => setFilter('sort', filters.sort === 'sold' ? 'newest' : 'sold');

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#0b2a5b]">Products &amp; Inventory</h1>
                    <p className="mt-0.5 text-xs text-slate-500">Manage your catalogue, prices, stock and ratings ({data.total ?? items.length} products)</p>
                </div>
                <button onClick={() => setModal({ initial: null })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2a5b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 active:scale-95">
                    <Plus size={18} /> Add product
                </button>
            </div>

            {/* Search and filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="relative w-full max-w-md flex-1">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input placeholder="Search by product name or tag…" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} className="input !py-2 !pl-10 text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        <select aria-label="Category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className="input !w-full !py-2 text-xs font-medium sm:!w-auto">
                            <option value="">All categories</option>
                            {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <select aria-label="Stock" value={filters.stock} onChange={(e) => setFilter('stock', e.target.value)} className="input !w-full !py-2 text-xs font-medium sm:!w-auto">
                            <option value="">All stock levels</option>
                            <option value="low">Low stock (5 or fewer)</option>
                            <option value="out">Out of stock</option>
                        </select>
                        <select aria-label="Status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="input !w-full !py-2 text-xs font-medium sm:!w-auto">
                            <option value="">All statuses</option>
                            <option value="active">Active only</option>
                            <option value="hidden">Hidden only</option>
                        </select>
                        <select aria-label="Sort" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className="input !w-full !py-2 text-xs font-medium sm:!w-auto">
                            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        {hasFilters && (
                            <button onClick={resetFilters} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50">Reset</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table (tablet and desktop) */}
            <div className="hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="border-b bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="p-3.5">Product</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Price</th>
                                <th className="p-3.5">Stock</th>
                                <th className="p-3.5">Rating (0–5)</th>
                                <th className="p-3.5">
                                    <button
                                        type="button"
                                        onClick={sortBySold}
                                        title="Total units sold. It updates automatically when orders are placed or cancelled. Click to sort by best selling."
                                        className={`inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-slate-900 ${filters.sort === 'sold' ? 'text-blue-700' : ''}`}
                                    >
                                        Sold <Info size={12} className="opacity-60" />
                                        {filters.sort === 'sold' && <ArrowDown size={12} />}
                                    </button>
                                </th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={8} className="p-3.5"><div className="h-11 animate-pulse rounded-lg bg-slate-100" /></td></tr>
                            ))}

                            {!loading && items.map((p) => (
                                <tr key={p._id} className="transition hover:bg-slate-50/80">
                                    <td className="p-3.5">
                                        <div className="group flex items-center gap-3">
                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
                                                <Thumb src={p.images?.[0]} size={100} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-1 max-w-[230px] font-semibold text-slate-900">{p.name}</p>
                                                <div className="mt-0.5 flex items-center gap-1.5">
                                                    {p.isBestSeller && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Best seller</span>}
                                                    {p.isFeatured && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Featured</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-slate-600">{p.category?.name || '—'}</td>
                                    <td className="p-3.5">
                                        <p className="font-bold text-slate-900">{inr(p.price)}</p>
                                        {p.mrp > p.price && <p className="text-xs text-slate-400 line-through">{inr(p.mrp)}</p>}
                                    </td>
                                    <td className="p-3.5"><StockCell p={p} onSaved={load} /></td>
                                    <td className="p-3.5"><RatingCell p={p} onSaved={load} /></td>
                                    <td className="p-3.5 font-semibold text-slate-700">{p.sold || 0}</td>
                                    <td className="p-3.5"><StatusPill p={p} onToggle={toggleActive} /></td>
                                    <td className="p-3.5 text-right">
                                        <RowMenu p={p} onEdit={(x) => setModal({ initial: x })} onDuplicate={duplicateProduct} onToggleActive={toggleActive} onDelete={del} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && items.length === 0 && (
                    <div className="py-14 text-center">
                        <PackageCheck className="mx-auto mb-2 text-slate-300" size={36} />
                        <p className="text-sm font-medium text-slate-600">No products match your search</p>
                        <p className="text-xs text-slate-400">Try changing the search or the filters.</p>
                    </div>
                )}
            </div>

            {/* Cards (mobile) */}
            <div className="space-y-3 md:hidden">
                {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200" />)}

                {!loading && items.map((p) => (
                    <div key={p._id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 gap-3">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
                                    <Thumb src={p.images?.[0]} size={150} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{p.name}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{p.category?.name || '—'} · Sold {p.sold || 0}</p>
                                    <p className="mt-1 font-extrabold text-slate-900">
                                        {inr(p.price)} {p.mrp > p.price && <span className="ml-1 text-xs font-normal text-slate-400 line-through">{inr(p.mrp)}</span>}
                                    </p>
                                </div>
                            </div>
                            <RowMenu p={p} onEdit={(x) => setModal({ initial: x })} onDuplicate={duplicateProduct} onToggleActive={toggleActive} onDelete={del} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
                            <div><p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Stock</p><StockCell p={p} onSaved={load} /></div>
                            <div><p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Rating (0–5)</p><RatingCell p={p} onSaved={load} /></div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <MiniStars value={p.rating} count={p.numReviews} />
                            <StatusPill p={p} onToggle={toggleActive} />
                        </div>
                    </div>
                ))}

                {!loading && items.length === 0 && (
                    <div className="rounded-xl border bg-white py-12 text-center text-sm font-medium text-slate-500">No products match your search</div>
                )}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page" className="grid h-9 w-9 place-items-center rounded-lg border bg-white transition hover:bg-blue-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
                    <span className="text-xs font-semibold text-slate-600">Page {page} of {data.pages}</span>
                    <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} aria-label="Next page" className="grid h-9 w-9 place-items-center rounded-lg border bg-white transition hover:bg-blue-50 disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
            )}

            {modal && <ProductFormModal initial={modal.initial} duplicate={modal.duplicate} cats={cats} onClose={closeModal} onSaved={load} />}
        </div>
    );
}