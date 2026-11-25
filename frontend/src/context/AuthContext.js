'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem('bt_token');
        if (!t) { setLoading(false); return; }
        api('/auth/me')
            .then((d) => setUser(d.user))
            .catch((e) => { if (e.status === 401) localStorage.removeItem('bt_token'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const out = () => setUser(null);
        window.addEventListener('bt:unauthorized', out);
        return () => window.removeEventListener('bt:unauthorized', out);
    }, []);

    const save = (d) => {
        localStorage.setItem('bt_token', d.token);
        setUser(d.user);
        return d.user;
    };
    const login = async (email, password) => save(await api('/auth/login', { method: 'POST', body: { email, password }, auth: false }));
    const register = async (form) => save(await api('/auth/register', { method: 'POST', body: form, auth: false }));
    const logout = () => {
        localStorage.removeItem('bt_token');
        setUser(null);
    };
    const updateUser = (patch) => setUser((u) => ({ ...u, ...patch }));

    const isWished = (id) => !!user?.wishlist?.some((x) => (x._id || x) === id);

    const toggleWish = async (id) => {
        if (!user) return;
        const prev = user.wishlist || [];
        const has = prev.some((x) => (x._id || x) === id);
        const next = has ? prev.filter((x) => (x._id || x) !== id) : [...prev, id];

        setUser((u) => ({ ...u, wishlist: next }));
        toast.success(has ? 'Remove from Wishlist' : 'Added to Wishlist');
        try {
            const d = await api(`/auth/wishlist/${id}`, { method: 'POST' });
            setUser((u) => ({ ...u, wishlist: d.wishlist }));
        } catch (e) {
            setUser((u) => ({ ...u, wishlist: prev }));
            toast.error(e.message);
        }
    };

    return (
        <Ctx.Provider value={{ user, loading, login, register, logout, updateUser, isWished, toggleWish }}>
            {children}
        </Ctx.Provider>
    );
}