'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Search, Heart, ShoppingCart, Menu, X, ChevronDown, User, LogOut, Package, MessageSquare, LayoutDashboard,
} from 'lucide-react';
import { api, inr } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import CategoryIcon from '@/components/CategoryIcon';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const ageHref = (v) => `/products?ageGroup=${encodeURIComponent(v)}`;
const AGES = [
    ['Age 0 – 3 Years', ageHref('0-3')],
    ['Age 3 – 6 Years', ageHref('3-6')],
    ['Age 6 – 9 Years', ageHref('6-9')],
    ['Age 9 – 12 Years', ageHref('9-12')],
    ['Age 12+ Years', ageHref('12+')],
];

const NAV_ITEMS = [
    { label: 'All Categories', type: 'categories' },
    { label: 'Electronic Toys', href: '/products' },
    { label: 'Learning Zone', href: '/products?category=learning-tablets,math-learning,interactive-books' },
    { label: 'STEM Toys', href: '/products?category=stem-toys' },
    { label: 'Musial Toys', href: '/products?category=musial-toys' },
    { label: 'Age Group', menu: AGES },
    { label: 'Offers', href: '/products?offers=true' },
    { label: 'Contact Us', href: '/contact' },
];

const card = 'rounded-xl border border-slate-200 bg-white shadow-xl';
const menuItem = 'flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-black';

const clearFocusLine = (e) => {
    const target = e?.currentTarget;
    requestAnimationFrame(() => {
        if (target instanceof HTMLElement) target.blur();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
};

/* ---------- Logo ---------- */
function Logo({ onNavigate, compact = false }) {
    const size = compact
        ? 'h-12 max-w-[205px]'
        : 'h-12 max-w-[44vw] sm:h-14 sm:max-w-[240px] md:h-16 md:max-w-[285px] lg:h-[68px] lg:max-w-[330px]';
    return (
        <Link
            href="/"
            onClick={(e) => {
                clearFocusLine(e);
                onNavigate?.(e);
            }}
            aria-label="Balothia Home"
            className="flex min-w-0 shrink-0 items-center py-0.5 transition-opacity hover:opacity-95"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/image/headerlogo/logo.png"
                alt="Balothia Refrigeration – Classic Dolls & Toys"
                className={`w-auto object-contain object-left ${size}`}
                draggable={false}
            />
        </Link>
    );
}

/* ---------- Search ---------- */
function SearchBox({ q, setQ, onSubmit }) {
    const [placeholderText, setPlaceholderText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(80);

    const placeholders = [
        'Search for educational toys...',
        'Search for interactive games...',
        'Search for learning tablets...',
        'Search for STEM gadgets...',
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            const i = loopNum % placeholders.length;
            const fullText = placeholders[i];

            setPlaceholderText(
                isDeleting
                    ? fullText.substring(0, placeholderText.length - 1)
                    : fullText.substring(0, placeholderText.length + 1)
            );
            setTypingSpeed(isDeleting ? 40 : 80);

            if (!isDeleting && placeholderText === fullText) {
                setTypingSpeed(2000);
                setIsDeleting(true);
            } else if (isDeleting && placeholderText === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                setTypingSpeed(500);
            }
        }, typingSpeed);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [placeholderText, isDeleting, loopNum, typingSpeed]);

    return (
        <form onSubmit={onSubmit} className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800">
            <Search size={17} className="shrink-0 text-slate-500" />
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={placeholderText || 'Search...'}
                aria-label="Search products"
                className="w-full min-w-0 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="hidden">Search</button>
        </form>
    );
}

function Badge({ n }) {
    if (!n || n < 1) return null;
    return (
        <span className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {n > 99 ? '99+' : n}
        </span>
    );
}

function IconLink({ href, icon: Icon, label, sub, badge }) {
    return (
        <Link
            href={href}
            onClick={clearFocusLine}
            aria-label={label}
            className="group/i flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-100 sm:px-2"
        >
            <span className="relative">
                <Icon size={22} className="text-slate-700 transition group-hover/i:scale-110" />
                <Badge n={badge} />
            </span>
            <span className="hidden text-left leading-tight lg:block">
                <span className="block text-[10px] text-slate-500">{label}</span>
                <span className="text-[13px] font-semibold text-slate-800">{sub}</span>
            </span>
        </Link>
    );
}

/* ---------- Desktop nav pieces: Hover par line draw, Click/Leave par remove ---------- */
function NavLink({ href, children }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => {
                setHovered(false);
                clearFocusLine(e);
            }}
            className="relative py-1.5 text-[14.5px] font-medium text-slate-600 transition-colors hover:text-black focus:outline-none"
        >
            {children}
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-0 left-0 h-[2px] bg-slate-800 transition-all duration-300 ease-out ${hovered ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
            />
        </Link>
    );
}

