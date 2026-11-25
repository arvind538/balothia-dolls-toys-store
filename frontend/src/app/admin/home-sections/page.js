'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, Loader2,
    AlertTriangle, ExternalLink, LayoutGrid, MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const AGES = ['0-3', '3-6', '6-9', '9-12', '12+'];
const SOURCES = [
    ['category', 'A specific category', 'Displays products from a chosen category.'],
    ['ageGroup', 'An age group', 'Displays products suited to a selected age group.'],
    ['bestSeller', 'Best sellers', 'Displays products marked as Best Seller, ordered by sales volume.'],
    ['featured', 'Featured products', 'Displays products marked as Featured.'],
    ['newest', 'New arrivals', 'Displays the most recently added products.'],
    ['offers', 'Special offers', 'Displays products priced below their maximum retail price.'],
];

const sourceLabel = (s) => {
    if (s.source === 'category') return `Category: ${s.category?.name || 'Deleted category'}`;
    if (s.source === 'ageGroup') return `Age group: ${s.ageGroup} years`;
    return SOURCES.find(([v]) => v === s.source)?.[1] || s.source;
};

// Builds the update payload from an existing section record.
const bodyOf = (s, patch = {}) => ({
    title: s.title,
    source: s.source,
    category: s.category?._id,
    ageGroup: s.ageGroup,
    limit: s.limit,
    isActive: s.isActive,
    ...patch,
});

function Toggle({ checked, onChange, label }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 select-none">
            <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-blue-700 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300" />
                <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-2xs transition-transform duration-200 peer-checked:translate-x-4" />
            </span>
            {label}
        </label>
    );
}

