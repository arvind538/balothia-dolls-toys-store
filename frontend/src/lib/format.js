export const ago = (d) => {
    if (!d) return '—';
    const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    return dateOnly(d);
};
export const dateOnly = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const shortId = (id) => `#${String(id).slice(-6).toUpperCase()}`;
export const short = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1).replace('.0', '')}L` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n));

export const STATUS_FLOW = ['Placed', 'Processing', 'Shipped', 'Delivered'];
export const ALL_STATUSES = ['Pending Payment', ...STATUS_FLOW, 'Cancelled'];
export const STATUS_LABEL = {
    'Pending Payment': 'Payment pending', Placed: 'New (Placed)', Processing: 'Processing',
    Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled',
};
export const STATUS_PILL = {
    'Pending Payment': 'bg-slate-100 text-slate-600',
    Placed: 'bg-blue-50 text-blue-700 border border-blue-200',
    Processing: 'bg-amber-50 text-amber-700 border border-amber-200',
    Shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
    Delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Cancelled: 'bg-red-50 text-red-700 border border-red-200',
};
export const STATUS_BAR = {
    'Pending Payment': 'bg-slate-400', Placed: 'bg-indigo-600', Processing: 'bg-amber-500',
    Shipped: 'bg-blue-500', Delivered: 'bg-emerald-500', Cancelled: 'bg-rose-500',
};