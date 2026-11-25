'use client';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Field, SubmitBtn, ServerError, useSearchSuffix } from '@/components/AuthUI';
import { validateLogin } from '@/lib/validators';

export default function LoginPage() {
    const { login } = useAuth();
    const suffix = useSearchSuffix();
    const [f, setF] = useState({ email: '', password: '' });
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');

    const errors = validateLogin(f);

    const bind = (k) => ({
        value: f[k],
        error: touched[k] ? errors[k] : '',
        onChange: (e) => {
            setF((prev) => ({ ...prev, [k]: e.target.value }));
            if (serverError) setServerError('');
        },
        onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    });

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (Object.keys(errors).length) return;

        setBusy(true);
        setServerError('');
        try {
            const u = await login(f.email.trim(), f.password);
            toast.success(`Welcome back, ${u.name.split(' ')[0]}! 👋`);
        } catch (err) {
            setServerError(err.message || 'Invalid email or password. Please try again.');
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all duration-300 sm:p-8">
                {/* Header Section */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Welcome back 👋
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Log in to your account and start shopping.
                    </p>
                </div>

                {/* Server Error Alert */}
                <ServerError msg={serverError} />

                {/* Login Form */}
                <form onSubmit={submit} noValidate className="space-y-4">
                    <Field
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        autoFocus
                        {...bind('email')}
                    />

                    <div>
                        <Field
                            label="Password"
                            icon={Lock}
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            {...bind('password')}
                        />
                        <div className="mt-2 text-right">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <SubmitBtn busy={busy}>
                            {busy ? 'Logging in...' : 'Log In'}
                        </SubmitBtn>
                    </div>
                </form>

                {/* Footer Link */}
                <p className="mt-6 text-center text-sm text-slate-600">
                    New here?{' '}
                    <Link
                        href={`/register${suffix}`}
                        className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}