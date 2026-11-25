'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, ExternalLink, Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import { ago } from '@/lib/format';

export default function MessagesCard() {
    const [d, setD] = useState(null);
    const load = useCallback(() => api('/admin/messages/summary').then(setD).catch(() => { }), []);

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        window.addEventListener('bt:admin-activity', load);
        window.addEventListener('bt:messages-changed', load);
        return () => {
            clearInterval(t);
            window.removeEventListener('bt:admin-activity', load);
            window.removeEventListener('bt:messages-changed', load);
        };
    }, [load]);

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                    Contact Messages
                    {d?.unread > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{d.unread} new</span>}
                </h2>
                <Link href="/admin/messages" className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">View all <ExternalLink size={12} /></Link>
            </div>

            {!d && <div className="h-24 animate-pulse rounded-xl bg-slate-100" />}
            {d && d.recent.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400"><Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />No messages yet</div>
            )}

            <div className="divide-y divide-slate-100">
                {(d?.recent || []).map((m) => (
                    <Link key={m._id} href={`/admin/messages?open=${m._id}`} className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
                        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                            {m.name[0].toUpperCase()}
                            {m.status === 'new' && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${m.status === 'new' ? 'font-extrabold' : 'font-semibold'} text-slate-900`}>{m.name} <span className="font-normal text-slate-400">· {m.topic}</span></span>
                            <span className="block truncate text-xs text-slate-500">{m.message}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">{ago(m.createdAt)}</span>
                        <ChevronRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                    </Link>
                ))}
            </div>
        </section>
    );
}