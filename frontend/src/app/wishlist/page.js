'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';

export default function Wishlist() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState(null);

    useEffect(() => {
        if (loading) return;
        if (!user) return router.replace('/login?next=/wishlist');
        api('/auth/wishlist').then(setItems).catch(() => setItems([]));
    }, [user, loading, router]);

    if (!items) return <div className="wrap py-20 text-center">Loading…</div>;
    // heart toggle karne ke baad list me se hata do
    const visible = items.filter((p) => user?.wishlist?.includes(p._id));

    return (
        <div className="wrap py-6">
            <h1 className="mb-4 text-2xl font-extrabold text-[#0b2a5b]">My Wishlist</h1>
            {visible.length === 0 ? <p className="py-10 text-center text-slate-500">Wishlist Empty ❤️</p> : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">{visible.map((p) => <ProductCard key={p._id} p={p} />)}</div>
            )}
        </div>
    );
}