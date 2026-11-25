'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Search, Mail, Phone, Hash, Trash2, CheckCheck, Inbox, ArrowLeft, Clock, RotateCcw,
    ChevronLeft, ChevronRight, User, ExternalLink, Send, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ago, dateTime } from '@/lib/format';

const TABS = [
    ['', 'All', 'all'],
    ['new', 'New', 'new'],
    ['read', 'Open', 'read'],
    ['resolved', 'Resolved', 'resolved'],
];

const TOPICS = [
    'Order status',
    'Return or refund',
    'Cancellation',
    'Product question',
    'Payment issue',
    'Feedback',
    'Other',
];

const STATUS_STYLE = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-slate-100 text-slate-600',
    resolved: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABEL = {
    new: 'New',
    read: 'Open',
    resolved: 'Resolved',
};

const SIGN = '\n\nKind regards,\nBalothia Refrigeration Support Team';

// Quick-reply templates; {name} is replaced with the customer's first name.
const TEMPLATES = [
    [
        'Order update',
        (n) => `Dear ${n},\n\nThank you for reaching out to us. We have reviewed your order and it is currently being processed. We will share the dispatch details as soon as it ships.${SIGN}`,
    ],
    [
        'Return approved',
        (n) => `Dear ${n},\n\nWe regret the inconvenience caused. Your return request has been approved. Please pack the item securely in its original packaging with all accessories. Our team will be in touch shortly with the pickup arrangements.${SIGN}`,
    ],
    [
        'Request details',
        (n) => `Dear ${n},\n\nThank you for contacting us. To assist you promptly, could you please share your order reference number along with a clear photograph or brief video of the concern?${SIGN}`,
    ],
    [
        'Apology',
        (n) => `Dear ${n},\n\nPlease accept our sincere apologies for the inconvenience experienced. We are investigating this matter on priority and will provide an update shortly.${SIGN}`,
    ],
];

// Notifies the sidebar badge and dashboard summary widgets to refresh.
const notifyChange = () => window.dispatchEvent(new Event('bt:messages-changed'));

