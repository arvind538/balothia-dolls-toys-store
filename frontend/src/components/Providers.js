'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { Snowflake } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { safeNext } from '@/lib/validators';
import Header from './Header';
import Footer from './Footer';

// Sign-in pages: shown on their own, without the header and footer.
const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

// Open pages: anyone can read them, even before signing in.
// Payment providers such as Razorpay require these pages to be publicly visible.
const OPEN_PAGES = ['/policies', '/contact', '/blogs'];

const matches = (path, list) => list.some((p) => path === p || path.startsWith(`${p}/`));

function Splash() {
    return (
        <div className="grid min-h-screen place-items-center bg-white">
            <div className="flex flex-col items-center gap-3">
                <Snowflake className="h-12 w-12 animate-spin text-blue-600" style={{ animationDuration: '2.5s' }} />
                <p className="text-sm font-semibold text-[#0b2a5b]">Balothia Refrigeration</p>
            </div>
        </div>
    );
}

function Shell({ children }) {
    const path = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();

    const isAuthPage = matches(path, AUTH_PAGES);
    const isOpen = matches(path, OPEN_PAGES);
    const isAdmin = path.startsWith('/admin');

    useEffect(() => {
        if (loading) return;
        if (!user && !isAuthPage && !isOpen) {
            const back = path !== '/' ? `?next=${encodeURIComponent(path + window.location.search)}` : '';
            router.replace(`/login${back}`);
        } else if (user && isAuthPage) {
            const next = safeNext(new URLSearchParams(window.location.search).get('next'));
            router.replace(next || (user.role === 'admin' ? '/admin' : '/'));
        }
    }, [loading, user, isAuthPage, isOpen, path, router]);

    // Nothing is shown until the visitor is signed in, except the sign-in pages and the open pages.
    if (loading || (!user && !isAuthPage && !isOpen) || (user && isAuthPage)) return <Splash />;
    if (isAuthPage) return <>{children}</>;

    return (
        <>
            {!isAdmin && <Header />}
            <main className="min-h-[60vh]">{children}</main>
            {!isAdmin && <Footer />}
        </>
    );
}

export default function Providers({ children }) {
    return (
        <AuthProvider>
            <CartProvider>
                <Toaster position="top-center" />
                <Shell>{children}</Shell>
            </CartProvider>
        </AuthProvider>
    );
}