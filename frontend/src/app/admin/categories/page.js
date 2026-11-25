'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Plus, Pencil, Trash2, X, Search, MoreVertical, FolderOpen, ArrowUpDown,
    Loader2, UploadCloud, Link2, ExternalLink, ImageOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, uploadImages } from '@/lib/api';
import { cld } from '@/lib/img';
import CategoryIcon from '@/components/CategoryIcon';

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ---------- 3-dot menu (fixed: table me kat-ta nahi, neeche jagah na ho to upar khulta hai) ---------- */
function ThreeDotActions({ c, onEdit, onDelete }) {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const open = !!pos;
    const close = useCallback(() => setPos(null), []);

    const toggle = () => {
        if (open) return close();
        const r = btnRef.current.getBoundingClientRect();
        const up = window.innerHeight - r.bottom < 170;
        setPos({
            right: Math.max(8, window.innerWidth - r.right),
            top: up ? undefined : r.bottom + 6,
            bottom: up ? window.innerHeight - r.top + 6 : undefined,
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
                aria-label="Category actions"
                aria-expanded={open}
                className={`rounded-lg p-2 transition ${open ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
                <MoreVertical size={18} />
            </button>

            {open && (
                <div ref={menuRef} style={{ position: 'fixed', right: pos.right, top: pos.top, bottom: pos.bottom }} className="anim-fade z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                    <button type="button" onClick={() => { close(); onEdit(c); }} className={`${item} text-slate-700 hover:bg-blue-50 hover:text-blue-700`}><Pencil size={15} /> Edit category</button>
                    <Link href={`/admin/products?category=${c._id}`} onClick={close} className={`${item} text-slate-700 hover:bg-blue-50 hover:text-blue-700`}><ExternalLink size={15} />Its products </Link>
                    <div className="my-1 border-t" />
                    <button type="button" onClick={() => { close(); onDelete(c); }} className={`${item} font-semibold text-red-600 hover:bg-red-50`}><Trash2 size={15} /> Delete</button>
                </div>
            )}
        </>
    );
}

/* ---------- Add / Edit popup: image upload ya URL ---------- */
function CategoryModal({ initial, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id);
    const [name, setName] = useState(initial?.name || '');
    const [image, setImage] = useState(initial?.image || '');
    const [mode, setMode] = useState('upload'); // upload | url
    const [urlInput, setUrlInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [drag, setDrag] = useState(false);
    const [broken, setBroken] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => setBroken(false), [image]);
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const handleFile = async (file) => {
        if (!file) return;
        if (!OK_TYPES.includes(file.type)) return toast.error('Sirf JPG, PNG ya WEBP image allowed hai');
        if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Image ${MAX_MB}MB se badi hai`);
        setUploading(true);
        try {
            const { urls } = await uploadImages([file]);
            setImage(urls[0]);
            toast.success('Image upload ho gayi');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    const applyUrl = () => {
        const u = urlInput.trim();
        if (!/^https?:\/\/\S+$/i.test(u)) return toast.error('Valid image URL daalo (http ya https se shuru)');
        setImage(u);
        setUrlInput('');
    };

    const submit = async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return toast.error('Category ka naam daalo (kam se kam 2 letters)');
        if (uploading) return toast('Image upload ho rahi hai, thoda ruko');
        if (image && broken) return toast.error('Ye image load nahi ho rahi. Dusri image ya URL daalo.');
        setSaving(true);
        try {
            const body = { name: name.trim(), image };
            if (isEdit) await api(`/categories/${initial._id}`, { method: 'PUT', body });
            else await api('/categories', { method: 'POST', body });
            toast.success(isEdit ? 'Category update ho gayi' : 'Category add ho gayi');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const tab = (v, label, Icon) => (
        <button type="button" onClick={() => setMode(v)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${mode === v ? 'bg-white text-[#0b2a5b] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            <Icon size={14} /> {label}
        </button>
    );

    return (
        <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <form onSubmit={submit} noValidate className="anim-pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">
                    <div>
                        <h2 className="text-base font-extrabold text-[#0b2a5b]">{isEdit ? 'Edit Category' : 'Add New Category'}</h2>
                        <p className="text-xs text-slate-500">{isEdit ? 'Naam ya image badlo' : 'Naam aur image daalo'}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"><X size={18} /></button>
                </div>

                <div className="space-y-5 overflow-y-auto p-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700">Category Name *</label>
                        <input autoFocus placeholder="e.g. Action Figures, Board Games" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1.5" />
                        {name.trim() && <p className="mt-1 font-mono text-[11px] text-slate-400">URL: /{slugify(name)}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-slate-700">Category Image</label>
                            {!image && (
                                <div className="flex rounded-lg border bg-slate-100 p-0.5 text-xs font-semibold">
                                    {tab('upload', 'Upload', UploadCloud)}
                                    {tab('url', 'Image URL', Link2)}
                                </div>
                            )}
                        </div>

                        <div className="mt-2">
                            {image ? (
                                <div className="group relative mx-auto h-44 w-44 overflow-hidden rounded-2xl border bg-slate-50 shadow-sm">
                                    {broken ? (
                                        <div className="grid h-full place-items-center p-3 text-center text-xs text-red-600"><div><ImageOff className="mx-auto mb-1" size={24} />Image load nahi ho rahi. URL check karo.</div></div>
                                    ) : (
                                        <img src={cld(image, 400)} alt="Preview" onError={() => setBroken(true)} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                    )}
                                    <button type="button" onClick={() => setImage('')} className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/65 py-2 text-xs font-semibold text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100">
                                        <Trash2 size={13} /> Image hatao / badlo
                                    </button>
                                </div>
                            ) : mode === 'upload' ? (
                                <>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => !uploading && fileRef.current?.click()}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && fileRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                                        onDragLeave={() => setDrag(false)}
                                        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
                                        className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed px-4 py-9 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${drag ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'}`}
                                    >
                                        {uploading ? (
                                            <div className="flex flex-col items-center gap-2 text-slate-500"><Loader2 className="animate-spin" /><span className="text-sm">Upload ho rahi hai…</span></div>
                                        ) : (
                                            <div>
                                                <UploadCloud className="mx-auto mb-2 text-blue-600" size={30} />
                                                <p className="text-sm font-semibold text-slate-700">Image yahan drag karo ya click karo</p>
                                                <p className="mt-0.5 text-xs text-slate-400">JPG, PNG, WEBP · max {MAX_MB}MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyUrl(); } }} placeholder="https://.../image.jpg" className="input" />
                                        <button type="button" onClick={applyUrl} className="btn-outline whitespace-nowrap">Use</button>
                                    </div>
                                    <p className="text-xs text-slate-400">Kisi bhi product ya image ka direct link paste karo.</p>
                                </div>
                            )}
                        </div>
                        {!image && <p className="mt-2 text-[11px] text-slate-400">Image nahi doge to default 🧸 icon dikhega.</p>}
                    </div>

                </div>

                <div className="flex items-center justify-end gap-2.5 border-t bg-slate-50 px-5 py-3.5">
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                    <button disabled={saving || uploading} className="flex items-center gap-2 rounded-xl bg-[#0b2a5b] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50">
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {saving ? 'Saving…' : uploading ? 'Upload ho rahi hai…' : isEdit ? 'Update Category' : 'Add Category'}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ---------- Main page ---------- */
export default function AdminCategories() {
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [modalData, setModalData] = useState(null); // null | 'new' | category
    const closeModal = useCallback(() => setModalData(null), []);

    const load = useCallback(() => {
        return api('/categories', { auth: false })
            .then(setCats)
            .catch((err) => toast.error(err.message))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => { load(); }, [load]);

    const del = async (c) => {
        if (c.productCount > 0) {
            return toast.error(`"${c.name}" me ${c.productCount} products hain. Pehle unhe dusri category me move ya delete karo.`);
        }
        if (!confirm(`"${c.name}" delete karni hai? Iski image bhi hat jayegi.`)) return;
        try {
            await api(`/categories/${c._id}`, { method: 'DELETE' });
            toast.success('Category delete ho gayi');
            load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const q = search.toLowerCase().trim();
    const list = cats
        .filter((c) => !q || c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q))
        .sort((a, b) => {
            if (sortBy === 'az') return a.name.localeCompare(b.name);
            if (sortBy === 'za') return b.name.localeCompare(a.name);
            if (sortBy === 'products') return (b.productCount || 0) - (a.productCount || 0);
            return 0;
        });
    const withoutImage = cats.filter((c) => !c.image).length;

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#0b2a5b]">Categories</h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {cats.length} categories{withoutImage > 0 && <span className="text-amber-600"> · {withoutImage} me image nahi hai</span>}
                    </p>
                </div>
                <button onClick={() => setModalData('new')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2a5b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 active:scale-95">
                    <Plus size={18} /> Add Category
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input placeholder="Category ka naam ya slug search karo…" value={search} onChange={(e) => setSearch(e.target.value)} className="input !py-2 !pl-10 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ArrowUpDown size={14} /> Sort:</span>
                        <select aria-label="Sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input !w-auto !py-2 text-xs font-medium">
                            <option value="default">Default order</option>
                            <option value="az">Name (A → Z)</option>
                            <option value="za">Name (Z → A)</option>
                            <option value="products">Most products</option>
                        </select>
                        {search && <button onClick={() => setSearch('')} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50">Clear</button>}
                    </div>
                </div>
            </div>

            {/* Desktop table */}
            <div className="hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="w-14 p-3.5 text-center">#</th>
                                <th className="w-24 p-3.5">Image</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Products</th>
                                <th className="p-3.5">URL slug</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3.5"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></td></tr>)}
                            {!loading && list.map((c, i) => (
                                <tr key={c._id} className="group transition hover:bg-blue-50/40">
                                    <td className="p-3.5 text-center text-xs font-semibold text-slate-400">{i + 1}</td>
                                    <td className="p-3.5">
                                        <button onClick={() => setModalData(c)} aria-label={`Edit ${c.name}`} className="block overflow-hidden rounded-xl transition duration-200 hover:scale-105 hover:shadow-md">
                                            <CategoryIcon c={c} size={56} />
                                        </button>
                                    </td>
                                    <td className="p-3.5">
                                        <p className="font-bold text-slate-900">{c.name}</p>
                                        {!c.image && <button onClick={() => setModalData(c)} className="text-[11px] font-semibold text-amber-600 hover:underline">Image add karo</button>}
                                    </td>
                                    <td className="p-3.5">
                                        <Link href={`/admin/products?category=${c._id}`} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-700 hover:text-white">{c.productCount || 0} products</Link>
                                    </td>
                                    <td className="p-3.5"><span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">/{c.slug}</span></td>
                                    <td className="p-3.5 text-right"><ThreeDotActions c={c} onEdit={setModalData} onDelete={del} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && list.length === 0 && (
                    <div className="py-14 text-center">
                        <FolderOpen className="mx-auto mb-2 text-slate-300" size={36} />
                        <p className="text-sm font-medium text-slate-600">Koi category nahi mili</p>
                        <button onClick={() => setModalData('new')} className="btn mt-3"><Plus size={16} /> Add Category</button>
                    </div>
                )}
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
                {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}
                {!loading && list.map((c) => (
                    <div key={c._id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                        <button onClick={() => setModalData(c)} className="flex min-w-0 items-center gap-3 text-left">
                            <CategoryIcon c={c} size={56} />
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-slate-900">{c.name}</span>
                                <span className="mt-0.5 block text-xs text-slate-500">{c.productCount || 0} products</span>
                                {!c.image && <span className="text-[11px] font-semibold text-amber-600">Image add karo</span>}
                            </span>
                        </button>
                        <ThreeDotActions c={c} onEdit={setModalData} onDelete={del} />
                    </div>
                ))}
                {!loading && list.length === 0 && <div className="rounded-xl border bg-white py-12 text-center text-sm text-slate-500">Koi category nahi mili</div>}
            </div>

            {modalData && <CategoryModal initial={modalData === 'new' ? null : modalData} onClose={closeModal} onSaved={load} />}
        </div>
    );
}