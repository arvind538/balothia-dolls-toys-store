'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductRow from '@/components/ProductRow';

function SectionSkeleton() {
    return (
        <section className="wrap py-8" aria-hidden="true">
            <div className="mx-auto mb-5 h-6 w-64 animate-pulse rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-100" />
                ))}
            </div>
        </section>
    );
}

export default function HomeSections() {
    const [sections, setSections] = useState(null);

    useEffect(() => {
        let alive = true;
        api('/home/sections', { auth: false })
            .then((data) => alive && setSections(data))
            .catch(() => alive && setSections([]));
        return () => { alive = false; };
    }, []);

    if (!sections) {
        return (
            <>
                <SectionSkeleton />
                <SectionSkeleton />
            </>
        );
    }

    return sections.map((s) => (
        <section key={s._id} className="wrap py-8">
            <h2 className="section-title">{s.title}</h2>

            {/* More than 4 products: slider. Four or fewer: a clean grid. */}
            {s.products.length > 4 ? (
                <ProductRow items={s.products} />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                    {s.products.map((p) => (
                        <ProductCard key={p._id} p={p} />
                    ))}
                </div>
            )}

            <div className="mt-5 text-center">
                <Link href={s.href} className="btn-outline bg-blue-00">
                    View All <ArrowRight size={16} />
                </Link>
            </div>
        </section>
    ));
}