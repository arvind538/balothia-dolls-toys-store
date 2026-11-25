import Link from 'next/link';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { POSTS } from '@/lib/blogs';
import BlogImage from '@/components/BlogImage';

export default function BlogIndex() {
    return (
        <section className="wrap py-8 sm:py-10 lg:py-10">
            {/* Editorial Header */}
            <header className="mx-auto max-w-2xl text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-2xs">
                    <Sparkles size={13} className="shrink-0 text-blue-600" />
                    <span>Play &amp; Parenting Guide</span>
                </div>

                <h1 className="mt-3.5 text-3xl font-extrabold tracking-tight text-[#0b2a5b] sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
                    Our Blog
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-7">
                    Thoughtful toy buying guides, parenting insights, and safety tips for curious and growing children.
                </p>
            </header>

            {/* Responsive Cards Grid */}
            <div className="mt-9 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                {POSTS.map((p, idx) => (
                    <Link
                        key={p.slug}
                        href={`/blogs/${p.slug}`}
                        className="card group transform-gpu flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-blue-300/90 hover:shadow-xl hover:shadow-blue-950/5 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                    >
                        <BlogImage
                            post={p}
                            priority={idx < 3}
                            className="aspect-[16/10] w-full shrink-0"
                            imgClassName="group-hover:scale-105"
                        />

                        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-2">
                                {p.category && (
                                    <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-blue-700 transition-colors duration-200 group-hover:bg-blue-100/80">
                                        {p.category}
                                    </span>
                                )}
                                {p.date && (
                                    <span className="truncate text-[11px] font-medium text-slate-400">
                                        {p.date}
                                    </span>
                                )}
                            </div>

                            <h2 className="mt-3.5 line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-blue-700 sm:text-[1.15rem]">
                                {p.title}
                            </h2>

                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                                {p.excerpt}
                            </p>

                            <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-5 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                                    <Clock size={13} className="shrink-0 text-slate-400" />
                                    <span>{p.readTime}</span>
                                </span>

                                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 transition-colors duration-200 group-hover:text-blue-800">
                                    <span>Read article</span>
                                    <ArrowRight
                                        size={14}
                                        className="transform-gpu shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
                                    />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}