function ActionMenu({ onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div ref={menuRef} className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Section actions"
                aria-expanded={open}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
            >
                <MoreVertical size={16} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="anim-pop absolute right-0 z-30 mt-1.5 w-36 origin-top-right overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            onEdit();
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                        <Pencil size={14} className="text-blue-600" />
                        <span>Edit</span>
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                        <Trash2 size={14} className="text-red-600" />
                        <span>Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function SectionModal({ initial, cats, onClose, onSaved }) {
    const [f, setF] = useState({
        title: initial?.title || '',
        source: initial?.source || 'category',
        category: initial?.category?._id || cats[0]?._id || '',
        ageGroup: initial?.ageGroup || '0-3',
        limit: initial?.limit || 4,
        isActive: initial ? initial.isActive : true,
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
    const sourceInfo = SOURCES.find(([v]) => v === f.source)?.[2];

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    // Suggest the chosen category's name if the title field is currently blank.
    const pickCategory = (id) => {
        const c = cats.find((x) => x._id === id);
        setF((s) => ({ ...s, category: id, title: s.title.trim() ? s.title : c?.name || '' }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (f.title.trim().length < 2) return toast.error('Please enter a section title.');
        if (f.source === 'category' && !f.category) return toast.error('Please select a category.');
        setSaving(true);
        try {
            const body = {
                title: f.title.trim(),
                source: f.source,
                category: f.source === 'category' ? f.category : undefined,
                ageGroup: f.source === 'ageGroup' ? f.ageGroup : undefined,
                limit: Number(f.limit) || 4,
                isActive: f.isActive,
            };
            if (initial) {
                await api(`/admin/home-sections/${initial._id}`, { method: 'PUT', body });
            } else {
                await api('/admin/home-sections', { method: 'POST', body });
            }
            toast.success(initial ? 'Section updated.' : 'Section added.');
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
            className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs sm:items-center sm:p-4"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <form
                onSubmit={submit}
                noValidate
                className="anim-pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                    <div>
                        <h2 className="text-base font-extrabold text-[#0b2a5b]">
                            {initial ? 'Edit home section' : 'Add a home section'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            Each section renders as a product row on the storefront home page.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto p-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700">Section title *</label>
                        <input
                            autoFocus
                            value={f.title}
                            onChange={(e) => set('title', e.target.value)}
                            maxLength={60}
                            placeholder="e.g. Baby Care & Essentials"
                            className="input mt-1.5 rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700">Product source</label>
                        <select
                            value={f.source}
                            onChange={(e) => set('source', e.target.value)}
                            className="input mt-1.5 rounded-xl"
                        >
                            {SOURCES.map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-400">{sourceInfo}</p>
                    </div>

                    {f.source === 'category' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Category *</label>
                            <select
                                value={f.category}
                                onChange={(e) => pickCategory(e.target.value)}
                                className="input mt-1.5 rounded-xl"
                            >
                                {cats.length === 0 && <option value="">No categories available</option>}
                                {cats.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {f.source === 'ageGroup' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Age group *</label>
                            <select
                                value={f.ageGroup}
                                onChange={(e) => set('ageGroup', e.target.value)}
                                className="input mt-1.5 rounded-xl"
                            >
                                {AGES.map((a) => (
                                    <option key={a} value={a}>
                                        {a} years
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-700">
                            Product limit (1–12)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            value={f.limit}
                            onChange={(e) => set('limit', e.target.value)}
                            className="input mt-1.5 !w-28 rounded-xl"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            Up to 4 items display as a grid; more than 4 display as a scrollable row.
                        </p>
                    </div>

                    <Toggle
                        checked={f.isActive}
                        onChange={(v) => set('isActive', v)}
                        label="Display this section on the home page"
                    />
                </div>

                <div className="flex justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[#0b2a5b] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        <span>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add section'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function AdminHomeSections() {
    const [list, setList] = useState(null);
    const [cats, setCats] = useState([]);
    const [modal, setModal] = useState(null);
    const closeModal = useCallback(() => setModal(null), []);

    const load = useCallback(
        () =>
            api('/admin/home-sections')
                .then(setList)
                .catch((e) => {
                    toast.error(e.message);
                    setList([]);
                }),
        []
    );

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        api('/categories', { auth: false }).then(setCats).catch(() => { });
    }, []);

    const move = async (index, dir) => {
        if (!Array.isArray(list)) return;
        const next = [...list];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setList(next);
        try {
            await api('/admin/home-sections/reorder', {
                method: 'PUT',
                body: { ids: next.map((s) => s._id) },
            });
        } catch (e) {
            toast.error(e.message);
            load();
        }
    };

    const toggleActive = async (s) => {
        try {
            await api(`/admin/home-sections/${s._id}`, {
                method: 'PUT',
                body: bodyOf(s, { isActive: !s.isActive }),
            });
            toast.success(s.isActive ? 'Section hidden from home page.' : 'Section is now visible.');
            load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const remove = async (s) => {
        if (!confirm(`Delete the section "${s.title}"? Your products will remain unaffected.`)) return;
        try {
            await api(`/admin/home-sections/${s._id}`, { method: 'DELETE' });
            toast.success('Section deleted.');
            load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const createDefaults = async () => {
        try {
            await api('/admin/home-sections/defaults', { method: 'POST' });
            toast.success('Default sections created.');
            load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#0b2a5b]">Home Sections</h1>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                        Manage the product rows displayed on your home page and arrange their sequence.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
                    >
                        <ExternalLink size={16} />
                        <span>View home page</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setModal('new')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0b2a5b] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-900 active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        <span>Add section</span>
                    </button>
                </div>
            </div>

            {/* Loading Skeleton */}
            {!list && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {list && list.length === 0 && (
                <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
                    <div className="max-w-sm">
                        <LayoutGrid className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-semibold text-slate-800">No sections configured yet</p>
                        <p className="mt-1 text-sm text-slate-500">
                            Until sections are added, the home page displays a single Best Selling row. Generate defaults or add a custom section.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <button type="button" onClick={createDefaults} className="btn rounded-xl">
                                Create default sections
                            </button>
                            <button type="button" onClick={() => setModal('new')} className="btn-outline rounded-xl">
                                Add section
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Responsive Table */}
            {list && list.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="w-20 px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Section</th>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">Display</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="w-16 px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {list.map((s, i) => {
                                    const empty = s.matched === 0;
                                    const low = !empty && s.matched < s.limit;

                                    return (
                                        <tr
                                            key={s._id}
                                            className={`transition-colors duration-150 hover:bg-slate-50/80 ${s.isActive ? 'bg-white' : 'bg-slate-50/40 opacity-70'
                                                }`}
                                        >
                                            {/* Order & Reorder Controls */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                                                        {i + 1}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <button
                                                            type="button"
                                                            onClick={() => move(i, -1)}
                                                            disabled={i === 0}
                                                            aria-label="Move section up"
                                                            className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-25"
                                                        >
                                                            <ArrowUp size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => move(i, 1)}
                                                            disabled={i === list.length - 1}
                                                            aria-label="Move section down"
                                                            className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-25"
                                                        >
                                                            <ArrowDown size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Title & Matching Status */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <p className="font-bold text-slate-900">{s.title}</p>
                                                {empty && (
                                                    <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                                                        <AlertTriangle size={12} className="shrink-0" />
                                                        <span>No matching products; hidden on home page.</span>
                                                    </p>
                                                )}
                                                {low && (
                                                    <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                                                        <AlertTriangle size={12} className="shrink-0" />
                                                        <span>
                                                            {s.matched} of {s.limit} requested products matched.
                                                        </span>
                                                    </p>
                                                )}
                                                {!empty && !low && (
                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {s.matched} matching {s.matched === 1 ? 'product' : 'products'}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Source */}
                                            <td className="px-4 py-3.5 align-middle text-xs font-medium text-slate-600">
                                                {sourceLabel(s)}
                                            </td>

                                            {/* Limit & Layout */}
                                            <td className="px-4 py-3.5 align-middle text-xs text-slate-600">
                                                <span className="font-semibold text-slate-800">Up to {s.limit}</span>{' '}
                                                <span className="text-slate-400">
                                                    ({s.limit > 4 ? 'Slider' : 'Grid'})
                                                </span>
                                            </td>

                                            {/* Visibility Toggle */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <Toggle
                                                    checked={s.isActive}
                                                    onChange={() => toggleActive(s)}
                                                    label={<span>{s.isActive ? 'Visible' : 'Hidden'}</span>}
                                                />
                                            </td>

                                            {/* Three-Dot Action Menu */}
                                            <td className="px-4 py-3.5 text-right align-middle">
                                                <ActionMenu
                                                    onEdit={() => setModal(s)}
                                                    onDelete={() => remove(s)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal && (
                <SectionModal
                    initial={modal === 'new' ? null : modal}
                    cats={cats}
                    onClose={closeModal}
                    onSaved={load}
                />
            )}
        </div>
    );
}