'use client';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Field, SubmitBtn, ServerError, PasswordStrength, useSearchSuffix } from '@/components/AuthUI';
import { validateRegister } from '@/lib/validators';

export default function RegisterPage() {
    const { register } = useAuth();
    const suffix = useSearchSuffix();
    const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: false });
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');

    const errors = validateRegister(f);

    const bind = (k, tf = (v) => v) => ({
        value: f[k],
        error: touched[k] ? errors[k] : '',
        onChange: (e) => {
            setF((prev) => ({ ...prev, [k]: tf(e.target.value) }));
            if (serverError) setServerError('');
        },
        onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    });

    const submit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, phone: true, password: true, confirm: true, terms: true });
        if (Object.keys(errors).length) return;

        setBusy(true);
        setServerError('');
        try {
            const u = await register({
                name: f.name.trim(),
                email: f.email.trim(),
                phone: f.phone,
                password: f.password,
            });
            toast.success(`Account created successfully! Welcome, ${u.name.split(' ')[0]} 🎉`);
        } catch (err) {
            setServerError(err.message || 'Something went wrong. Please try again.');
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all duration-300 sm:p-8">
                {/* Header Section */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Create your account
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign up in seconds and start exploring smart learning toys.
                    </p>
                </div>

                {/* Server Error Alert */}
                <ServerError msg={serverError} />

                {/* Registration Form */}
                <form onSubmit={submit} noValidate className="space-y-4">
                    <Field
                        label="Full Name"
                        icon={User}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        autoFocus
                        {...bind('name')}
                    />

                    <Field
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        {...bind('email')}
                    />

                    <Field
                        label="Mobile Number"
                        prefix="+91"
                        type="tel"
                        inputMode="numeric"
                        placeholder="Enter your 10-digit mobile number"
                        autoComplete="tel-national"
                        {...bind('phone', (v) => v.replace(/\D/g, '').slice(0, 10))}
                    />

                    <div className="space-y-1.5">
                        <Field
                            label="Password"
                            icon={Lock}
                            type="password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            {...bind('password')}
                        />
                        <PasswordStrength value={f.password} />
                    </div>

                    <Field
                        label="Confirm Password"
                        icon={Lock}
                        type="password"
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        {...bind('confirm')}
                    />

                    {/* Terms & Conditions */}
                    <div className="pt-1">
                        <label className="flex cursor-pointer select-none items-start gap-2.5 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={f.terms}
                                onChange={(e) => {
                                    setF((prev) => ({ ...prev, terms: e.target.checked }));
                                    setTouched((t) => ({ ...t, terms: true }));
                                }}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 transition focus:ring-blue-500"
                            />
                            <span className="leading-snug">
                                I agree to the{' '}
                                <Link href="/terms" className="font-medium text-blue-700 hover:underline">
                                    Terms &amp; Conditions
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="font-medium text-blue-700 hover:underline">
                                    Privacy Policy
                                </Link>
                                .
                            </span>

                            {/* I agree to the{' '}
                            <Link href="/policies/terms-and-conditions" target="_blank" className="font-semibold text-blue-700 hover:underline">Terms &amp; Conditions</Link>{' '}
                            and the{' '}
                            <Link href="/policies/privacy-policy" target="_blank" className="font-semibold text-blue-700 hover:underline">Privacy Policy</Link>. */}
                        </label>
                        {touched.terms && errors.terms && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">{errors.terms}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <SubmitBtn busy={busy}>
                            {busy ? 'Creating your account...' : 'Create Account'}
                        </SubmitBtn>
                    </div>
                </form>

                {/* Footer Link */}
                <p className="mt-6 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link
                        href={`/login${suffix}`}
                        className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}