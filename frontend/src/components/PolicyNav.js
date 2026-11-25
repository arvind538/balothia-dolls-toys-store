'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { POLICY_LINKS } from '@/lib/links';

export default function PolicyNav() {
    const path = usePathname();
    const activeRef = useRef(null);

    // On mobile the chips scroll sideways, so keep the active one in view.
    useEffect(() => {
        activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }, [path]);

    const base = 'shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition lg:w-full';
    const on = 'bg-blue-700 text-white shadow-sm';
    const off = 'text-slate-700 hover:bg-blue-50 hover:text-blue-700';

    return (
        <aside className="lg:sticky lg:top-40 lg:self-start">
            <div className="card p-2 lg:p-3">
                <p className="hidden px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-slate-400 lg:block">Our policies</p>
                <nav aria-label="Policies" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                    {POLICY_LINKS.map((p) => {
                        const href = `/policies/${p.slug}`;
                        const active = path === href;
                        return (
                            <Link key={p.slug} href={href} ref={active ? activeRef : null} aria-current={active ? 'page' : undefined} className={`${base} ${active ? on : off}`}>
                                {p.title}
                            </Link>
                        );
                    })}
                    <Link href="/contact" className={`${base} ${path === '/contact' ? on : off} lg:mt-1 lg:border-t lg:rounded-t-none`}>Contact us</Link>
                </nav>
            </div>
        </aside>
    );
}