'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Tags,
    Users,
    Store,
    X,
    Snowflake,
    LayoutGrid,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ShieldCheck,
    UserCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminTopbar from '@/components/AdminTopbar';

const NAV_GROUPS = [
    {
        title: 'Overview',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
            { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
        ],
    },
    {
        title: 'Catalog & Storefront',
        items: [
            { href: '/admin/products', label: 'Products & Stock', icon: Package },
            { href: '/admin/categories', label: 'Categories', icon: Tags },
            { href: '/admin/home-sections', label: 'Home Sections', icon: LayoutGrid },
        ],
    },
    {
        title: 'People & Account',
        items: [
            { href: '/admin/users', label: 'Customers & Admins', icon: Users },
            { href: '/admin/profile', label: 'My Profile', icon: UserCircle },
        ],
    },
];

const trailFor = (p) => {
    if (p === '/admin') return ['Admin', 'Dashboard'];
    if (p.startsWith('/admin/orders/')) return ['Admin', 'Orders', 'Details'];
    if (p.startsWith('/admin/orders')) return ['Admin', 'Orders'];
    if (p.startsWith('/admin/messages')) return ['Admin', 'Messages'];
    if (p.startsWith('/admin/products')) return ['Admin', 'Products & Stock'];
    if (p.startsWith('/admin/categories')) return ['Admin', 'Categories'];
    if (p.startsWith('/admin/users/')) return ['Admin', 'Customers', 'Details'];
    if (p.startsWith('/admin/users')) return ['Admin', 'Customers & Admins'];
    if (p.startsWith('/admin/profile')) return ['Admin', 'My Profile'];
    if (p.startsWith('/admin/home-sections')) return ['Admin', 'Home Sections'];
    return ['Admin'];
};

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const path = usePathname();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [unread, setUnread] = useState(0); // Unread contact messages, shown as a badge on "Messages".
    const isAdmin = !!user && user.role === 'admin';

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.replace('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        setMobileOpen(false);
    }, [path]);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [mobileOpen]);

    // Keeps the unread badge up to date: every 30 seconds, and whenever something changes.
    const loadUnread = useCallback(
        () => api('/admin/messages/summary').then((d) => setUnread(d.unread || 0)).catch(() => { }),
        []
    );
    useEffect(() => {
        if (!isAdmin) return;
        loadUnread();
        const t = setInterval(loadUnread, 30000);
        window.addEventListener('bt:admin-activity', loadUnread);
        window.addEventListener('bt:messages-changed', loadUnread);
        return () => {
            clearInterval(t);
            window.removeEventListener('bt:admin-activity', loadUnread);
            window.removeEventListener('bt:messages-changed', loadUnread);
        };
    }, [isAdmin, loadUnread]);

    if (loading || !isAdmin) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#0b2a5b]" />
                    <p className="text-sm font-semibold">Loading admin workspace...</p>
                </div>
            </div>
        );
    }

    const isActive = (href) =>
        href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`);

    const initials = (user.name || 'Admin')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const renderSidebarContent = (isMobile = false) => {
        const isCompact = !isMobile && collapsed;

        return (
            <div className="flex h-full select-none flex-col justify-between bg-[#ffffff] text-slate-700">
                <div className="flex-1 overflow-y-auto">
                    {/* Brand Header */}
                    <div
                        className={`flex h-16 items-center border-b border-slate-200/80 ${isCompact ? 'justify-center px-2' : 'justify-between px-3.5'
                            }`}
                    >
                        <Link
                            href="/admin"
                            className="flex items-center gap-2.5 overflow-hidden rounded-xl py-1 transition-opacity hover:opacity-90"
                        >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0b2a5b]/8 text-[#0b2a5b] ring-1 ring-[#0b2a5b]/15">
                                <Snowflake size={17} />
                            </div>
                            {!isCompact && (
                                <div className="min-w-0 leading-tight">
                                    <span className="block truncate text-sm font-extrabold tracking-wide text-[#0b2a5b]">
                                        BALOTHIA
                                    </span>
                                    <span className="block text-[9px] font-bold tracking-[0.18em] text-orange-600">
                                        ADMIN PANEL
                                    </span>
                                </div>
                            )}
                        </Link>

                        {isMobile && (
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close navigation menu"
                                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Groups */}
                    <nav aria-label="Admin navigation" className="space-y-4 p-2.5">
                        {NAV_GROUPS.map((group) => (
                            <div key={group.title}>
                                {!isCompact && (
                                    <p className="mb-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {group.title}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {group.items.map(({ href, label, icon: Icon }) => {
                                        const active = isActive(href);
                                        const badge = href === '/admin/messages' ? unread : 0;
                                        return (
                                            <Link
                                                key={href}
                                                href={href}
                                                title={isCompact ? label : undefined}
                                                className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-all duration-150 ${isCompact ? 'justify-center px-2' : ''
                                                    } ${active
                                                        ? 'bg-[#0b2a5b] text-[#ffffff] shadow-xs'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                            >
                                                <Icon
                                                    size={17}
                                                    strokeWidth={active ? 2.3 : 1.9}
                                                    className={`shrink-0 transition-transform duration-150 group-hover:scale-105 ${active
                                                        ? 'text-[#ffffff]'
                                                        : 'text-slate-500 group-hover:text-[#0b2a5b]'
                                                        }`}
                                                />

                                                {!isCompact && <span className="truncate">{label}</span>}

                                                {/* Unread badge */}
                                                {badge > 0 &&
                                                    (isCompact ? (
                                                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[#ffffff]" />
                                                    ) : (
                                                        <span
                                                            className={`ml-auto grid h-5 min-w-[20px] place-items-center rounded-full px-1.5 text-[10px] font-bold ${active
                                                                ? 'bg-orange-500 text-[#ffffff]'
                                                                : 'bg-orange-500 text-[#ffffff]'
                                                                }`}
                                                        >
                                                            {badge > 99 ? '99+' : badge}
                                                        </span>
                                                    ))}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Bottom: Store Link + Profile */}
                <div className="space-y-2 border-t border-slate-200/80 bg-slate-50/70 p-2.5">
                    <Link
                        href="/"
                        title={isCompact ? 'View Live Store' : undefined}
                        className={`flex items-center gap-2.5 rounded-lg border border-slate-200 bg-[#ffffff] px-2.5 py-2 text-xs font-bold text-slate-700 transition-all duration-150 hover:border-slate-300 hover:bg-slate-100/70 hover:text-[#0b2a5b] ${isCompact ? 'justify-center px-2' : 'justify-between'
                            }`}
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Store size={15} className="shrink-0 text-orange-600" />
                            {!isCompact && <span>View Live Store</span>}
                        </span>
                        {!isCompact && <ExternalLink size={12} className="shrink-0 text-slate-400" />}
                    </Link>

                    <Link
                        href="/admin/profile"
                        title={isCompact ? `${user.name} (Admin)` : undefined}
                        className={`flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-100 ${isCompact ? 'justify-center' : ''
                            }`}
                    >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0b2a5b] text-xs font-extrabold text-[#ffffff]">
                            {initials}
                        </div>
                        {!isCompact && (
                            <div className="min-w-0 flex-1 leading-tight">
                                <p className="truncate text-xs font-bold text-slate-800">{user.name}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                    <ShieldCheck size={11} />
                                    <span>Administrator</span>
                                </p>
                            </div>
                        )}
                    </Link>
                </div>
            </div>
        );
    };

    // Sleek/patla width: 68px when collapsed, 232px when expanded on desktop
    const sidebarWidth = collapsed ? '68px' : '232px';

    return (
        <div
            style={{ '--admin-sidebar-w': sidebarWidth }}
            className="admin-shell min-h-screen bg-slate-100/90"
        >
            {/* Makes the top bar fill the remaining width whether the sidebar is expanded or collapsed */}
            <style>{`
                @media (min-width: 1024px) {
                    .admin-shell header,
                    .admin-shell [class*="lg:left-60"] {
                        left: var(--admin-sidebar-w) !important;
                        right: 0 !important;
                        width: auto !important;
                        transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                }
            `}</style>

            {/* Desktop Fixed Sidebar */}
            <aside
                style={{ width: sidebarWidth }}
                className="fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/90 bg-[#ffffff] text-slate-700 shadow-sm transition-[width] duration-300 ease-out lg:block"
            >
                {renderSidebarContent(false)}

                <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="absolute -right-3 top-20 z-50 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-[#ffffff] text-slate-600 shadow-sm transition-all duration-150 hover:scale-105 hover:border-[#0b2a5b] hover:text-[#0b2a5b] active:scale-95"
                >
                    {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                </button>
            </aside>

            {/* Mobile & Tablet Slide-Over Drawer */}
            <div
                aria-hidden={!mobileOpen}
                className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
                    }`}
            >
                <div
                    onClick={() => setMobileOpen(false)}
                    className={`absolute inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                />

                <aside
                    className={`absolute inset-y-0 left-0 w-64 max-w-[80vw] border-r border-slate-200 bg-[#ffffff] text-slate-700 shadow-xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {renderSidebarContent(true)}
                </aside>
            </div>

            {/* Main Content Area */}
            <div className="min-h-screen transition-[padding-left] duration-300 ease-out lg:pl-[var(--admin-sidebar-w)]">
                <AdminTopbar
                    trail={trailFor(path)}
                    onMenu={() => setMobileOpen(true)}
                    collapsed={collapsed}
                />
                <div className="h-16" />
                <main className="mx-auto max-w-[1440px] p-3.5 sm:p-6">{children}</main>
            </div>
        </div>
    );
}