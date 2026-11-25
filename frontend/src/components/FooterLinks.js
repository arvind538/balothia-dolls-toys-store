'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FOOTER_LINKS } from '@/lib/links';

export default function FooterLinks({ title = 'Links' }) {
    const path = usePathname();

    return (
        <nav aria-label="Footer links">
            <h4 className="mb-5 text-[17px] font-bold text-black">{title}</h4>

            {/* Two columns on small screens, a single column from tablet upwards */}
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-1">
                {FOOTER_LINKS.map((l) => {
                    // Highlight the current page ("Search" is excluded so it is not active on every product page)
                    const active = path === l.href || (l.href !== '/products' && path.startsWith(`${l.href}/`));
                    return (
                        <li key={l.href}>
                            <Link
                                href={l.href}
                                aria-current={active ? 'page' : undefined}
                                className={`group relative inline-block py-1 text-[15px] transition-colors duration-200 hover:text-black ${active ? 'font-semibold text-black' : 'text-slate-500'
                                    }`}
                            >
                                {l.label}
                                <span
                                    className={`absolute bottom-0 left-0 h-[2px] bg-black transition-all duration-300 ease-out ${active ? 'w-full' : 'w-0 group-hover:w-full'
                                        }`}
                                />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}