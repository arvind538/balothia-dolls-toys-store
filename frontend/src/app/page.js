'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import HeroSlider from '@/components/HeroSlider';
import HomeSections from '@/components/HomeSections';

// Public folder mein rakhi hui wide banner image ka path
const BANNER_IMG = '/image/slider4.png';

// "value" must match the age groups used by the products: 0-3, 3-6, 6-9, 9-12 or 12+
const AGE_ITEMS = [
  { title: '0-3 Years', value: '0-3', img: '/image/baby1.jpg' },
  { title: '3-6 Years', value: '3-6', img: '/image/baby2.jpg' },
  { title: '6-9 Years', value: '6-9', img: '/image/baby3.jpg' },
  { title: '9-12 Years', value: '9-12', img: '/image/baby4.jpg' },
  { title: '12+ Years', value: '12+', img: '/image/baby5.jpg' },
];

// category: the slug of a category from Admin > Categories (shown next to the name, for example /stem-toys).
// search:   a fallback keyword, used while that category does not exist yet.
const CATEGORY_ITEMS = [
  { title: 'Pretend Play & Doctor Sets', category: 'pretend-play', search: 'doctor', img: '/image/gift1.jpg' },
  { title: 'Die-Cast Cars & Vehicles', category: 'vehicles', search: 'car', img: '/image/gift2.jpg' },
  { title: 'Art & Craft Kits', category: 'art-craft', search: 'craft', img: '/image/gift3.jpg' },
  { title: 'STEM & Science Toys', category: 'stem-toys', search: 'stem', img: '/image/gift4.jpg' },
  { title: 'Puzzles & Brain Teasers', category: 'electronic-puzzles', search: 'puzzle', img: '/image/gift5.jpg' },
  { title: 'Baby & Toddler Toys', category: 'baby-toys', search: 'baby', img: '/image/gift6.jpg' },
];

export default function Home() {
  // The slugs of the categories that really exist in the database.
  const [slugs, setSlugs] = useState(null);

  useEffect(() => {
    api('/categories', { auth: false })
      .then((list) => setSlugs(new Set(list.map((c) => c.slug))))
      .catch(() => setSlugs(new Set()));
  }, []);

  // Open the category if it exists. Otherwise fall back to a keyword search, so the visitor never lands on an empty page.
  const categoryHref = (item) =>
    slugs?.has(item.category)
      ? `/products?category=${encodeURIComponent(item.category)}`
      : `/products?search=${encodeURIComponent(item.search)}`;

  return (
    <>
      <HeroSlider />

      <HomeSections />

      {/* Shop By Category */}
      <section className="wrap pb-8 pt-6 sm:pb-10">
        <h2 className="mb-6 text-center text-xl font-extrabold text-slate-800 sm:text-2xl">
          Shop By Category
        </h2>

        {/* Mobile: 2 columns | Tablet and desktop: 3 columns */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {CATEGORY_ITEMS.map((item) => (
            <Link
              key={item.title}
              href={categoryHref(item)}
              className="group flex flex-col items-center rounded-2xl bg-white p-2 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-3"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#e3f2fd]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
                  draggable={false}
                />
              </div>

              <span className="mt-3 text-sm font-bold text-slate-800 transition-colors duration-300 group-hover:text-rose-600 sm:text-base lg:text-lg">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Responsive Wide Store Banner (No Cropping on Mobile, Tablet & Desktop) */}
      <section className="wrap py-3 sm:py-5">
        <Link
          href="/products"
          aria-label="Classic Dolls and Toys Store — Shop Now"
          className="group relative block w-full overflow-hidden rounded-xl border border-slate-200/80 bg-[#eef6ff] shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl active:scale-[0.995] sm:rounded-2xl lg:rounded-3xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={encodeURI(BANNER_IMG)}
            alt="Classic Dolls & Toys Store Banner"
            loading="lazy"
            decoding="async"
            draggable={false}
            className="block h-auto w-full transform-gpu transition-transform duration-500 ease-out group-hover:scale-[1.015]"
          />

          {/* Subtle hover sheen overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950/0 via-white/0 to-amber-500/0 transition-colors duration-300 group-hover:from-blue-950/5 group-hover:to-amber-500/10"
          />
        </Link>
      </section>

      {/* Shop By Age */}
      <section className="wrap pb-10 pt-6 sm:pt-8">
        <h2 className="mb-5 text-center text-xl font-extrabold text-slate-800 sm:text-2xl">
          Shop By Age
        </h2>

        {/* Mobile: horizontal scroll | Tablet: 3 columns | Desktop: 5 columns */}
        <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 md:grid-cols-5 md:gap-5 lg:gap-6">
          {AGE_ITEMS.map((item) => (
            <Link
              key={item.value}
              href={`/products?ageGroup=${encodeURIComponent(item.value)}`}
              className="group flex w-36 shrink-0 flex-col items-center p-2 text-center sm:w-auto sm:p-3 lg:p-4"
            >
              <div className="relative flex aspect-square w-24 items-end justify-center overflow-visible rounded-full sm:w-28 md:w-32 lg:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-full w-full object-contain object-bottom transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
                  draggable={false}
                />
              </div>

              <span className="mt-3 text-sm font-bold text-slate-800 transition-colors duration-300 group-hover:text-rose-600 sm:text-base">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}