'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
    const { user, loading } = useAuth();
    const uid = user?._id || null;

    const [items, setItems] = useState([]);
    const [loadedFor, setLoadedFor] = useState(null); // kis user ka cart abhi load hai

    // user badalte hi us user ka apna cart load karo
    useEffect(() => {
        if (loading) return;
        localStorage.removeItem('bt_cart'); // purani shared key hata do (yahi leak kar rahi thi)

        if (!uid) {
            setItems([]);
            setLoadedFor(null);
            return;
        }
        try {
            setItems(JSON.parse(localStorage.getItem(`bt_cart_${uid}`) || '[]'));
        } catch {
            setItems([]);
        }
        setLoadedFor(uid);
    }, [uid, loading]);

    // save sirf tab jab cart usi user ka ho (A ka cart B ki key me kabhi nahi jayega)
    useEffect(() => {
        if (uid && loadedFor === uid) {
            localStorage.setItem(`bt_cart_${uid}`, JSON.stringify(items));
        }
    }, [items, uid, loadedFor]);

    // user switch ke beech ek frame ke liye bhi purana cart na dikhe
    const cartItems = loadedFor === uid ? items : [];

    const add = (p, qty = 1, silent = false) => {
        if (!uid) return toast.error('log in first');
        if (p.stock < 1) return toast.error('Out of stock');
        setItems((prev) => {
            const f = prev.find((i) => i.product === p._id);
            if (f) {
                return prev.map((i) =>
                    i.product === p._id ? { ...i, qty: Math.min(i.qty + qty, p.stock), stock: p.stock } : i
                );
            }
            return [
                ...prev,
                { product: p._id, name: p.name, image: p.images?.[0], price: p.price, mrp: p.mrp, stock: p.stock, qty: Math.min(qty, p.stock) },
            ];
        });
        if (!silent) toast.success('Added to Cart');
    };

    const setQty = (id, qty) =>
        setItems((prev) => prev.map((i) => (i.product === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i)));
    const remove = (id) => setItems((prev) => prev.filter((i) => i.product !== id));
    const clear = () => setItems([]);

    const qtyOf = (id) => cartItems.find((i) => i.product === id)?.qty || 0;

    const count = cartItems.reduce((s, i) => s + i.qty, 0);
    const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
    const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 49;

    return (
        <Ctx.Provider
            value={{ items: cartItems, add, setQty, remove, clear, qtyOf, count, subtotal, shipping, total: subtotal + shipping }}
        >
            {children}
        </Ctx.Provider>
    );
}