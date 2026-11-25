const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    let hadToken = false;
    if (auth && typeof window !== 'undefined') {
        const t = localStorage.getItem('bt_token');
        if (t) {
            headers.Authorization = `Bearer ${t}`;
            hadToken = true;
        }
    }

    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        });
    } catch {
        throw Object.assign(new Error('Could not connect to the server. Check your internet or the backend.'), { status: 0 });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 && hadToken && typeof window !== 'undefined') {
            localStorage.removeItem('bt_token');
            window.dispatchEvent(new Event('bt:unauthorized'));
        }
        throw Object.assign(new Error(data.message || 'something went wrong'), { status: res.status });
    }
    return data;
}

export async function uploadImages(files) {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    const headers = {};
    const t = typeof window !== 'undefined' ? localStorage.getItem('bt_token') : null;
    if (t) headers.Authorization = `Bearer ${t}`;

    let res;
    try {
        res = await fetch(`${BASE}/admin/upload`, { method: 'POST', headers, body: fd });
    } catch {
        throw new Error('Upload failed: Could not connect to the server');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Upload fail ho gaya');
    return data; // { urls: [...] }
}

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');