function NavDropdown({ id, label, openMenu, setOpenMenu, align = 'left', width = 'min-w-[200px]', children }) {
    const open = openMenu === id;
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => {
                setHovered(true);
                setOpenMenu(id);
            }}
            onMouseLeave={() => {
                setHovered(false);
                setOpenMenu(null);
            }}
        >
            <button
                type="button"
                onClick={(e) => {
                    setHovered(false);
                    setOpenMenu(open ? null : id);
                    clearFocusLine(e);
                }}
                aria-expanded={open}
                aria-haspopup="true"
                className="relative flex cursor-pointer items-center gap-1 py-1.5 text-[14.5px] font-medium text-slate-600 transition hover:text-black focus:outline-none"
            >
                {label}
                <ChevronDown
                    size={14}
                    className={`mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
                <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute bottom-0 left-0 h-[2px] bg-slate-800 transition-all duration-300 ease-out ${hovered ? 'w-full opacity-100' : 'w-0 opacity-0'
                        }`}
                />
            </button>

            <div
                className={`absolute top-full z-50 pt-1.5 transition-all duration-150 ${align === 'right' ? 'right-0' : 'left-0'
                    } ${width} ${open
                        ? 'visible translate-y-0 opacity-100'
                        : 'pointer-events-none invisible translate-y-1 opacity-0'
                    }`}
            >
                {children}
            </div>
        </div>
    );
}

