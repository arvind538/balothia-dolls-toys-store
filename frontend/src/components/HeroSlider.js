

'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
    {
        id: 1,
        img: '/image/slider3.png',
        href: '/products?offers=true',
    },
    {
        id: 2,
        img: '/image/slider1.jpg',
        href: '/products',
    },
    {
        id: 3,
        img: '/image/slider2.jpg',
        href: '/products',
    },
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);
    const touchStartX = useRef(null);

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 3500);

        return () => clearInterval(timer);
    }, [current]);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
        touchStartX.current = null;
    };

    return (
        <div className="w-full">
            {/* TOP BANNER ABOVE SLIDER */}
            <div className="w-full px-2 sm:px-4 lg:px-6 mt-1.5 sm:mt-2 lg:mt-3 mb-2 sm:mb-2.5 lg:mb-3">
                <Link
                    href="/products"
                    className="block w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#fdf4f0] p-1 sm:p-1.5 lg:py-2.5 lg:px-4"
                >
                    <img
                        src="/image/kids.jpg"
                        alt="Everything for Babies & Kids Delivered in 60 Minutes"
                        className="w-full h-auto object-contain object-center"
                    />
                </Link>
            </div>

            {/* HERO SLIDER */}
            <section
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative w-full h-32 sm:h-52 md:h-68 lg:h-[380px] xl:h-[430px] overflow-hidden bg-transparent select-none"
            >
                {/* SLIDE IMAGES */}
                {SLIDES.map((slide, index) => {
                    const isActive = index === current;
                    return (
                        <div
                            key={slide.id}
                            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
                                }`}
                        >
                            <Link href={slide.href} className="block h-full w-full cursor-pointer">
                                <img
                                    src={slide.img}
                                    alt={`Banner ${index + 1}`}
                                    className="h-full w-full object-contain lg:object-cover object-center"
                                />
                            </Link>
                        </div>
                    );
                })}

                {/* LEFT ARROW */}
                <button
                    type="button"
                    onClick={prevSlide}
                    className="absolute left-1.5 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/85 hover:bg-white p-1 sm:p-2 lg:p-2.5 text-slate-800 shadow-md backdrop-blur-sm transition-all active:scale-95"
                    aria-label="Previous Slide"
                >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </button>

                {/* RIGHT ARROW */}
                <button
                    type="button"
                    onClick={nextSlide}
                    className="absolute right-1.5 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/85 hover:bg-white p-1 sm:p-2 lg:p-2.5 text-slate-800 shadow-md backdrop-blur-sm transition-all active:scale-95"
                    aria-label="Next Slide"
                >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </button>

                {/* NAVIGATION DOTS */}
                <div className="absolute bottom-2 sm:bottom-4 lg:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/35 px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-md">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setCurrent(i)}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${current === i
                                ? 'w-3.5 sm:w-6 bg-white'
                                : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/90'
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}











// // 'use client';
// // import Link from 'next/link';
// // import { useEffect, useRef, useState } from 'react';
// // import { ChevronLeft, ChevronRight } from 'lucide-react';

// // const SLIDES = [
// //     {
// //         id: 1,
// //         img: '/image/slider3.png',
// //         href: '/products?offers=true',
// //     },
// //     {
// //         id: 2,
// //         img: '/image/slider1.jpg',
// //         href: '/products',
// //     },
// //     {
// //         id: 3,
// //         img: '/image/slider2.jpg',
// //         href: '/products',
// //     },
// // ];

// // export default function HeroSlider() {
// //     const [current, setCurrent] = useState(0);
// //     const touchStartX = useRef(null);

// //     const nextSlide = () => {
// //         setCurrent((prev) => (prev + 1) % SLIDES.length);
// //     };

// //     const prevSlide = () => {
// //         setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
// //     };

// //     useEffect(() => {
// //         const timer = setInterval(() => {
// //             setCurrent((prev) => (prev + 1) % SLIDES.length);
// //         }, 3500);

// //         return () => clearInterval(timer);
// //     }, [current]);

// //     const handleTouchStart = (e) => {
// //         touchStartX.current = e.touches[0].clientX;
// //     };

// //     const handleTouchEnd = (e) => {
// //         if (touchStartX.current === null) return;
// //         const diff = touchStartX.current - e.changedTouches[0].clientX;
// //         if (Math.abs(diff) > 40) {
// //             if (diff > 0) nextSlide();
// //             else prevSlide();
// //         }
// //         touchStartX.current = null;
// //     };

// //     return (
// //         <section
// //             onTouchStart={handleTouchStart}
// //             onTouchEnd={handleTouchEnd}
// //             className="relative w-full h-32 sm:h-52 md:h-68 lg:h-[380px] xl:h-[430px] overflow-hidden bg-transparent select-none"
// //         >
// //             {/* SLIDE IMAGES */}
// //             {SLIDES.map((slide, index) => {
// //                 const isActive = index === current;
// //                 return (
// //                     <div
// //                         key={slide.id}
// //                         className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
// //                             }`}
// //                     >
// //                         <Link href={slide.href} className="block h-full w-full cursor-pointer">
// //                             <img
// //                                 src={slide.img}
// //                                 alt={`Banner ${index + 1}`}
// //                                 className="h-full w-full object-contain lg:object-cover object-center"
// //                             />
// //                         </Link>
// //                     </div>
// //                 );
// //             })}

// //             {/* LEFT ARROW */}
// //             <button
// //                 type="button"
// //                 onClick={prevSlide}
// //                 className="absolute left-1.5 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/85 hover:bg-white p-1 sm:p-2 lg:p-2.5 text-slate-800 shadow-md backdrop-blur-sm transition-all active:scale-95"
// //                 aria-label="Previous Slide"
// //             >
// //                 <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
// //             </button>

// //             {/* RIGHT ARROW */}
// //             <button
// //                 type="button"
// //                 onClick={nextSlide}
// //                 className="absolute right-1.5 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/85 hover:bg-white p-1 sm:p-2 lg:p-2.5 text-slate-800 shadow-md backdrop-blur-sm transition-all active:scale-95"
// //                 aria-label="Next Slide"
// //             >
// //                 <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
// //             </button>

// //             {/* NAVIGATION DOTS */}
// //             <div className="absolute bottom-2 sm:bottom-4 lg:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/35 px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-md">
// //                 {SLIDES.map((_, i) => (
// //                     <button
// //                         key={i}
// //                         type="button"
// //                         onClick={() => setCurrent(i)}
// //                         className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${current === i
// //                             ? 'w-3.5 sm:w-6 bg-white'
// //                             : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/90'
// //                             }`}
// //                         aria-label={`Go to slide ${i + 1}`}
// //                     />
// //                 ))}
// //             </div>
// //         </section>
// //     );
// // }
