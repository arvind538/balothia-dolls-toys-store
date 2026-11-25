import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { POLICIES } from '@/lib/policies';
import { SITE } from '@/lib/siteInfo';

export const metadata = {
    title: `Policies | ${SITE.name}`,
    description: 'Our cancellation, return, privacy, shipping and terms policies.',
};

export default function PoliciesIndex() {
    return (
        <div className="wrap py-8 sm:py-12">
            <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-3xl font-extrabold text-[#0b2a5b]">Our Policies</h1>
                <p className="mt-2 text-slate-600">Clear, simple information about shopping with {SITE.name}.</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {POLICIES.map((p) => (
                    <Link key={p.slug} href={`/policies/${p.slug}`} className="card group p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                        <h2 className="text-lg font-bold text-slate-900 transition group-hover:text-blue-700">{p.title}</h2>
                        <p className="mt-1 text-sm text-slate-600">{p.summary}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                            Read more <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}