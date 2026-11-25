'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Loader2, MessageSquarePlus, Inbox, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ago, dateTime } from '@/lib/format';

// What the customer sees as the status of a conversation.
const statusOf = (t) => {
    if (t.status === 'resolved') return ['Resolved', 'bg-emerald-100 text-emerald-700'];
    if (t.lastReplyBy === 'admin') return ['Replied', 'bg-blue-100 text-blue-700'];
    return ['Open', 'bg-amber-100 text-amber-700'];
};

const notifyChange = () => window.dispatchEvent(new Event('bt:support-changed'));

function Bubble({ mine, name, text, time }) {
    return (
        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${mine ? 'rounded-br-md bg-blue-700 text-white' : 'rounded-bl-md border bg-slate-50 text-slate-800'}`}>
                <p className={`text-[11px] font-semibold ${mine ? 'text-blue-100' : 'text-slate-500'}`}>{name}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-6">{text}</p>
                <p className={`mt-1.5 text-[10px] ${mine ? 'text-blue-200' : 'text-slate-400'}`}>{dateTime(time)}</p>
            </div>
        </div>
    );
}

export default function SupportPage() {
    const [items, setItems] = useState(null);
    const [openId, setOpenId] = useState(null);
    const [thread, setThread] = useState(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    const loadList = useCallback(() => api('/support').then(setItems).catch((e) => { toast.error(e.message); setItems([]); }), []);
    const loadThread = useCallback(
        (id) => api(`/support/${id}`).then((d) => { setThread(d); notifyChange(); }).catch((e) => toast.error(e.message)),
        []
    );

    useEffect(() => {
        loadList();
        const id = new URLSearchParams(window.location.search).get('open');
        if (id) setOpenId(id);
    }, [loadList]);

    useEffect(() => {
        setThread(null);
        setText('');
        if (openId) loadThread(openId);
    }, [openId, loadThread]);

    // Check for new replies every 30 seconds.
    useEffect(() => {
        const t = setInterval(() => { loadList(); if (openId) loadThread(openId); }, 30000);
        return () => clearInterval(t);
    }, [openId, loadList, loadThread]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [thread?.replies?.length]);

    const send = async (e) => {
        e?.preventDefault();
        if (text.trim().length < 2) return toast.error('Please write a reply');
        setSending(true);
        try {
            const d = await api(`/support/${openId}/reply`, { method: 'POST', body: { message: text.trim() } });
            setThread(d);
            setText('');
            toast.success('Your reply has been sent');
            loadList();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSending(false);
        }
    };

    const select = (t) => {
        setOpenId(t._id);
        window.history.replaceState(null, '', `/support?open=${t._id}`);
    };
    const back = () => {
        setOpenId(null);
        window.history.replaceState(null, '', '/support');
        loadList();
    };

    return (
        <div className="wrap py-6 sm:py-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#0b2a5b]">My Messages</h1>
                    <p className="text-sm text-slate-500">Your conversations with our support team.</p>
                </div>
                <Link href="/contact" className="btn"><MessageSquarePlus size={16} /> New message</Link>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[380px_1fr]">
                {/* List */}
                <div className={`card overflow-hidden ${openId ? 'hidden lg:block' : ''}`}>
                    <div className="max-h-[70vh] divide-y overflow-y-auto">
                        {!items && [1, 2, 3].map((i) => <div key={i} className="m-3 h-20 animate-pulse rounded-lg bg-slate-100" />)}
                        {items && items.length === 0 && (
                            <div className="grid place-items-center px-6 py-16 text-center">
                                <div>
                                    <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                                    <p className="mt-2 font-semibold text-slate-700">No messages yet</p>
                                    <p className="text-sm text-slate-500">Have a question about an order or a product? We are happy to help.</p>
                                    <Link href="/contact" className="btn mt-4">Contact us</Link>
                                </div>
                            </div>
                        )}
                        {(items || []).map((t) => {
                            const [label, tone] = statusOf(t);
                            return (
                                <button key={t._id} onClick={() => select(t)} className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 ${openId === t._id ? 'bg-blue-50/70' : ''}`}>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span className={`truncate text-sm ${t.customerUnread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>{t.topic}</span>
                                            <span className="shrink-0 text-[11px] text-slate-400">{ago(t.lastActivityAt || t.createdAt)}</span>
                                        </span>
                                        <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{t.message}</span>
                                        <span className="mt-2 flex items-center gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>
                                            {t.customerUnread && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">New reply</span>}
                                            {t.replyCount > 0 && <span className="text-[11px] text-slate-400">{t.replyCount} {t.replyCount === 1 ? 'reply' : 'replies'}</span>}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Conversation */}
                <div className={openId ? '' : 'hidden lg:block'}>
                    {!openId ? (
                        <div className="card grid min-h-[320px] place-items-center p-10 text-center text-slate-400">
                            <div><Inbox className="mx-auto h-12 w-12" /><p className="mt-3 font-semibold text-slate-600">Select a conversation to read it</p></div>
                        </div>
                    ) : !thread ? (
                        <div className="card space-y-3 p-5">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
                    ) : (
                        <div className="card anim-fade overflow-hidden">
                            <div className="flex items-center gap-3 border-b p-4">
                                <button onClick={back} aria-label="Back to messages" className="rounded-lg p-2 transition hover:bg-slate-100 lg:hidden"><ArrowLeft size={18} /></button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold text-slate-900">{thread.topic}</p>
                                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                                        <span>Started {dateTime(thread.createdAt)}</span>
                                        {thread.orderId && <span className="inline-flex items-center gap-0.5"><Hash size={11} />Order {thread.orderId}</span>}
                                    </p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusOf(thread)[1]}`}>{statusOf(thread)[0]}</span>
                            </div>

                            <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
                                <Bubble mine name="You" text={thread.message} time={thread.createdAt} />
                                {(thread.replies || []).map((r) => (
                                    <Bubble key={r._id} mine={r.from === 'customer'} name={r.from === 'customer' ? 'You' : 'Balothia Support'} text={r.message} time={r.createdAt} />
                                ))}
                                <div ref={endRef} />
                            </div>

                            <form onSubmit={send} className="space-y-3 border-t bg-slate-50 p-4">
                                {thread.status === 'resolved' && (
                                    <p className="text-xs text-emerald-700">This conversation is marked as resolved. If you still need help, reply below and we will reopen it.</p>
                                )}
                                <textarea
                                    rows={3}
                                    maxLength={1500}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send(e); }}
                                    placeholder="Write your reply…"
                                    className="input resize-y bg-white"
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">{text.length}/1500</span>
                                    <button disabled={sending} className="btn">
                                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        {sending ? 'Sending…' : 'Send reply'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}