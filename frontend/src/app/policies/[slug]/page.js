import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ChevronLeft, Mail, Phone } from 'lucide-react';
import { POLICIES } from '@/lib/policies';
import { SITE } from '@/lib/siteInfo';
import PolicyNav from '@/components/PolicyNav';
import RichBlocks from '@/components/RichBlocks';

export function generateStaticParams() {
    return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const policy = POLICIES.find((p) => p.slug === slug);
    return policy ? { title: `${policy.title} | ${SITE.name}`, description: policy.summary } : {};
}

const idOf = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default async function PolicyPage({ params }) {
    const { slug } = await params;
    const index = POLICIES.findIndex((p) => p.slug === slug);
    if (index < 0) notFound();

    const policy = POLICIES[index];
    const prev = POLICIES[index - 1];
    const next = POLICIES[index + 1];

    return (
        <div className="wrap py-5 sm:py-8">
            <nav aria-label="Breadcrumb" className="no-scrollbar mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs text-slate-500 sm:text-sm">
                <Link href="/" className="transition hover:text-blue-700 hover:underline">Home</Link>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
                <Link href="/policies" className="transition hover:text-blue-700 hover:underline">Policies</Link>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
                <span aria-current="page" className="font-medium text-slate-800">{policy.title}</span>
            </nav>

            <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:gap-8">
                <PolicyNav />

                <article className="card min-w-0 p-5 sm:p-8">
                    <header className="border-b pb-5">
                        <h1 className="text-2xl font-extrabold text-[#0b2a5b] sm:text-3xl">{policy.title}</h1>
                        <p className="mt-1 text-xs font-medium text-slate-500">Last updated: {SITE.policiesUpdated}</p>
                        <p className="mt-4 text-[15px] leading-7 text-slate-700">{policy.intro}</p>
                    </header>

                    {policy.sections.map((s, i) => (
                        <section key={s.title} id={idOf(s.title)} className="scroll-mt-40 pt-7">
                            <h2 className="flex items-start gap-3 text-lg font-extrabold text-[#0b2a5b]">
                                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-sm text-blue-700">{i + 1}</span>
                                {s.title}
                            </h2>
                            <div className="sm:pl-10">
                                <RichBlocks blocks={s.blocks} />
                            </div>
                        </section>
                    ))}

                    <div className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-5">
                        <p className="font-bold text-slate-900">Need help?</p>
                        <p className="mt-1 text-sm text-slate-600">Our team is happy to help. We usually reply {SITE.responseTime}.</p>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-blue-700">
                            <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:underline"><Mail size={16} /> {SITE.email}</a>
                            <a href={SITE.phoneHref} className="inline-flex items-center gap-2 hover:underline"><Phone size={16} /> {SITE.phone}</a>
                            <Link href="/contact" className="hover:underline">Send us a message →</Link>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2">
                        {prev ? (
                            <Link href={`/policies/${prev.slug}`} className="group flex items-center gap-3 rounded-xl border p-4 transition hover:border-blue-300 hover:bg-blue-50">
                                <ChevronLeft size={18} className="shrink-0 text-slate-400 transition group-hover:-translate-x-1 group-hover:text-blue-700" />
                                <span><span className="block text-xs text-slate-500">Previous</span><span className="font-semibold text-slate-900">{prev.title}</span></span>
                            </Link>
                        ) : <span />}
                        {next && (
                            <Link href={`/policies/${next.slug}`} className="group flex items-center justify-end gap-3 rounded-xl border p-4 text-right transition hover:border-blue-300 hover:bg-blue-50">
                                <span><span className="block text-xs text-slate-500">Next</span><span className="font-semibold text-slate-900">{next.title}</span></span>
                                <ChevronRight size={18} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                            </Link>
                        )}
                    </div>
                </article>
            </div>
        </div>
    );
}