/* ---------- Mobile drawer piece: a smooth accordion ---------- */
function DrawerGroup({ id, label, openId, onToggle, children }) {
    const open = openId === id;
    return (
        <div>
            <button
                type="button"
                onClick={() => onToggle(open ? null : id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-slate-50"
            >
                {label}
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="space-y-0.5 pb-1 pl-2">{children}</div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Header ---------- */
export default function Header() {
    const router = useRouter();
    const path = usePathname();
    const { user, logout } = useAuth();
    const { count, subtotal } = useCart();
    const [cats, setCats] = useState([]);
    const [q, setQ] = useState('');
    const [drawer, setDrawer] = useState(false);
    const [drawerGroup, setDrawerGroup] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    const [openMenu, setOpenMenu] = useState(null);
    const navRef = useRef(null);
    const accountRef = useRef(null);

    const barRef = useRef(null);
    const [dims, setDims] = useState({ h: 102 });

    const [supportUnread, setSupportUnread] = useState(0);
    useEffect(() => {
        if (!user) { setSupportUnread(0); return; }
        const load = () => api('/support/summary').then((d) => setSupportUnread(d.unread || 0)).catch(() => { });
        load();
        const t = setInterval(load, 60000);
        window.addEventListener('bt:support-changed', load);
        return () => { clearInterval(t); window.removeEventListener('bt:support-changed', load); };
    }, [user]);

    const wishCount = user?.wishlist?.length || 0;
    const firstName = user?.name?.split(' ')[0];

    useIsoLayoutEffect(() => {
        const bar = barRef.current;
        if (!bar) return;
        const measure = () => setDims({ h: bar.offsetHeight });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(bar);
        return () => ro.disconnect();
    }, []);

    useEffect(() => { api('/categories', { auth: false }).then(setCats).catch(() => { }); }, []);

    useEffect(() => {
        const on = () => setScrolled(window.scrollY > 8);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);

    useEffect(() => {
        setDrawer(false);
        setOpenMenu(null);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, [path]);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e) => { if (e.matches) setDrawer(false); };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const handleOutside = (e) => {
            if (
                (!navRef.current || !navRef.current.contains(e.target)) &&
                (!accountRef.current || !accountRef.current.contains(e.target))
            ) {
                setOpenMenu(null);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') { setOpenMenu(null); setDrawer(false); }
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = drawer ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawer]);

    const closeAll = () => {
        setDrawer(false);
        setOpenMenu(null);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    const handleLogoClick = (e) => {
        closeAll();
        if (path === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
        }
    };

    const handleMenuLinkClick = (e) => {
        clearFocusLine(e);
        setOpenMenu(null);
    };

    const search = (e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/products?search=${encodeURIComponent(q.trim())}`);
        closeAll();
    };

    const doLogout = () => {
        logout();
        closeAll();
        router.push('/');
    };

    const drawerLink = 'block rounded-lg px-3 py-2 transition hover:bg-slate-50';

    return (
        <>
            <div aria-hidden="true" style={{ height: dims.h }} />

            <div
                ref={barRef}
                id="site-header"
                className={`fixed inset-x-0 top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}
            >
                <div className="border-b border-slate-100">
                    {/* Row 1: menu button, logo, search (tablet and up), icons */}
                    <div className="wrap flex items-center gap-2 py-2 sm:gap-3 md:gap-4 md:py-2">
                        <button
                            type="button"
                            className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
                            onClick={() => setDrawer(true)}
                            aria-label="Open menu"
                        >
                            <Menu />
                        </button>

                        <Logo onNavigate={handleLogoClick} />

                        <div className="hidden max-w-2xl flex-1 md:block">
                            <SearchBox q={q} setQ={setQ} onSubmit={search} />
                        </div>

                        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 md:gap-2.5">
                            <IconLink href="/wishlist" icon={Heart} label="Wishlist" sub={wishCount ? `${wishCount} item${wishCount > 1 ? 's' : ''}` : 'Saved'} badge={wishCount} />
                            <IconLink href="/cart" icon={ShoppingCart} label="Cart" sub={inr(subtotal)} badge={count} />

                            <span aria-hidden="true" className="mx-0.5 hidden h-7 w-px bg-slate-200 md:block" />

                            {/* Account menu (tablet and desktop): opens on click */}
                            <div ref={accountRef} className="relative hidden md:block">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        setOpenMenu((prev) => (prev === 'account' ? null : 'account'));
                                        clearFocusLine(e);
                                    }}
                                    aria-expanded={openMenu === 'account'}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-slate-100"
                                >
                                    <span className="relative grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-700">
                                        <User size={18} />
                                        {supportUnread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />}
                                    </span>
                                    <span className="hidden text-left leading-tight lg:block">
                                        <span className="block text-[10px] text-slate-500">Hello, {firstName || 'Guest'}</span>
                                        <span className="flex items-center gap-1 text-[13px] font-semibold text-slate-800">
                                            {user ? 'My Account' : 'Login'}
                                            <ChevronDown size={13} className={`transition-transform duration-200 ${openMenu === 'account' ? 'rotate-180' : ''}`} />
                                        </span>
                                    </span>
                                </button>

                                <div
                                    className={`absolute right-0 top-full z-50 mt-2 w-64 origin-top transition-all duration-200 ease-out ${openMenu === 'account'
                                        ? 'visible translate-y-0 scale-100 opacity-100'
                                        : 'pointer-events-none invisible -translate-y-1.5 scale-95 opacity-0'
                                        }`}
                                >
                                    <div className={`${card} py-1.5`}>
                                        {user ? (
                                            <>
                                                <div className="border-b px-4 pb-2.5 pt-1">
                                                    <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
                                                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                                                </div>
                                                <Link href="/profile" onClick={handleMenuLinkClick} className={menuItem}><User size={15} /> My Profile</Link>
                                                <Link href="/orders" onClick={handleMenuLinkClick} className={menuItem}><Package size={15} /> My Orders</Link>
                                                <Link href="/support" onClick={handleMenuLinkClick} className={menuItem}>
                                                    <MessageSquare size={15} /> My Messages
                                                    {supportUnread > 0 && <span className="ml-auto rounded-full bg-orange-500 px-2 text-xs font-bold text-white">{supportUnread}</span>}
                                                </Link>
                                                <Link href="/wishlist" onClick={handleMenuLinkClick} className={menuItem}>
                                                    <Heart size={15} /> My Wishlist
                                                    {wishCount > 0 && <span className="ml-auto rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-700">{wishCount}</span>}
                                                </Link>
                                                {user.role === 'admin' && (
                                                    <Link href="/admin" onClick={handleMenuLinkClick} className={`${menuItem} font-semibold text-slate-800`}>
                                                        <LayoutDashboard size={15} /> Admin Panel
                                                    </Link>
                                                )}
                                                <button type="button" onClick={doLogout} className={`${menuItem} w-full cursor-pointer border-t text-red-600 hover:bg-red-50 hover:text-red-700`}>
                                                    <LogOut size={15} /> Logout
                                                </button>
                                            </>
                                        ) : (
                                            <div className="space-y-2.5 px-4 py-3">
                                                <p className="text-sm text-slate-600">Login to view orders, wishlist &amp; offers.</p>
                                                <Link href="/login" onClick={handleMenuLinkClick} className="btn block w-full rounded-md bg-slate-800 py-2 text-center text-white">Login</Link>
                                                <p className="text-center text-sm text-slate-600">
                                                    New here? <Link href="/register" onClick={handleMenuLinkClick} className="font-semibold text-slate-800 hover:underline">Register now</Link>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Account link (mobile only) */}
                            <Link href={user ? '/profile' : '/login'} onClick={clearFocusLine} aria-label="Account" className="relative rounded-lg p-1.5 hover:bg-slate-100 md:hidden">
                                <User size={22} className="text-slate-700" />
                                {supportUnread > 0 && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />}
                            </Link>
                        </div>
                    </div>

                    {/* Row 2 on mobile: search */}
                    <div className="wrap pb-2 md:hidden"><SearchBox q={q} setQ={setQ} onSubmit={search} /></div>

                    {/* Desktop navigation (from 1024px) */}
                    <div ref={navRef} className="wrap hidden lg:block">
                        <nav className="flex items-center justify-center gap-6 bg-white pb-1.5 xl:gap-8">
                            {NAV_ITEMS.map((item) => {
                                if (item.type === 'categories') {
                                    return (
                                        <NavDropdown key={item.label} id="cats" label={item.label} openMenu={openMenu} setOpenMenu={setOpenMenu} width="w-64">
                                            <div className={`${card} overflow-hidden text-slate-700`}>
                                                <div className="max-h-[340px] divide-y divide-slate-50 overflow-y-auto py-1.5">
                                                    {cats.map((c) => (
                                                        <Link key={c._id} href={`/products?category=${c.slug}`} onClick={handleMenuLinkClick} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                                                            <CategoryIcon c={c} size={28} rounded="rounded-md" /> {c.name}
                                                        </Link>
                                                    ))}
                                                    {cats.length === 0 && <p className="px-4 py-3 text-xs text-slate-400">No categories available</p>}
                                                </div>
                                                <Link
                                                    href="/products"
                                                    onClick={handleMenuLinkClick}
                                                    className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                                >
                                                    <span>View all products</span>
                                                    <span>→</span>
                                                </Link>
                                            </div>
                                        </NavDropdown>
                                    );
                                }
                                if (item.menu) {
                                    return (
                                        <NavDropdown key={item.label} id={item.label} label={item.label} openMenu={openMenu} setOpenMenu={setOpenMenu} align={item.align}>
                                            <div className={`${card} py-1.5`}>
                                                {item.menu.map(([label, href]) => (
                                                    <Link key={href} href={href} onClick={handleMenuLinkClick} className={menuItem}>{label}</Link>
                                                ))}
                                            </div>
                                        </NavDropdown>
                                    );
                                }
                                return <NavLink key={item.label} href={item.href}>{item.label}</NavLink>;
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* MOBILE AND TABLET DRAWER (below 1024px) */}
            <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? 'visible' : 'invisible'}`} aria-hidden={!drawer}>
                <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawer(false)} />
                <div className={`absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white shadow-xl transition-transform duration-300 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between gap-2 border-b p-3.5">
                        <Logo onNavigate={handleLogoClick} compact />
                        <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100"><X /></button>
                    </div>

                    <div className="border-b bg-slate-50 p-3.5">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800 text-base font-bold text-white">{firstName?.[0]?.toUpperCase()}</span>
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-800">{user.name}</p>
                                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link href="/login" onClick={closeAll} className="btn rounded-md bg-slate-800 py-2 text-center text-white">Login</Link>
                                <Link href="/register" onClick={closeAll} className="btn-outline rounded-md border border-slate-300 bg-white py-2 text-center">Register</Link>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1 p-3 text-sm font-medium text-slate-700">
                        <Link href="/" onClick={handleLogoClick} className={drawerLink}>Home</Link>

                        {NAV_ITEMS.map((item) => {
                            if (item.type === 'categories') {
                                return (
                                    <DrawerGroup key={item.label} id="cats" label={item.label} openId={drawerGroup} onToggle={setDrawerGroup}>
                                        {cats.map((c) => (
                                            <Link key={c._id} href={`/products?category=${c.slug}`} onClick={closeAll} className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50">
                                                <CategoryIcon c={c} size={28} rounded="rounded-md" /> {c.name}
                                            </Link>
                                        ))}
                                        <Link href="/products" onClick={closeAll} className="block rounded-lg px-3 py-2 font-semibold text-slate-900 transition hover:bg-slate-50">View all products →</Link>
                                    </DrawerGroup>
                                );
                            }
                            if (item.menu) {
                                return (
                                    <DrawerGroup key={item.label} id={item.label} label={item.label} openId={drawerGroup} onToggle={setDrawerGroup}>
                                        {item.menu.map(([label, href]) => (
                                            <Link key={href} href={href} onClick={closeAll} className="block rounded-lg px-3 py-2 transition hover:bg-slate-50">{label}</Link>
                                        ))}
                                    </DrawerGroup>
                                );
                            }
                            return <Link key={item.label} href={item.href} onClick={closeAll} className={drawerLink}>{item.label}</Link>;
                        })}

                        <p className="px-3 pt-3 text-xs font-bold uppercase text-slate-400">My Account</p>
                        {user && <Link href="/profile" onClick={closeAll} className={drawerLink}>My Profile</Link>}
                        <Link href="/orders" onClick={closeAll} className={drawerLink}>My Orders</Link>
                        <Link href="/support" onClick={closeAll} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-slate-50">
                            My Messages {supportUnread > 0 && <span className="rounded-full bg-orange-500 px-2 text-xs font-bold text-white">{supportUnread}</span>}
                        </Link>
                        <Link href="/wishlist" onClick={closeAll} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-slate-50">
                            My Wishlist {wishCount > 0 && <span className="rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-700">{wishCount}</span>}
                        </Link>
                        {user?.role === 'admin' && <Link href="/admin" onClick={closeAll} className="block rounded-lg px-3 py-2 font-bold text-slate-800 transition hover:bg-slate-50">Admin Panel</Link>}
                        {user && <button type="button" onClick={doLogout} className="block w-full rounded-lg px-3 py-2 text-left text-red-600 transition hover:bg-red-50">Logout</button>}
                    </div>
                </div>
            </div>
        </>
    );
}












// 'use client';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { useEffect, useLayoutEffect, useRef, useState } from 'react';
// import {
//     Search, Heart, ShoppingCart, Menu, X, ChevronDown, User, LogOut, Package, MessageSquare, LayoutDashboard,
// } from 'lucide-react';
// import { api, inr } from '@/lib/api';
// import { useAuth } from '@/context/AuthContext';
// import { useCart } from '@/context/CartContext';
// import CategoryIcon from '@/components/CategoryIcon';

// const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// const ageHref = (v) => `/products?ageGroup=${encodeURIComponent(v)}`;
// const AGES = [
//     ['Age 0 – 3 Years', ageHref('0-3')],
//     ['Age 3 – 6 Years', ageHref('3-6')],
//     ['Age 6 – 9 Years', ageHref('6-9')],
//     ['Age 9 – 12 Years', ageHref('9-12')],
//     ['Age 12+ Years', ageHref('12+')],
// ];


// const NAV_ITEMS = [
//     { label: 'All Categories', type: 'categories' },
//     { label: 'Electronic Toys', href: '/products' },
//     { label: 'Learning Zone', href: '/products?category=learning-tablets,math-learning,interactive-books' },
//     { label: 'STEM Toys', href: '/products?category=stem-toys' },
//     { label: 'Musial Toys', href: '/products?category=musial-toys' },
//     { label: 'Age Group', menu: AGES },
//     { label: 'Offers', href: '/products?offers=true' },
//     { label: 'Contact Us', href: '/contact' },
// ];

// const card = 'rounded-xl border border-slate-200 bg-white shadow-xl';
// const menuItem = 'flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-black';

// /* ---------- Logo ---------- */
// function Logo({ onNavigate, compact = false }) {

//     const size = compact
//         ? 'h-12 max-w-[200px]'
//         : 'h-11 max-w-[40vw] sm:h-14 sm:max-w-[240px] md:h-16 md:max-w-[280px] lg:h-20 lg:max-w-[340px] xl:h-24 xl:max-w-[420px]';
//     return (
//         <Link
//             href="/"
//             onClick={onNavigate}
//             aria-label="Balothia Home"
//             className="flex min-w-0 shrink items-center py-0.5 transition-opacity hover:opacity-95"
//         >
//             {/* eslint-disable-next-line @next/next/no-img-element */}
//             <img
//                 src="/image/headerlogo/logo.png"
//                 alt="Balothia Refrigeration – Classic Dolls & Toys"
//                 className={`w-auto object-contain object-left ${size}`}
//                 draggable={false}
//             />
//         </Link>
//     );
// }

// /* ---------- Search ---------- */
// function SearchBox({ q, setQ, onSubmit }) {
//     const [placeholderText, setPlaceholderText] = useState('');
//     const [isDeleting, setIsDeleting] = useState(false);
//     const [loopNum, setLoopNum] = useState(0);
//     const [typingSpeed, setTypingSpeed] = useState(80);

//     const placeholders = [
//         'Search for educational toys...',
//         'Search for interactive games...',
//         'Search for learning tablets...',
//         'Search for STEM gadgets...',
//     ];

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             const i = loopNum % placeholders.length;
//             const fullText = placeholders[i];

//             setPlaceholderText(
//                 isDeleting
//                     ? fullText.substring(0, placeholderText.length - 1)
//                     : fullText.substring(0, placeholderText.length + 1)
//             );
//             setTypingSpeed(isDeleting ? 40 : 80);

//             if (!isDeleting && placeholderText === fullText) {
//                 setTypingSpeed(2000);
//                 setIsDeleting(true);
//             } else if (isDeleting && placeholderText === '') {
//                 setIsDeleting(false);
//                 setLoopNum(loopNum + 1);
//                 setTypingSpeed(500);
//             }
//         }, typingSpeed);

//         return () => clearTimeout(timer);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [placeholderText, isDeleting, loopNum, typingSpeed]);

//     return (
//         <form onSubmit={onSubmit} className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800">
//             <Search size={18} className="shrink-0 text-slate-500" />
//             <input
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder={placeholderText || 'Search...'}
//                 aria-label="Search products"
//                 className="w-full min-w-0 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
//             />
//             <button type="submit" className="hidden">Search</button>
//         </form>
//     );
// }

// function Badge({ n }) {
//     if (!n || n < 1) return null;
//     return (
//         <span className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
//             {n > 99 ? '99+' : n}
//         </span>
//     );
// }

// function IconLink({ href, icon: Icon, label, sub, badge }) {
//     return (
//         <Link href={href} aria-label={label} className="group/i flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-100 sm:px-2">
//             <span className="relative">
//                 <Icon size={24} className="text-slate-700 transition group-hover/i:scale-110" />
//                 <Badge n={badge} />
//             </span>
//             <span className="hidden text-left leading-tight lg:block">
//                 <span className="block text-[11px] text-slate-500">{label}</span>
//                 <span className="text-sm font-semibold text-slate-800">{sub}</span>
//             </span>
//         </Link>
//     );
// }

// /* ---------- Desktop nav pieces ---------- */
// function NavLink({ href, children }) {
//     const path = usePathname();
//     const active = !href.includes('?') && !href.includes('#') && path === href;
//     return (
//         <Link href={href} className={`group relative py-2 text-[15px] font-medium transition-colors ${active ? 'text-black' : 'text-slate-600 hover:text-black'}`}>
//             {children}
//             <span className={`absolute bottom-0 left-0 h-[2px] bg-slate-800 transition-all duration-300 ease-out group-hover:w-full ${active ? 'w-full' : 'w-0'}`} />
//         </Link>
//     );
// }

// function NavDropdown({ id, label, openMenu, setOpenMenu, align = 'left', width = 'min-w-[200px]', children }) {
//     const open = openMenu === id;
//     return (
//         <div className="relative" onMouseEnter={() => setOpenMenu(id)} onMouseLeave={() => setOpenMenu(null)}>
//             <button
//                 type="button"
//                 onClick={() => setOpenMenu(open ? null : id)}
//                 aria-expanded={open}
//                 aria-haspopup="true"
//                 className="group relative flex cursor-pointer items-center gap-1 py-2 text-[15px] font-medium text-slate-600 transition hover:text-black"
//             >
//                 {label}
//                 <ChevronDown size={14} className={`mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
//                 <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-slate-800 transition-all duration-300 ease-out group-hover:w-full" />
//             </button>

//             <div
//                 className={`absolute top-full z-50 pt-2 transition-all duration-150 ${align === 'right' ? 'right-0' : 'left-0'} ${width} ${open
//                     ? 'visible translate-y-0 opacity-100'
//                     : 'pointer-events-none invisible translate-y-1 opacity-0'
//                     }`}
//             >
//                 {children}
//             </div>
//         </div>
//     );
// }

// /* ---------- Mobile drawer piece: a smooth accordion ---------- */
// function DrawerGroup({ id, label, openId, onToggle, children }) {
//     const open = openId === id;
//     return (
//         <div>
//             <button
//                 type="button"
//                 onClick={() => onToggle(open ? null : id)}
//                 aria-expanded={open}
//                 className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
//             >
//                 {label}
//                 <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
//             </button>
//             <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
//                 <div className="overflow-hidden">
//                     <div className="space-y-0.5 pb-1 pl-2">{children}</div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// /* ---------- Header ---------- */
// export default function Header() {
//     const router = useRouter();
//     const path = usePathname();
//     const { user, logout } = useAuth();
//     const { count, subtotal } = useCart();
//     const [cats, setCats] = useState([]);
//     const [q, setQ] = useState('');
//     const [drawer, setDrawer] = useState(false);
//     const [drawerGroup, setDrawerGroup] = useState(null); // which accordion is open in the drawer
//     const [scrolled, setScrolled] = useState(false);

//     const [openMenu, setOpenMenu] = useState(null);
//     const navRef = useRef(null);
//     const accountRef = useRef(null);

//     const barRef = useRef(null);
//     const [dims, setDims] = useState({ h: 120 });

//     // Number of conversations where support has replied and the customer has not read it yet.
//     const [supportUnread, setSupportUnread] = useState(0);
//     useEffect(() => {
//         if (!user) { setSupportUnread(0); return; }
//         const load = () => api('/support/summary').then((d) => setSupportUnread(d.unread || 0)).catch(() => { });
//         load();
//         const t = setInterval(load, 60000);
//         window.addEventListener('bt:support-changed', load);
//         return () => { clearInterval(t); window.removeEventListener('bt:support-changed', load); };
//     }, [user]);

//     const wishCount = user?.wishlist?.length || 0;
//     const firstName = user?.name?.split(' ')[0];

//     // Measure the header so the spacer below it is exactly as tall (content never hides behind it).
//     useIsoLayoutEffect(() => {
//         const bar = barRef.current;
//         if (!bar) return;
//         const measure = () => setDims({ h: bar.offsetHeight });
//         measure();
//         const ro = new ResizeObserver(measure);
//         ro.observe(bar);
//         return () => ro.disconnect();
//     }, []);

//     useEffect(() => { api('/categories', { auth: false }).then(setCats).catch(() => { }); }, []);

//     useEffect(() => {
//         const on = () => setScrolled(window.scrollY > 8);
//         on();
//         window.addEventListener('scroll', on, { passive: true });
//         return () => window.removeEventListener('scroll', on);
//     }, []);

//     useEffect(() => {
//         setDrawer(false);
//         setOpenMenu(null);
//     }, [path]);

//     // Close the drawer automatically when the screen grows to desktop size.
//     useEffect(() => {
//         const mq = window.matchMedia('(min-width: 1024px)');
//         const onChange = (e) => { if (e.matches) setDrawer(false); };
//         mq.addEventListener('change', onChange);
//         return () => mq.removeEventListener('change', onChange);
//     }, []);

//     useEffect(() => {
//         const handleOutside = (e) => {
//             if (
//                 (!navRef.current || !navRef.current.contains(e.target)) &&
//                 (!accountRef.current || !accountRef.current.contains(e.target))
//             ) {
//                 setOpenMenu(null);
//             }
//         };
//         const handleEsc = (e) => {
//             if (e.key === 'Escape') { setOpenMenu(null); setDrawer(false); }
//         };
//         document.addEventListener('mousedown', handleOutside);
//         document.addEventListener('keydown', handleEsc);
//         return () => {
//             document.removeEventListener('mousedown', handleOutside);
//             document.removeEventListener('keydown', handleEsc);
//         };
//     }, []);

//     useEffect(() => {
//         document.body.style.overflow = drawer ? 'hidden' : '';
//         return () => { document.body.style.overflow = ''; };
//     }, [drawer]);

//     const closeAll = () => {
//         setDrawer(false);
//         setOpenMenu(null);
//     };

//     const handleLogoClick = (e) => {
//         closeAll();
//         if (path === '/') {
//             e.preventDefault();
//             window.scrollTo({ top: 0, behavior: 'smooth' });
//         } else {
//             setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
//         }
//     };

//     const handleMenuLinkClick = () => {
//         setOpenMenu(null);
//         if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
//     };

//     const search = (e) => {
//         e.preventDefault();
//         if (q.trim()) router.push(`/products?search=${encodeURIComponent(q.trim())}`);
//         closeAll();
//     };

//     const doLogout = () => {
//         logout();
//         closeAll();
//         router.push('/');
//     };

//     const drawerLink = 'block rounded-lg px-3 py-2.5 transition hover:bg-slate-50';

//     return (
//         <>
//             {/* Spacer based on the header height so the content does not jump */}
//             <div aria-hidden="true" style={{ height: dims.h }} />

//             {/* Fixed top header */}
//             <div
//                 ref={barRef}
//                 id="site-header"
//                 className={`fixed inset-x-0 top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}
//             >
//                 <div className="border-b border-slate-100">
//                     {/* Row 1: menu button, logo, search (tablet and up), icons */}
//                     <div className="wrap flex items-center gap-2 py-2.5 sm:gap-3 md:gap-5 md:py-3">
//                         <button
//                             type="button"
//                             className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
//                             onClick={() => setDrawer(true)}
//                             aria-label="Open menu"
//                         >
//                             <Menu />
//                         </button>

//                         <Logo onNavigate={handleLogoClick} />

//                         <div className="hidden max-w-2xl flex-1 md:block">
//                             <SearchBox q={q} setQ={setQ} onSubmit={search} />
//                         </div>

//                         <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 md:gap-3">
//                             <IconLink href="/wishlist" icon={Heart} label="Wishlist" sub={wishCount ? `${wishCount} item${wishCount > 1 ? 's' : ''}` : 'Saved'} badge={wishCount} />
//                             <IconLink href="/cart" icon={ShoppingCart} label="Cart" sub={inr(subtotal)} badge={count} />

//                             <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />

//                             {/* Account menu (tablet and desktop): opens on click */}
//                             <div ref={accountRef} className="relative hidden md:block">
//                                 <button
//                                     type="button"
//                                     onClick={() => setOpenMenu((prev) => (prev === 'account' ? null : 'account'))}
//                                     aria-expanded={openMenu === 'account'}
//                                     className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
//                                 >
//                                     <span className="relative grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700">
//                                         <User size={20} />
//                                         {supportUnread > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-orange-500 ring-2 ring-white" />}
//                                     </span>
//                                     <span className="hidden text-left leading-tight lg:block">
//                                         <span className="block text-[11px] text-slate-500">Hello, {firstName || 'Guest'}</span>
//                                         <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
//                                             {user ? 'My Account' : 'Login'}
//                                             <ChevronDown size={14} className={`transition-transform duration-200 ${openMenu === 'account' ? 'rotate-180' : ''}`} />
//                                         </span>
//                                     </span>
//                                 </button>

//                                 <div
//                                     className={`absolute right-0 top-full z-50 mt-2 w-64 origin-top transition-all duration-200 ease-out ${openMenu === 'account'
//                                         ? 'visible translate-y-0 scale-100 opacity-100'
//                                         : 'pointer-events-none invisible -translate-y-1.5 scale-95 opacity-0'
//                                         }`}
//                                 >
//                                     <div className={`${card} py-2`}>
//                                         {user ? (
//                                             <>
//                                                 <div className="border-b px-4 pb-3 pt-1">
//                                                     <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
//                                                     <p className="truncate text-xs text-slate-500">{user.email}</p>
//                                                 </div>
//                                                 <Link href="/profile" onClick={handleMenuLinkClick} className={menuItem}><User size={16} /> My Profile</Link>
//                                                 <Link href="/orders" onClick={handleMenuLinkClick} className={menuItem}><Package size={16} /> My Orders</Link>
//                                                 <Link href="/support" onClick={handleMenuLinkClick} className={menuItem}>
//                                                     <MessageSquare size={16} /> My Messages
//                                                     {supportUnread > 0 && <span className="ml-auto rounded-full bg-orange-500 px-2 text-xs font-bold text-white">{supportUnread}</span>}
//                                                 </Link>
//                                                 <Link href="/wishlist" onClick={handleMenuLinkClick} className={menuItem}>
//                                                     <Heart size={16} /> My Wishlist
//                                                     {wishCount > 0 && <span className="ml-auto rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-700">{wishCount}</span>}
//                                                 </Link>
//                                                 {user.role === 'admin' && (
//                                                     <Link href="/admin" onClick={handleMenuLinkClick} className={`${menuItem} font-semibold text-slate-800`}>
//                                                         <LayoutDashboard size={16} /> Admin Panel
//                                                     </Link>
//                                                 )}
//                                                 <button type="button" onClick={doLogout} className={`${menuItem} w-full cursor-pointer border-t text-red-600 hover:bg-red-50 hover:text-red-700`}>
//                                                     <LogOut size={16} /> Logout
//                                                 </button>
//                                             </>
//                                         ) : (
//                                             <div className="space-y-3 px-4 py-3">
//                                                 <p className="text-sm text-slate-600">Login to view orders, wishlist &amp; offers.</p>
//                                                 <Link href="/login" onClick={handleMenuLinkClick} className="btn block w-full rounded-md bg-slate-800 py-2 text-center text-white">Login</Link>
//                                                 <p className="text-center text-sm text-slate-600">
//                                                     New here? <Link href="/register" onClick={handleMenuLinkClick} className="font-semibold text-slate-800 hover:underline">Register now</Link>
//                                                 </p>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Account link (mobile only) */}
//                             <Link href={user ? '/profile' : '/login'} aria-label="Account" className="relative rounded-lg p-1.5 hover:bg-slate-100 md:hidden">
//                                 <User size={24} className="text-slate-700" />
//                                 {supportUnread > 0 && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />}
//                             </Link>
//                         </div>
//                     </div>

//                     {/* Row 2 on mobile: search */}
//                     <div className="wrap pb-2.5 md:hidden"><SearchBox q={q} setQ={setQ} onSubmit={search} /></div>

//                     {/* Desktop navigation (from 1024px). It is built from NAV_ITEMS. */}
//                     <div ref={navRef} className="wrap hidden lg:block">
//                         <nav className="flex items-center justify-center gap-6 bg-white pb-2 xl:gap-8">
//                             {NAV_ITEMS.map((item) => {
//                                 if (item.type === 'categories') {
//                                     return (
//                                         <NavDropdown key={item.label} id="cats" label={item.label} openMenu={openMenu} setOpenMenu={setOpenMenu} width="w-64">
//                                             <div className={`${card} overflow-hidden text-slate-700`}>
//                                                 <div className="max-h-[340px] divide-y divide-slate-50 overflow-y-auto py-1.5">
//                                                     {cats.map((c) => (
//                                                         <Link key={c._id} href={`/products?category=${c.slug}`} onClick={handleMenuLinkClick} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
//                                                             <CategoryIcon c={c} size={30} rounded="rounded-md" /> {c.name}
//                                                         </Link>
//                                                     ))}
//                                                     {cats.length === 0 && <p className="px-4 py-3 text-xs text-slate-400">No categories available</p>}
//                                                 </div>
//                                                 <Link
//                                                     href="/products"
//                                                     onClick={handleMenuLinkClick}
//                                                     className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
//                                                 >
//                                                     <span>View all products</span>
//                                                     <span>→</span>
//                                                 </Link>
//                                             </div>
//                                         </NavDropdown>
//                                     );
//                                 }
//                                 if (item.menu) {
//                                     return (
//                                         <NavDropdown key={item.label} id={item.label} label={item.label} openMenu={openMenu} setOpenMenu={setOpenMenu} align={item.align}>
//                                             <div className={`${card} py-1.5`}>
//                                                 {item.menu.map(([label, href]) => (
//                                                     <Link key={href} href={href} onClick={handleMenuLinkClick} className={menuItem}>{label}</Link>
//                                                 ))}
//                                             </div>
//                                         </NavDropdown>
//                                     );
//                                 }
//                                 return <NavLink key={item.label} href={item.href}>{item.label}</NavLink>;
//                             })}
//                         </nav>
//                     </div>
//                 </div>
//             </div>

//             {/* MOBILE AND TABLET DRAWER (below 1024px). It is built from NAV_ITEMS too. */}
//             <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? 'visible' : 'invisible'}`} aria-hidden={!drawer}>
//                 <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawer(false)} />
//                 <div className={`absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white shadow-xl transition-transform duration-300 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
//                     <div className="flex items-center justify-between gap-2 border-b p-4">
//                         <Logo onNavigate={handleLogoClick} compact />
//                         <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100"><X /></button>
//                     </div>

//                     <div className="border-b bg-slate-50 p-4">
//                         {user ? (
//                             <div className="flex items-center gap-3">
//                                 <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-800 text-lg font-bold text-white">{firstName?.[0]?.toUpperCase()}</span>
//                                 <div className="min-w-0">
//                                     <p className="truncate font-bold text-slate-800">{user.name}</p>
//                                     <p className="truncate text-xs text-slate-500">{user.email}</p>
//                                 </div>
//                             </div>
//                         ) : (
//                             <div className="grid grid-cols-2 gap-2">
//                                 <Link href="/login" onClick={closeAll} className="btn rounded-md bg-slate-800 py-2 text-center text-white">Login</Link>
//                                 <Link href="/register" onClick={closeAll} className="btn-outline rounded-md border border-slate-300 bg-white py-2 text-center">Register</Link>
//                             </div>
//                         )}
//                     </div>

//                     <div className="space-y-1 p-3 text-sm font-medium text-slate-700">
//                         <Link href="/" onClick={handleLogoClick} className={drawerLink}>Home</Link>

//                         {NAV_ITEMS.map((item) => {
//                             if (item.type === 'categories') {
//                                 return (
//                                     <DrawerGroup key={item.label} id="cats" label={item.label} openId={drawerGroup} onToggle={setDrawerGroup}>
//                                         {cats.map((c) => (
//                                             <Link key={c._id} href={`/products?category=${c.slug}`} onClick={closeAll} className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50">
//                                                 <CategoryIcon c={c} size={28} rounded="rounded-md" /> {c.name}
//                                             </Link>
//                                         ))}
//                                         <Link href="/products" onClick={closeAll} className="block rounded-lg px-3 py-2 font-semibold text-slate-900 transition hover:bg-slate-50">View all products →</Link>
//                                     </DrawerGroup>
//                                 );
//                             }
//                             if (item.menu) {
//                                 return (
//                                     <DrawerGroup key={item.label} id={item.label} label={item.label} openId={drawerGroup} onToggle={setDrawerGroup}>
//                                         {item.menu.map(([label, href]) => (
//                                             <Link key={href} href={href} onClick={closeAll} className="block rounded-lg px-3 py-2 transition hover:bg-slate-50">{label}</Link>
//                                         ))}
//                                     </DrawerGroup>
//                                 );
//                             }
//                             return <Link key={item.label} href={item.href} onClick={closeAll} className={drawerLink}>{item.label}</Link>;
//                         })}

//                         <p className="px-3 pt-4 text-xs font-bold uppercase text-slate-400">My Account</p>
//                         {user && <Link href="/profile" onClick={closeAll} className={drawerLink}>My Profile</Link>}
//                         <Link href="/orders" onClick={closeAll} className={drawerLink}>My Orders</Link>
//                         <Link href="/support" onClick={closeAll} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-slate-50">
//                             My Messages {supportUnread > 0 && <span className="rounded-full bg-orange-500 px-2 text-xs font-bold text-white">{supportUnread}</span>}
//                         </Link>
//                         <Link href="/wishlist" onClick={closeAll} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-slate-50">
//                             My Wishlist {wishCount > 0 && <span className="rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-700">{wishCount}</span>}
//                         </Link>
//                         {user?.role === 'admin' && <Link href="/admin" onClick={closeAll} className="block rounded-lg px-3 py-2.5 font-bold text-slate-800 transition hover:bg-slate-50">Admin Panel</Link>}
//                         {user && <button type="button" onClick={doLogout} className="block w-full rounded-lg px-3 py-2.5 text-left text-red-600 transition hover:bg-red-50">Logout</button>}
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }





