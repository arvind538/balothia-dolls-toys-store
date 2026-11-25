'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    IndianRupee,
    ShoppingBag,
    Clock,
    Users,
    ChevronRight,
    ChevronLeft,
    RefreshCw,
    AlertTriangle,
    ExternalLink,
    TrendingUp,
    CheckCircle2,
    Calendar as CalendarIcon,
    Table as TableIcon,
    X,
    Package,
    RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import {
    ago,
    dateTime,
    shortId,
    short,
    STATUS_PILL,
    STATUS_LABEL,
    STATUS_BAR,
    ALL_STATUSES,
} from '@/lib/format';
import CategoryIcon from '@/components/CategoryIcon';
import MessagesCard from '@/components/MessagesCard';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const toMonthKey = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

const fmtLabel = (l, unit) => {
    if (!l) return '';
    if (unit === 'month') {
        const dt = /^\d{4}-\d{2}$/.test(l) ? new Date(`${l}-01T00:00:00`) : new Date(l);
        return Number.isNaN(dt.getTime())
            ? l
            : dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(l) ? new Date(`${l}T00:00:00`) : new Date(l);
    return Number.isNaN(dt.getTime())
        ? l
        : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const Card = ({ className = '', children }) => (
    <section
        className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-sm sm:p-5 ${className}`}
    >
        {children}
    </section>
);

const Kpi = ({ href, title, value, sub, icon: Icon, bg, color }) => (
    <Link
        href={href}
        className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-5"
    >
        <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{title}</p>
            <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-900">
                {value}
            </p>
            <p className="mt-1.5 truncate text-xs font-medium text-slate-400">{sub}</p>
        </div>
        <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${bg} ${color}`}
        >
            <Icon size={20} />
        </div>
    </Link>
);

const RowLink = ({ href, children }) => (
    <Link
        href={href}
        className="group -mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-slate-50"
    >
        {children}
        <ChevronRight
            size={16}
            className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-600"
        />
    </Link>
);

function DaySaleModal({ dayData, onClose, onInspect }) {
    useEffect(() => {
        if (!dayData) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [dayData, onClose]);

    if (!dayData) return null;

    const { dateKey, dateObj, revenue = 0, orders = 0, items = 0, restocked = 0 } = dayData;
    const avgOrder = orders > 0 ? Math.round(revenue / orders) : 0;
    const prettyDate = dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-sale-modal-title"
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-xs transition-opacity duration-200 sm:items-center sm:p-5"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md transform-gpu overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200"
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 px-5 py-4">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                            <CalendarIcon size={12} />
                            <span>Daily Sales Snapshot</span>
                        </span>
                        <h3
                            id="day-sale-modal-title"
                            className="mt-1.5 text-base font-extrabold text-slate-900 sm:text-lg"
                        >
                            {prettyDate}
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close popup"
                        className="rounded-xl border border-slate-200/80 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-4 p-5">
                    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            Total Revenue
                        </p>
                        <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            {inr(revenue)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-emerald-800/80">
                            {orders > 0
                                ? `Average order value: ${inr(avgOrder)}`
                                : 'No sales recorded on this date'}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center">
                            <ShoppingBag size={16} className="mx-auto text-blue-600" />
                            <p className="mt-1.5 text-lg font-extrabold text-slate-900">{orders}</p>
                            <p className="text-[11px] font-semibold text-slate-500">Orders</p>
                        </div>

                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center">
                            <Package size={16} className="mx-auto text-orange-600" />
                            <p className="mt-1.5 text-lg font-extrabold text-slate-900">{items}</p>
                            <p className="text-[11px] font-semibold text-slate-500">Items Sold</p>
                        </div>

                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center">
                            <RotateCcw size={16} className="mx-auto text-indigo-600" />
                            <p className="mt-1.5 text-lg font-extrabold text-slate-900">
                                {restocked}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500">Restocked</p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => onInspect(dateKey, orders)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0b2a5b] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-900 active:scale-98 sm:text-sm"
                        >
                            <span>View Orders for {dateKey}</span>
                            <ExternalLink size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [sales, setSales] = useState(null);
    const [unit, setUnit] = useState('week'); // 'week' | 'day' | 'month'
    const [selectedBar, setSelectedBar] = useState(null);
    const [breakdownMode, setBreakdownMode] = useState('calendar'); // 'calendar' | 'table'
    const [calMonth, setCalMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [activeDayModal, setActiveDayModal] = useState(null);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [updated, setUpdated] = useState(null);

    const apiUnit = unit === 'month' ? 'day' : 'day';

    const loadStats = useCallback(async (quiet = false) => {
        if (!quiet) setRefreshing(true);
        try {
            setStats(await api('/admin/stats'));
            setUpdated(new Date());
            setError('');
        } catch (e) {
            if (!quiet) setError(e.message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const loadSales = useCallback(async () => {
        try {
            setSales(await api(`/admin/sales?unit=${apiUnit}`));
        } catch {
            // Keep existing chart data if background refresh fails
        }
    }, [apiUnit]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        loadSales();
    }, [loadSales]);

    useEffect(() => {
        setSelectedBar(null);
    }, [unit]);

    useEffect(() => {
        const refresh = () => {
            loadStats(true);
            loadSales();
        };
        const t = setInterval(refresh, 30000);
        window.addEventListener('bt:admin-activity', refresh);
        return () => {
            clearInterval(t);
            window.removeEventListener('bt:admin-activity', refresh);
        };
    }, [loadStats, loadSales]);

    const restock = async (p) => {
        try {
            await api(`/admin/products/${p._id}/stock`, { method: 'PATCH', body: { add: 10 } });
            toast.success(`Added +10 stock to ${p.name}`);
            loadStats(true);
        } catch (e) {
            toast.error(e.message);
        }
    };

    const rawRows = useMemo(() => sales?.rows || [], [sales]);

    // Map by date key (YYYY-MM-DD) for fast lookup in calendar & popup
    const salesByDate = useMemo(() => {
        const map = {};
        rawRows.forEach((r) => {
            const key = toDateKey(r.label) || r.label;
            if (!key) return;
            map[key] = {
                dateKey: key,
                revenue: (map[key]?.revenue || 0) + (r.revenue || 0),
                orders: (map[key]?.orders || 0) + (r.orders || 0),
                items: (map[key]?.items || 0) + (r.items || 0),
                restocked: (map[key]?.restocked || 0) + (r.restocked || 0),
            };
        });
        return map;
    }, [rawRows]);

    // Monthly aggregated rows (supports both YYYY-MM rows from API and YYYY-MM-DD rows)
    const monthlyRows = useMemo(() => {
        const map = new Map();
        rawRows.forEach((r) => {
            const mKey = /^\d{4}-\d{2}$/.test(r.label) ? r.label : toMonthKey(r.label);
            if (!mKey) return;
            const prev = map.get(mKey) || {
                label: mKey,
                revenue: 0,
                orders: 0,
                items: 0,
                restocked: 0,
            };
            map.set(mKey, {
                label: mKey,
                revenue: prev.revenue + (r.revenue || 0),
                orders: prev.orders + (r.orders || 0),
                items: prev.items + (r.items || 0),
                restocked: prev.restocked + (r.restocked || 0),
            });
        });
        return Array.from(map.values()).slice(-12);
    }, [rawRows]);

    const rows = useMemo(() => {
        if (unit === 'week') return rawRows.slice(-7);
        if (unit === 'month') return monthlyRows;
        return rawRows;
    }, [unit, rawRows, monthlyRows]);

    // Calendar days for active month
    const calendarDays = useMemo(() => {
        const year = calMonth.getFullYear();
        const month = calMonth.getMonth();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayKey = toDateKey(new Date());

        const cells = [];
        for (let i = 0; i < firstDayOfWeek; i += 1) {
            cells.push({ empty: true, key: `empty-${i}` });
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const dt = new Date(year, month, day);
            const dateKey = toDateKey(dt);
            const info = salesByDate[dateKey] || {
                dateKey,
                revenue: 0,
                orders: 0,
                items: 0,
                restocked: 0,
            };
            cells.push({
                empty: false,
                day,
                dateObj: dt,
                dateKey,
                isToday: dateKey === todayKey,
                ...info,
            });
        }
        return cells;
    }, [calMonth, salesByDate]);

    const calMonthSummary = useMemo(() => {
        const prefix = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}`;
        return Object.values(salesByDate)
            .filter((d) => d.dateKey.startsWith(prefix))
            .reduce(
                (acc, d) => ({
                    revenue: acc.revenue + (d.revenue || 0),
                    orders: acc.orders + (d.orders || 0),
                    items: acc.items + (d.items || 0),
                }),
                { revenue: 0, orders: 0, items: 0 }
            );
    }, [calMonth, salesByDate]);

    if (error && !stats) {
        return (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <div className="px-4">
                    <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
                    <p className="mt-3 text-base font-bold text-slate-900">Unable to load dashboard</p>
                    <p className="mt-1 text-sm text-slate-500">{error}</p>
                    <button
                        type="button"
                        onClick={() => loadStats()}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0b2a5b] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-900"
                    >
                        <RefreshCw size={15} />
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="space-y-5">
                <div className="h-12 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
                    ))}
                </div>
                <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
            </div>
        );
    }

    const maxRev = Math.max(1, ...rows.map((r) => r.revenue || 0));
    const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
    const drill = (r) =>
        unit === 'month' ? `/admin/orders?month=${r.label}` : `/admin/orders?date=${r.label}`;
    const avg = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
    const sc = stats.statusCounts || {};
    const statusTotal = Math.max(1, ALL_STATUSES.reduce((s, k) => s + (sc[k] || 0), 0));

    const periodTitle =
        unit === 'week'
            ? 'Weekly Revenue (Last 7 Days)'
            : unit === 'day'
                ? 'Daily Revenue (Last 30 Days)'
                : 'Monthly Revenue';

    const shouldShowXLabel = (idx, total) => {
        if (unit !== 'day') return true;
        if (idx === 0 || idx === total - 1) return true;
        return idx % 5 === 0;
    };

    const focusedRow =
        selectedBar != null ? rows.find((r) => r.label === selectedBar) || null : null;

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                        Dashboard
                    </h1>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {updated
                            ? `Last updated at ${updated.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })} · Auto-refreshes every 30s`
                            : 'Loading live metrics...'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        loadStats();
                        loadSales();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 sm:text-sm"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi
                    href="/admin/orders?status=counted"
                    title="Total Revenue"
                    value={inr(stats.totalRevenue)}
                    sub={`Avg. order ${inr(avg)} · Today ${inr(stats.today?.revenue || 0)}`}
                    icon={IndianRupee}
                    bg="bg-emerald-50"
                    color="text-emerald-600"
                />
                <Kpi
                    href="/admin/orders"
                    title="Total Orders"
                    value={stats.totalOrders}
                    sub={`${stats.today?.orders || 0} today · ${stats.month?.orders || 0} this month`}
                    icon={ShoppingBag}
                    bg="bg-blue-50"
                    color="text-blue-600"
                />
                <Kpi
                    href="/admin/orders?status=pending"
                    title="Pending Orders"
                    value={stats.pending}
                    sub={stats.pending === 0 ? 'All orders up to date' : 'Placed & Processing'}
                    icon={Clock}
                    bg="bg-orange-50"
                    color="text-orange-600"
                />
                <Kpi
                    href="/admin/users?role=user"
                    title="Customers"
                    value={stats.customers}
                    sub={`+${stats.customersToday || 0} today · ${stats.products} products`}
                    icon={Users}
                    bg="bg-indigo-50"
                    color="text-indigo-600"
                />
            </div>

            {/* Smooth Revenue Graph + Order Status Breakdown */}
            <div className="grid gap-5 lg:grid-cols-12">
                <Card className="flex flex-col justify-between lg:col-span-8">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-extrabold text-slate-900">
                                    {periodTitle}
                                </h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                    <TrendingUp size={11} />
                                    <span>{inr(sum('revenue'))}</span>
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {sum('orders')} {sum('orders') === 1 ? 'order' : 'orders'} in this
                                period · Hover or tap a bar to inspect
                            </p>
                        </div>

                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
                            {[
                                ['week', 'Weekly'],
                                ['day', 'Daily (30d)'],
                                ['month', 'Monthly'],
                            ].map(([v, l]) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setUnit(v)}
                                    className={`rounded-lg px-3 py-1.5 transition-all duration-200 ${unit === v
                                        ? 'bg-[#0b2a5b] text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected / Active Readout Pill */}
                    {focusedRow && (
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200/80 bg-orange-50/70 px-3.5 py-2 text-xs transition-all duration-200">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-slate-900">
                                    {fmtLabel(focusedRow.label, unit === 'month' ? 'month' : 'day')}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="font-extrabold text-orange-700">
                                    {inr(focusedRow.revenue)}
                                </span>
                                <span className="text-slate-500">
                                    ({focusedRow.orders}{' '}
                                    {focusedRow.orders === 1 ? 'order' : 'orders'},{' '}
                                    {focusedRow.items || 0} items)
                                </span>
                            </div>
                            {focusedRow.orders > 0 && (
                                <Link
                                    href={drill(focusedRow)}
                                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                                >
                                    <span>Open orders</span>
                                    <ExternalLink size={12} />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Smooth Bar Chart with Y-Axis Scale & Dashed Gridlines */}
                    <div className="relative mt-2 flex gap-2.5">
                        <div className="hidden h-60 flex-col justify-between pb-6 pt-6 text-right text-[10px] font-semibold text-slate-400 sm:flex">
                            <span>{short(maxRev)}</span>
                            <span>{short(Math.round(maxRev / 2))}</span>
                            <span>₹0</span>
                        </div>

                        <div className="relative flex-1 overflow-x-auto pb-1">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 bottom-6 top-6 flex flex-col justify-between"
                            >
                                <div className="border-b border-dashed border-slate-200/80" />
                                <div className="border-b border-dashed border-slate-200/80" />
                                <div className="border-b border-slate-200" />
                            </div>

                            <div
                                className={`relative flex h-60 items-end pt-6 ${unit === 'day'
                                    ? 'min-w-[540px] gap-1.5'
                                    : unit === 'month'
                                        ? 'min-w-[460px] gap-2.5'
                                        : 'min-w-[320px] gap-3 sm:gap-4'
                                    }`}
                            >
                                {rows.map((r, idx) => {
                                    const pct =
                                        r.revenue > 0
                                            ? Math.max((r.revenue / maxRev) * 100, 8)
                                            : 3;
                                    const formattedDate = fmtLabel(
                                        r.label,
                                        unit === 'month' ? 'month' : 'day'
                                    );
                                    const showLabel = shouldShowXLabel(idx, rows.length);
                                    const isSelected = selectedBar === r.label;

                                    return (
                                        <div
                                            key={r.label}
                                            onMouseEnter={() => setSelectedBar(r.label)}
                                            onClick={() => {
                                                setSelectedBar(r.label);
                                                if (r.orders > 0 && unit === 'month') {
                                                    router.push(drill(r));
                                                }
                                            }}
                                            className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end"
                                        >
                                            {/* Hover Tooltip */}
                                            <div className="pointer-events-none absolute -top-1 z-20 hidden -translate-y-full whitespace-nowrap rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg group-hover:block">
                                                <p className="text-slate-300">{formattedDate}</p>
                                                <p className="font-extrabold text-white">
                                                    {inr(r.revenue)} · {r.orders}{' '}
                                                    {r.orders === 1 ? 'order' : 'orders'}
                                                </p>
                                            </div>

                                            {/* Value label above bar on Weekly/Monthly */}
                                            {unit !== 'day' && r.revenue > 0 && (
                                                <span className="mb-1 text-[10px] font-bold text-slate-600 transition-transform duration-200 group-hover:-translate-y-0.5">
                                                    {short(r.revenue)}
                                                </span>
                                            )}

                                            {/* Animated Bar */}
                                            <div
                                                className={`w-full transform-gpu rounded-t-lg transition-all duration-500 ease-out ${unit === 'day'
                                                    ? 'max-w-[16px]'
                                                    : unit === 'month'
                                                        ? 'max-w-[34px]'
                                                        : 'max-w-[48px]'
                                                    } ${r.orders > 0
                                                        ? isSelected
                                                            ? 'bg-gradient-to-t from-orange-600 to-amber-400 ring-2 ring-orange-300/70'
                                                            : 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-2xs group-hover:from-orange-600 group-hover:to-amber-500'
                                                        : isSelected
                                                            ? 'bg-slate-300'
                                                            : 'bg-slate-200/80 group-hover:bg-slate-300'
                                                    }`}
                                                style={{ height: `${pct}%` }}
                                            />

                                            {/* X-axis tick label */}
                                            <span
                                                className={`mt-2 h-4 whitespace-nowrap text-[10px] font-semibold transition-colors sm:text-[11px] ${isSelected
                                                    ? 'font-extrabold text-orange-600'
                                                    : r.orders > 0
                                                        ? 'text-slate-700'
                                                        : 'text-slate-400'
                                                    }`}
                                            >
                                                {showLabel ? formattedDate : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Order Status Card */}
                <Card className="flex flex-col justify-between lg:col-span-4">
                    <div>
                        <h2 className="mb-3 text-base font-extrabold text-slate-900">
                            Order Status
                        </h2>
                        <div className="space-y-1">
                            {ALL_STATUSES.map((s) => {
                                const n = sc[s] || 0;
                                const pct = Math.round((n / statusTotal) * 100);
                                return (
                                    <Link
                                        key={s}
                                        href={`/admin/orders?status=${encodeURIComponent(s)}`}
                                        className="group -mx-2 block rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                                    >
                                        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-600">{STATUS_LABEL[s]}</span>
                                            <span className="flex items-center gap-1 font-bold text-slate-900">
                                                {n}
                                                <ChevronRight
                                                    size={13}
                                                    className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600"
                                                />
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR[s]}`}
                                                style={{
                                                    width: `${n > 0 ? Math.max(pct, 6) : 0}%`,
                                                }}
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="font-medium text-slate-500">This month&apos;s revenue</span>
                        <b className="text-sm font-extrabold text-slate-900">
                            {inr(stats.month?.revenue || 0)}
                        </b>
                    </div>
                </Card>
            </div>

            {/* Recent Orders + New Customers */}
            <div className="grid gap-5 lg:grid-cols-12">
                <Card className="lg:col-span-7">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-slate-900">Recent Orders</h2>
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition hover:text-orange-700"
                        >
                            <span>View all</span>
                            <ExternalLink size={12} />
                        </Link>
                    </div>

                    {stats.recent.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No orders placed yet</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {stats.recent.map((o) => (
                                <RowLink key={o._id} href={`/admin/orders/${o._id}`}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                            {(o.user?.name || 'C')[0].toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {o.user?.name || 'Customer'}{' '}
                                                <span className="font-mono text-xs font-normal text-slate-400">
                                                    · {shortId(o._id)}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {dateTime(o.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-auto flex shrink-0 items-center gap-2.5">
                                        <span
                                            className={`hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-block ${STATUS_PILL[o.status]}`}
                                        >
                                            {o.status}
                                        </span>
                                        <span className="text-sm font-extrabold text-slate-900">
                                            {inr(o.totalPrice)}
                                        </span>
                                    </div>
                                </RowLink>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="lg:col-span-5">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-slate-900">New Customers</h2>
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition hover:text-orange-700"
                        >
                            <span>View all</span>
                            <ExternalLink size={12} />
                        </Link>
                    </div>

                    {stats.recentUsers.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                            No customers registered yet
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {stats.recentUsers.map((u) => (
                                <RowLink key={u._id} href={`/admin/users/${u._id}`}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                                            {u.name[0].toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {u.name}
                                            </p>
                                            <p className="truncate text-xs text-slate-400">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto shrink-0 text-right text-[11px] text-slate-400">
                                        <p>Joined {ago(u.createdAt)}</p>
                                        <p>Last seen {ago(u.lastLoginAt)}</p>
                                    </div>
                                </RowLink>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <MessagesCard />

            {/* Categories & Stock + Low Stock / Top Selling */}
            <div className="grid gap-5 lg:grid-cols-12">
                <Card className="lg:col-span-7">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-slate-900">
                            Categories &amp; Stock
                        </h2>
                        <Link
                            href="/admin/categories"
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            Manage categories
                        </Link>
                    </div>

                    {stats.categoryStats.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                            No categories created yet
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {stats.categoryStats.map((c) => (
                                <RowLink key={c._id} href={`/admin/products?category=${c._id}`}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <CategoryIcon c={c} size={40} />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {c.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {c.products} products · {c.sold} sold
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-auto flex shrink-0 items-center gap-2 text-right">
                                        {c.low > 0 && (
                                            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                                                {c.low} low
                                            </span>
                                        )}
                                        <span className="text-sm font-extrabold text-slate-900">
                                            {c.stock}
                                            <span className="ml-1 text-[11px] font-medium text-slate-400">
                                                in stock
                                            </span>
                                        </span>
                                    </div>
                                </RowLink>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="space-y-5 lg:col-span-5">
                    <Card>
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="flex items-center gap-1.5 text-base font-extrabold text-rose-600">
                                <AlertTriangle size={18} />
                                <span>Low Stock (≤ 5)</span>
                            </h2>
                            <Link
                                href="/admin/products?stock=low"
                                className="text-xs font-bold text-blue-600 hover:underline"
                            >
                                {stats.lowStockCount > 0
                                    ? `View all (${stats.lowStockCount})`
                                    : 'Manage'}
                            </Link>
                        </div>

                        {stats.lowStock.length === 0 ? (
                            <p className="flex items-center justify-center gap-1.5 py-6 text-center text-sm font-semibold text-emerald-600">
                                <CheckCircle2 size={16} />
                                <span>All products are well stocked</span>
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stats.lowStock.map((p) => (
                                    <div
                                        key={p._id}
                                        className="flex items-center justify-between gap-2 py-2.5 text-sm"
                                    >
                                        <Link
                                            href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                                            className="line-clamp-1 flex-1 font-medium text-slate-700 hover:text-blue-700 hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                        <span
                                            className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-extrabold ${p.stock === 0
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}
                                        >
                                            {p.stock === 0 ? 'Out' : `${p.stock} left`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => restock(p)}
                                            title="Add 10 units to stock"
                                            className="shrink-0 rounded-md border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700 transition hover:bg-blue-700 hover:text-white active:scale-95"
                                        >
                                            +10
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h2 className="mb-2 text-base font-extrabold text-slate-900">
                            Top Selling Products
                        </h2>
                        {stats.top.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-400">
                                No sales data recorded yet
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stats.top.map((p, i) => (
                                    <RowLink
                                        key={p._id}
                                        href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="w-4 text-xs font-bold text-slate-400">
                                                {i + 1}
                                            </span>
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50">
                                                {p.images?.[0] ? (
                                                    <img
                                                        src={cld(p.images[0], 100)}
                                                        alt={p.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="grid h-full place-items-center text-[10px] text-slate-400">
                                                        Img
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {p.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {p.sold || 0} sold
                                                </p>
                                            </div>
                                        </div>
                                        <span className="ml-auto shrink-0 text-sm font-extrabold text-slate-900">
                                            {inr((p.price || 0) * (p.sold || 0))}
                                        </span>
                                    </RowLink>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Sales Breakdown: Interactive Calendar + Smooth Day Popup + Table */}
            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-extrabold text-slate-900">
                            Sales Breakdown &amp; Calendar
                        </h2>
                        <p className="text-xs text-slate-400">
                            {breakdownMode === 'calendar'
                                ? 'Click any date number on the calendar to open a smooth daily sales popup'
                                : 'Click any row with orders to view order details'}
                        </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setBreakdownMode('calendar')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${breakdownMode === 'calendar'
                                ? 'bg-[#0b2a5b] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <CalendarIcon size={13} />
                            <span>Calendar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBreakdownMode('table')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${breakdownMode === 'table'
                                ? 'bg-[#0b2a5b] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <TableIcon size={13} />
                            <span>Table</span>
                        </button>
                    </div>
                </div>

                {breakdownMode === 'calendar' ? (
                    <div className="space-y-4">
                        {/* Calendar Month Navigation & Monthly Summary */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCalMonth(
                                            (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                                        )
                                    }
                                    aria-label="Previous month"
                                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 active:scale-95"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <span className="min-w-36 text-center text-sm font-extrabold text-slate-900">
                                    {calMonth.toLocaleDateString('en-IN', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCalMonth(
                                            (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                                        )
                                    }
                                    aria-label="Next month"
                                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 active:scale-95"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                <span className="font-semibold text-slate-500">
                                    Month Orders:{' '}
                                    <strong className="text-slate-900">
                                        {calMonthSummary.orders}
                                    </strong>
                                </span>
                                <span className="font-semibold text-slate-500">
                                    Month Sales:{' '}
                                    <strong className="text-emerald-700">
                                        {inr(calMonthSummary.revenue)}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {/* Weekday Headers + Date Grid */}
                        <div className="overflow-x-auto pb-1">
                            <div className="min-w-[540px]">
                                <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                    {WEEKDAYS.map((w) => (
                                        <div key={w} className="py-1">
                                            {w}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                    {calendarDays.map((cell) => {
                                        if (cell.empty) {
                                            return (
                                                <div
                                                    key={cell.key}
                                                    className="h-18 rounded-xl bg-slate-50/40 sm:h-21"
                                                />
                                            );
                                        }

                                        const hasSales = cell.orders > 0 || cell.revenue > 0;

                                        return (
                                            <button
                                                key={cell.dateKey}
                                                type="button"
                                                onClick={() => setActiveDayModal(cell)}
                                                className={`group flex h-18 flex-col justify-between rounded-xl border p-2 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-98 sm:h-21 sm:p-2.5 ${hasSales
                                                    ? 'border-emerald-200/90 bg-emerald-50/45 hover:border-emerald-400 hover:bg-emerald-50/80'
                                                    : 'border-slate-200/70 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span
                                                        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold ${cell.isToday
                                                            ? 'bg-[#0b2a5b] text-white'
                                                            : hasSales
                                                                ? 'text-slate-900'
                                                                : 'text-slate-600'
                                                            }`}
                                                    >
                                                        {cell.day}
                                                    </span>

                                                    {cell.orders > 0 && (
                                                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-700">
                                                            {cell.orders}{' '}
                                                            {cell.orders === 1 ? 'ord' : 'ords'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="truncate">
                                                    {cell.revenue > 0 ? (
                                                        <span className="text-xs font-extrabold text-emerald-700 sm:text-[13px]">
                                                            {inr(cell.revenue)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-medium text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-80 overflow-auto rounded-xl border border-slate-200/80">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="p-3">
                                        {unit === 'month' ? 'Month' : 'Date'}
                                    </th>
                                    <th className="p-3">Orders</th>
                                    <th className="p-3">Items Sold</th>
                                    <th className="p-3">Restocked</th>
                                    <th className="p-3 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {[...rows].reverse().map((r) => (
                                    <tr
                                        key={r.label}
                                        onClick={() => r.orders > 0 && router.push(drill(r))}
                                        className={`transition-colors ${r.orders > 0
                                            ? 'cursor-pointer hover:bg-blue-50/50'
                                            : 'text-slate-400'
                                            }`}
                                    >
                                        <td className="p-3 font-semibold">
                                            {fmtLabel(r.label, unit === 'month' ? 'month' : 'day')}
                                        </td>
                                        <td className="p-3">{r.orders}</td>
                                        <td className="p-3">{r.items}</td>
                                        <td className="p-3">{r.restocked || 0}</td>
                                        <td className="p-3 text-right font-extrabold text-slate-900">
                                            {inr(r.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="sticky bottom-0 border-t-2 border-slate-200 bg-slate-50 font-extrabold text-slate-900">
                                <tr>
                                    <td className="p-3">Total</td>
                                    <td className="p-3">{sum('orders')}</td>
                                    <td className="p-3">{sum('items')}</td>
                                    <td className="p-3">{sum('restocked')}</td>
                                    <td className="p-3 text-right">{inr(sum('revenue'))}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Card>

            {/* Smooth Popup Modal when clicking a date number on the Calendar */}
            <DaySaleModal
                dayData={activeDayModal}
                onClose={() => setActiveDayModal(null)}
                onInspect={(dateKey) => {
                    setActiveDayModal(null);
                    router.push(`/admin/orders?date=${dateKey}`);
                }}
            />
        </div>
    );
}