function Bubble({ who, name, text, time }) {
    const admin = who === 'admin';
    return (
        <div className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-2xs transition-all duration-200 sm:max-w-[78%] ${admin
                    ? 'rounded-br-md bg-blue-700 text-white'
                    : 'rounded-bl-md border border-slate-200/80 bg-slate-50 text-slate-800'
                    }`}
            >
                <p className={`text-[11px] font-semibold ${admin ? 'text-blue-100' : 'text-slate-500'}`}>
                    {admin ? `${name || 'Support'} (Support)` : name}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-relaxed sm:text-[15px]">
                    {text}
                </p>
                <p className={`mt-1.5 text-[10px] ${admin ? 'text-blue-200' : 'text-slate-400'}`}>
                    {dateTime(time)}
                </p>
            </div>
        </div>
    );
}

function Detail({ m, onBack, onStatus, onDelete, onChanged }) {
    const [full, setFull] = useState(null);
    const [text, setText] = useState('');
    const [resolve, setResolve] = useState(false);
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);
    const first = (m.name || 'Customer').trim().split(/\s+/)[0];

    // Load the complete conversation thread when opening a message.
    useEffect(() => {
        let alive = true;
        setFull(null);
        setText('');
        setResolve(false);

        api(`/admin/messages/${m._id}`)
            .then((d) => alive && setFull(d))
            .catch((e) => toast.error(e.message));

        return () => {
            alive = false;
        };
    }, [m._id]);

    // Refresh the thread if new replies arrive while it is open.
    useEffect(() => {
        if (!full || m.replyCount === undefined) return;
        const currentCount = full.replies?.length ?? full.replyCount ?? 0;
        if (m.replyCount !== currentCount) {
            api(`/admin/messages/${m._id}`)
                .then((d) => setFull(d))
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [m.replyCount, m._id]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        return () => cancelAnimationFrame(frame);
    }, [full?.replies?.length, m._id]);

    const send = async (e) => {
        e?.preventDefault();
        if (sending) return;
        if (text.trim().length < 2) return toast.error('Please enter a reply before sending.');

        setSending(true);
        try {
            const d = await api(`/admin/messages/${m._id}/reply`, {
                method: 'POST',
                body: { message: text.trim(), resolve },
            });
            setFull(d.message);
            setText('');
            setResolve(false);

            if (d.emailed) {
                toast.success('Reply sent via email and recorded in the customer account.');
            } else {
                toast.success(
                    'Reply saved in the customer account. Email delivery is currently unavailable.',
                    { duration: 6000 }
                );
            }

            notifyChange();
            onChanged();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSending(false);
        }
    };

    const status = full?.status || m.status;

    return (
        <div className="card overflow-hidden border border-slate-200/80 shadow-sm">
            {/* Thread Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3.5">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back to conversations"
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                >
                    <ArrowLeft size={18} />
                </button>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-2xs">
                    {(m.name || '?')[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{m.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={12} className="shrink-0" />
                        <span>Opened {ago(m.createdAt)}</span>
                    </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[status] || status}
                </span>
            </div>

            <div className="space-y-4 bg-white p-4 sm:p-5">
                {/* Customer Metadata */}
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <a
                        href={`mailto:${m.email}`}
                        className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                        <Mail size={15} className="shrink-0 text-slate-400" />
                        <span className="truncate">{m.email}</span>
                    </a>
                    {m.phone && (
                        <a
                            href={`tel:${m.phone}`}
                            className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                            <Phone size={15} className="shrink-0 text-slate-400" />
                            <span className="truncate">+91 {m.phone}</span>
                        </a>
                    )}
                    {m.orderId && (
                        <Link
                            href={`/admin/orders?q=${encodeURIComponent(m.orderId.replace('#', ''))}`}
                            className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                            <Hash size={15} className="shrink-0 text-slate-400" />
                            <span className="truncate">Order {m.orderId}</span>
                            <ExternalLink size={12} className="ml-auto shrink-0 text-slate-400" />
                        </Link>
                    )}
                    {m.userId && (
                        <Link
                            href={`/admin/users/${m.userId}`}
                            className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                            <User size={15} className="shrink-0 text-slate-400" />
                            <span className="truncate">Customer profile</span>
                            <ExternalLink size={12} className="ml-auto shrink-0 text-slate-400" />
                        </Link>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {m.topic}
                    </span>
                </div>

                {/* Conversation Thread */}
                <div
                    role="log"
                    aria-live="polite"
                    className="max-h-[45vh] min-h-[180px] space-y-3 overflow-y-auto scroll-smooth rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3.5 sm:p-4"
                >
                    <Bubble who="customer" name={m.name} text={m.message} time={m.createdAt} />
                    {!full && (
                        <div className="space-y-2">
                            <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
                        </div>
                    )}
                    {(full?.replies || []).map((r) => (
                        <Bubble
                            key={r._id}
                            who={r.from}
                            name={r.from === 'admin' ? r.name : m.name}
                            text={r.message}
                            time={r.createdAt}
                        />
                    ))}
                    <div ref={endRef} />
                </div>

                {/* Reply Composer */}
                <form onSubmit={send} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-xs font-semibold text-slate-500">Templates:</span>
                        {TEMPLATES.map(([label, make]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => setText(make(first))}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        rows={4}
                        maxLength={2000}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                send(e);
                            }
                        }}
                        placeholder={`Write a response to ${first}…`}
                        className="input resize-y rounded-xl"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
                            <input
                                type="checkbox"
                                checked={resolve}
                                onChange={(e) => setResolve(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Mark conversation as resolved after sending</span>
                        </label>

                        <div className="flex items-center gap-3">
                            <span className="text-xs tabular-nums text-slate-400">
                                {text.length}/2000
                            </span>
                            <button
                                type="submit"
                                disabled={sending}
                                className="btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                <span>{sending ? 'Sending…' : 'Send reply'}</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">
                        Your reply is sent to the customer via email and saved in their account inbox. Press Ctrl + Enter to send.
                    </p>
                </form>

                {/* Status & Deletion Actions */}
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    {status !== 'resolved' ? (
                        <button
                            type="button"
                            onClick={() => onStatus(m, 'resolved')}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98]"
                        >
                            <CheckCheck size={16} />
                            <span>Mark as resolved</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onStatus(m, 'read')}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                        >
                            <RotateCcw size={16} />
                            <span>Reopen thread</span>
                        </button>
                    )}

                    {status === 'read' && (
                        <button
                            type="button"
                            onClick={() => onStatus(m, 'new')}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                        >
                            Mark as unread
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onDelete(m)}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                    >
                        <Trash2 size={16} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminMessages() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [topic, setTopic] = useState('');
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setQ(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(() => {
        const p = new URLSearchParams({ page, limit: 20 });
        if (status) p.set('status', status);
        if (topic) p.set('topic', topic);
        if (q) p.set('q', q);

        return api(`/admin/messages?${p}`)
            .then((d) => {
                setData(d);
                setSelected((s) => (s ? d.items.find((i) => i._id === s._id) || s : s));
            })
            .catch((e) => toast.error(e.message))
            .finally(() => setLoading(false));
    }, [page, status, topic, q]);

    const patchLocal = (id, next) => {
        setData((d) => d && { ...d, items: d.items.map((i) => (i._id === id ? { ...i, status: next } : i)) });
        setSelected((s) => (s && s._id === id ? { ...s, status: next } : s));
    };

    const changeStatus = async (m, next, quiet = false) => {
        const prev = m.status;
        patchLocal(m._id, next);
        try {
            await api(`/admin/messages/${m._id}`, { method: 'PATCH', body: { status: next } });
            if (!quiet) toast.success(`Conversation marked as ${STATUS_LABEL[next].toLowerCase()}.`);
            notifyChange();
            load();
        } catch (e) {
            patchLocal(m._id, prev);
            toast.error(e.message);
        }
    };

    const openMessage = useCallback(
        (m) => {
            setSelected(m);
            if (m.status === 'new') {
                changeStatus(m, 'read', true);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const remove = async (m) => {
        if (!confirm(`Permanently delete the conversation with ${m.name}? This action cannot be undone.`)) return;
        try {
            await api(`/admin/messages/${m._id}`, { method: 'DELETE' });
            toast.success('Conversation deleted.');
            setSelected((s) => (s?._id === m._id ? null : s));
            notifyChange();
            load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    // Read initial query parameters (?status= and ?open=) on mount.
    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        if (p.get('status')) setStatus(p.get('status'));
        setReady(true);

        const id = p.get('open');
        if (id) {
            api(`/admin/messages/${id}`)
                .then((msg) => msg && openMessage(msg))
                .catch(() => { });
            window.history.replaceState(null, '', '/admin/messages');
        }
    }, [openMessage]);

    useEffect(() => {
        if (!ready) return;
        setLoading(true);
        load();
    }, [load, ready]);

    // Periodic refresh and live activity updates.
    useEffect(() => {
        if (!ready) return;
        const t = setInterval(load, 30000);
        window.addEventListener('bt:admin-activity', load);
        return () => {
            clearInterval(t);
            window.removeEventListener('bt:admin-activity', load);
        };
    }, [load, ready]);

    const items = data?.items || [];
    const counts = data?.counts || {};

    return (
        <div className="space-y-4">
            {/* Page Header & Search/Topic Filters */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#0b2a5b]">Messages</h1>
                    <p className="text-sm text-slate-500">
                        Customer enquiries submitted through the Contact Us page.{' '}
                        {counts.new > 0 ? (
                            <b className="font-semibold text-blue-700">
                                {counts.new} {counts.new === 1 ? 'thread awaits' : 'threads await'} your response.
                            </b>
                        ) : (
                            'All enquiries have been reviewed.'
                        )}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <div className="relative flex-1 sm:flex-none">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, or order…"
                            className="input w-full rounded-xl !pl-9 sm:!w-64"
                        />
                    </div>
                    <select
                        aria-label="Filter by topic"
                        value={topic}
                        onChange={(e) => {
                            setTopic(e.target.value);
                            setPage(1);
                        }}
                        className="input rounded-xl sm:!w-44"
                    >
                        <option value="">All topics</option>
                        {TOPICS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div
                role="tablist"
                aria-label="Message status filters"
                className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-1 text-sm font-semibold shadow-2xs"
            >
                {TABS.map(([v, label, key]) => {
                    const active = status === v;
                    return (
                        <button
                            key={v || 'all'}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => {
                                setStatus(v);
                                setPage(1);
                            }}
                            className={`shrink-0 rounded-lg px-4 py-1.5 transition-all duration-150 ${active
                                ? 'bg-[#0b2a5b] text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <span>{label}</span>
                            <span
                                className={`ml-1.5 text-xs tabular-nums ${active ? 'text-white/75' : 'text-slate-400'
                                    }`}
                            >
                                {data ? counts[key] ?? 0 : ''}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Master-Detail Grid */}
            <div className="grid items-start gap-4 lg:grid-cols-[390px_1fr]">
                {/* Conversations List */}
                <div
                    className={`card overflow-hidden border border-slate-200/80 shadow-sm transition-opacity duration-200 ${loading && data ? 'opacity-65' : 'opacity-100'
                        }`}
                >
                    <div className="max-h-[calc(100vh-17.5rem)] min-h-[240px] divide-y divide-slate-100 overflow-y-auto">
                        {!data &&
                            [1, 2, 3, 4].map((i) => (
                                <div key={i} className="m-3 h-20 animate-pulse rounded-xl bg-slate-100" />
                            ))}

                        {data && items.length === 0 && (
                            <div className="grid min-h-[240px] place-items-center px-4 py-12 text-center">
                                <div>
                                    <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                                    <p className="mt-2 font-semibold text-slate-700">No messages found</p>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Customer enquiries will appear here once submitted.
                                    </p>
                                </div>
                            </div>
                        )}

                        {items.map((m) => {
                            const isNew = m.status === 'new';
                            const active = selected?._id === m._id;
                            const customerReplied = isNew && m.lastReplyBy === 'customer';

                            return (
                                <button
                                    key={m._id}
                                    type="button"
                                    onClick={() => openMessage(m)}
                                    className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors duration-150 hover:bg-slate-50/90 ${active ? 'bg-blue-50/80' : 'bg-white'
                                        }`}
                                >
                                    <span className="relative mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                                        {(m.name || '?')[0].toUpperCase()}
                                        {isNew && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white"
                                            />
                                        )}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span
                                                className={`truncate text-sm ${isNew ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'
                                                    }`}
                                            >
                                                {m.name}
                                            </span>
                                            <span className="shrink-0 text-[11px] text-slate-400">
                                                {ago(m.lastActivityAt || m.createdAt)}
                                            </span>
                                        </span>

                                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <span className="truncate rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                                {m.topic}
                                            </span>
                                            {customerReplied && (
                                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                                                    Customer replied
                                                </span>
                                            )}
                                            {!customerReplied &&
                                                m.lastReplyBy === 'admin' &&
                                                m.status !== 'resolved' && (
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                                        Replied
                                                    </span>
                                                )}
                                            {m.status === 'resolved' && (
                                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    Resolved
                                                </span>
                                            )}
                                            {m.replyCount > 0 && (
                                                <span className="text-[11px] text-slate-400">
                                                    {m.replyCount} {m.replyCount === 1 ? 'reply' : 'replies'}
                                                </span>
                                            )}
                                        </span>

                                        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                            {m.message}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {(data?.pages || 1) > 1 && (
                        <div className="flex items-center justify-center gap-3 border-t border-slate-100 bg-white p-2.5">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                aria-label="Previous page"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-blue-50 disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-medium text-slate-600 tabular-nums">
                                Page {page} of {data.pages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= data.pages}
                                onClick={() => setPage((p) => p + 1)}
                                aria-label="Next page"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-blue-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Conversation Panel: Full-screen drawer on mobile, side panel on desktop */}
                <div
                    className={
                        selected
                            ? 'fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-slate-100/95 p-3 backdrop-blur-xs lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0'
                            : 'hidden lg:block'
                    }
                >
                    {selected ? (
                        <Detail
                            m={selected}
                            onBack={() => setSelected(null)}
                            onStatus={changeStatus}
                            onDelete={remove}
                            onChanged={load}
                        />
                    ) : (
                        <div className="card grid min-h-[340px] place-items-center border border-slate-200/80 p-10 text-center text-slate-400">
                            <div>
                                <Inbox className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-3 font-semibold text-slate-600">
                                    Select a conversation to read and reply
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Choose any customer message from the list to view full history and respond.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}