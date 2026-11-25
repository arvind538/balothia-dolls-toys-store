'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FooterLinks from '@/components/FooterLinks';
import { SITE } from '@/lib/siteInfo';

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const YoutubeIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
);

const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.195 0 7.46 2.99 7.46 6.98 0 4.172-2.628 7.534-6.279 7.534-1.228 0-2.385-.639-2.78-1.396l-.758 2.894c-.274 1.047-1.018 2.357-1.516 3.156 1.472.453 3.033.695 4.646.695 6.621 0 11.988-5.367 11.988-11.988 0-6.62-5.367-11.987-11.988-11.987z" />
    </svg>
);

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
);

const SOCIALS = [
    ['Instagram', InstagramIcon],
    ['Facebook', FacebookIcon],
    ['YouTube', YoutubeIcon],
    ['Pinterest', PinterestIcon],
    ['Twitter', TwitterIcon],
];

export default function Footer() {
    const path = usePathname();

    const handleLogoClick = (e) => {
        if (path === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 60);
        }
    };

    return (
        <footer id="contact" className="relative mt-10 bg-[#f4f5f7] pb-6 pt-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main 3-column layout */}
                <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
                    {/* Column 1: Logo and tagline */}
                    <div>
                        <Link
                            href="/"
                            onClick={handleLogoClick}
                            aria-label="Balothia Home"
                            className="inline-flex items-center py-0.5 transition-opacity duration-200 hover:opacity-95"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/image/footer/logo.png"
                                alt="Balothia Refrigeration – Classic Dolls & Toys"
                                className="h-16 w-auto max-w-[260px] object-contain object-left sm:h-20 sm:max-w-[340px] md:h-24 md:max-w-[420px]"
                                draggable={false}
                            />
                        </Link>

                        <p className="mt-5 max-w-sm pr-0 text-[15px] leading-relaxed text-slate-500 sm:pr-4">
                            Where fun meets learning! Explore our premium collection of educational toys and beautiful dolls crafted to inspire creativity and early development.
                        </p>

                        {/* Flexible Download App Section */}
                        <div className="mt-6">
                            <p className="mb-3 text-[15px] font-extrabold text-black">
                                Download App
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <a
                                    href={SITE.appStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Download on the App Store"
                                    className="inline-flex items-center overflow-hidden rounded-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/image/footer/playstoreIcon.jpg"
                                        alt="Download on the App Store"
                                        className="h-10 w-auto object-contain"
                                        draggable={false}
                                    />
                                </a>

                                <a
                                    href={SITE.playStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Get it on Google Play"
                                    className="inline-flex items-center overflow-hidden rounded-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/image/footer/googleplay.jpg"
                                        alt="Get it on Google Play"
                                        className="h-10 w-auto object-contain"
                                        draggable={false}
                                    />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Links (all paths come from lib/links.js) */}
                    <FooterLinks />

                    {/* Column 3: Contact and social links */}
                    <div>
                        <h4 className="mb-5 text-[17px] font-bold text-black">Get in Touch</h4>
                        <div className="mb-6 space-y-2 text-[15px] text-slate-500">
                            <div>
                                <a
                                    href={`mailto:${SITE.email}`}
                                    className="group relative inline-block py-0.5 transition-colors duration-200 hover:text-black"
                                >
                                    <span>{SITE.email}</span>
                                    <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-slate-800 transition-all duration-300 ease-out group-hover:w-full" />
                                </a>
                            </div>
                            <div>
                                <a
                                    href={SITE.phoneHref}
                                    className="group relative inline-block py-0.5 transition-colors duration-200 hover:text-black"
                                >
                                    <span>{SITE.phone}</span>
                                    <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-slate-800 transition-all duration-300 ease-out group-hover:w-full" />
                                </a>
                            </div>
                            <p className="pt-2 text-sm leading-relaxed text-slate-500">{SITE.address}</p>
                        </div>

                        <h4 className="mb-4 text-[17px] font-bold text-black">Follow us</h4>
                        <div className="flex flex-wrap items-center gap-4 text-slate-500">
                            {SOCIALS.map(([label, Icon]) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="group relative inline-flex items-center justify-center rounded-lg p-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-black hover:shadow-xs"
                                >
                                    <Icon />
                                    <span className="pointer-events-none invisible absolute -top-9 left-1/2 z-20 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                                        {label}
                                        <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}