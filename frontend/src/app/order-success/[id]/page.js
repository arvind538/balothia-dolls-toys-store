'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { api, inr } from '@/lib/api';
// import { cld } from '@/lib/img';

export default function OrderSuccess() {
    const { id } = useParams();
    const [o, setO] = useState(null);
    useEffect(() => { api(`/orders/${id}`).then(setO).catch(() => { }); }, [id]);

    return (
        <div className="wrap max-w-2xl py-10 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
            <h1 className="mt-3 text-2xl font-extrabold">Order Placed Successfully! 🎉</h1>
            {o && (
                <div className="card mt-6 space-y-2 p-5 text-left text-sm">
                    <p><b>Order ID:</b> #{o._id.slice(-6).toUpperCase()}</p>
                    <p><b>Payment:</b> {o.paymentMethod === 'cod' ? 'Cash on Delivery' : o.isPaid ? 'Paid Online ✅' : 'Pending'}</p>
                    <p><b>Deliver to:</b> {o.shippingAddress.name}, {o.shippingAddress.address}, {o.shippingAddress.city} - {o.shippingAddress.pincode}</p>
                    <div className="border-t pt-2">{o.items.map((i) => <p key={i.product} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></p>)}</div>
                    <p className="flex justify-between border-t pt-2 text-base font-extrabold"><span>Total</span><span>{inr(o.totalPrice)}</span></p>
                </div>
            )}
            <div className="mt-6 flex justify-center gap-3"><Link href="/orders" className="btn-outline">My Orders</Link><Link href="/products" className="btn">Continue Shopping</Link></div>
        </div>
    );
}