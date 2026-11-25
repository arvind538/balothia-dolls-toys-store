import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { POSTS } from '@/lib/blogs';
import { SITE } from '@/lib/siteInfo';
import RichBlocks from '@/components/RichBlocks';
import BlogImage from '@/components/BlogImage';

export function generateStaticParams() {
    return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = POSTS.find((p) => p.slug === slug);
    return post
        ? {
            title: `${post.title} | ${SITE.name}`,
            description: post.excerpt,
            openGraph: post.image ? { images: [post.image] } : undefined,
        }
        : {};
}

export default async function BlogPost({ params }) {
    const { slug } = await params;
    const post = POSTS.find((p) => p.slug === slug);
    if (!post) notFound();
    const more = POSTS.filter((p) => p.slug !== slug).slice(0, 2);

    return (
        <div className="wrap py-5 sm:py-8">
            <nav
                aria-label="Breadcrumb"
                className="no-scrollbar mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs text-slate-500 sm:text-sm"
            >
                <Link href="/" className="transition hover:text-blue-700 hover:underline">
                    Home
                </Link>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
                <Link href="/blogs" className="transition hover:text-blue-700 hover:underline">
                    Blog
                </Link>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
                <span
                    aria-current="page"
                    className="max-w-[55vw] truncate font-medium text-slate-800 sm:max-w-none"
                >
                    {post.title}
                </span>
            </nav>

            <article className="mx-auto max-w-3xl">
                {/* Responsive Hero Image */}
                <BlogImage
                    post={post}
                    priority
                    className="aspect-[16/10] w-full rounded-2xl shadow-sm sm:aspect-[16/9]"
                    emojiClassName="text-7xl sm:text-8xl"
                />

                <div className="mt-6">
                    {post.category && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {post.category}
                        </span>
                    )}
                    <h1 className="mt-3 text-2xl font-extrabold leading-tight text-[#0b2a5b] sm:text-4xl">
                        {post.title}
                    </h1>
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>By {SITE.name}</span>
                        <span>{post.date}</span>
                        <span className="inline-flex items-center gap-1">
                            <Clock size={14} /> {post.readTime}
                        </span>
                    </p>
                </div>

                <div className="mt-5 border-t border-slate-200/80 pt-4">
                    <RichBlocks blocks={post.blocks} />
                </div>

                <div className="mt-10 rounded-2xl bg-blue-50 p-6 text-center sm:p-8">
                    <p className="text-lg font-extrabold text-[#0b2a5b]">
                        Ready to find the perfect toy?
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        Browse our educational toys and dolls, chosen with every age in mind.
                    </p>
                    <Link href="/products" className="btn mt-4 inline-flex items-center gap-1.5">
                        Shop now <ArrowRight size={16} />
                    </Link>
                </div>
            </article>

            {more.length > 0 && (
                <section className="mx-auto mt-12 max-w-3xl">
                    <h2 className="text-lg font-extrabold text-[#0b2a5b]">Keep reading</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {more.map((p) => (
                            <Link
                                key={p.slug}
                                href={`/blogs/${p.slug}`}
                                className="card group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                            >
                                <BlogImage
                                    post={p}
                                    className="h-16 w-20 shrink-0 rounded-xl sm:h-20 sm:w-24"
                                    imgClassName="group-hover:scale-105"
                                    emojiClassName="text-3xl"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700 sm:text-base">
                                        {p.title}
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500">
                                        {p.readTime}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}