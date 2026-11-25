'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductRow({ items }) {
    const ref = useRef(null);
    const go = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
    const arrow = 'absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border bg-white shadow md:grid';

    return (
        <div className="relative">
            <button onClick={() => go(-1)} className={`${arrow} -left-3`} aria-label="Previous"><ChevronLeft size={18} /></button>
            <div ref={ref} className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth pb-2">
                {items.map((p) => (
                    <div key={p._id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23%] lg:w-[15.6%]"><ProductCard p={p} /></div>
                ))}
            </div>
            <button onClick={() => go(1)} className={`${arrow} -right-3`} aria-label="Next"><ChevronRight size={18} /></button>
        </div>
    );
}