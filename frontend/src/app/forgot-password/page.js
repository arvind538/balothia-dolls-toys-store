'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { Field, SubmitBtn, ServerError, PasswordStrength, OtpInput } from '@/components/AuthUI';
import { isEmail, pwError } from '@/lib/validators';

const maskEmail = (e) => e.replace(/(.{2}).*(@.*)/, '$1***$2');
const EMPTY_OTP = () => Array(6).fill('');

function Steps({ step }) {
    return (
        <div className="mb-6 flex items-center justify-center gap-2">
            {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2">
                    <span
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors duration-300 ${step >= n ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'
                            }`}
                    >
                        {n}
                    </span>
                    {n < 3 && (
                        <span
                            className={`h-0.5 w-8 rounded transition-colors duration-300 ${step > n ? 'bg-blue-700' : 'bg-slate-200'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: done
    const [email, setEmail] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [otp, setOtp] = useState(EMPTY_OTP());
    const [resetToken, setResetToken] = useState('');
    const [pw, setPw] = useState({ password: '', confirm: '' });
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [serverError, setServerError] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [cool, setCool] = useState(0);

    useEffect(() => {
        if (cool <= 0) return;
        const t = setTimeout(() => setCool((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cool]);

    const emailErr = !email.trim()
        ? 'Please enter your email address'
        : !isEmail(email)
            ? 'Please enter a valid email address (e.g., name@example.com)'
            : '';

    const pwErrors = {
        password: pwError(pw.password),
        confirm: !pw.confirm
            ? 'Please re-enter your password'
            : pw.confirm !== pw.password
                ? 'Passwords do not match'
                : '',
    };

    const sendOtp = async (e) => {
        e?.preventDefault();
        setEmailTouched(true);
        if (emailErr) return;

        setBusy(true);
        setServerError('');
        try {
            const d = await api('/auth/forgot-password', {
                method: 'POST',
                body: { email: email.trim() },
                auth: false,
            });
            setDevOtp(d.devOtp || '');
            setOtp(EMPTY_OTP());
            setStep(2);
            setCool(30);
            toast.success('OTP has been sent to your email.');
        } catch (err) {
            setServerError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const verify = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            return setServerError('Please enter the complete 6-digit OTP.');
        }

        setBusy(true);
        setServerError('');
        try {
            const d = await api('/auth/verify-otp', {
                method: 'POST',
                body: { email: email.trim(), otp: code },
                auth: false,
            });
            setResetToken(d.resetToken);
            setStep(3);
        } catch (err) {
            setServerError(err.message || 'Invalid OTP. Please try again.');
            setOtp(EMPTY_OTP());
        } finally {
            setBusy(false);
        }
    };

    const reset = async (e) => {
        e.preventDefault();
        setTouched({ password: true, confirm: true });
        if (pwErrors.password || pwErrors.confirm) return;

        setBusy(true);
        setServerError('');
        try {
            await api('/auth/reset-password', {
                method: 'POST',
                body: { email: email.trim(), resetToken, password: pw.password },
                auth: false,
            });
            setStep(4);
            toast.success('Your password has been updated successfully!');
        } catch (err) {
            setServerError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const titles = {
        1: ['Forgot password?', 'Enter your registered email address and we will send you an OTP.'],
        2: ['Verify OTP', `A 6-digit OTP has been sent to ${maskEmail(email)} (valid for 10 minutes).`],
        3: ['Set new password', 'Choose a strong password that you can easily remember.'],
        4: ['All done!', 'Your password has been reset successfully.'],
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all duration-300 sm:p-8">
                {/* Header Section */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {titles[step][0]}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">{titles[step][1]}</p>
                </div>

                {/* Progress Indicator */}
                {step < 4 && <Steps step={step} />}

                {/* Server Error Alert */}
                <ServerError msg={serverError} />

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={sendOtp} noValidate className="space-y-4">
                        <Field
                            label="Email Address"
                            icon={Mail}
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            error={emailTouched ? emailErr : ''}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (serverError) setServerError('');
                            }}
                            onBlur={() => setEmailTouched(true)}
                        />
                        <div className="pt-2">
                            <SubmitBtn busy={busy}>
                                {busy ? 'Sending OTP...' : 'Send OTP'}
                            </SubmitBtn>
                        </div>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={verify} className="space-y-4">
                        {devOtp && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <Info size={16} className="mt-0.5 shrink-0" />
                                <span>
                                    Dev mode (email not configured): Your OTP is{' '}
                                    <b className="text-base tracking-widest">{devOtp}</b>
                                </span>
                            </div>
                        )}

                        <OtpInput
                            value={otp}
                            onChange={(v) => {
                                setOtp(v);
                                if (serverError) setServerError('');
                            }}
                            hasError={!!serverError}
                        />

                        <div className="pt-1">
                            <SubmitBtn busy={busy}>
                                {busy ? 'Verifying...' : 'Verify OTP'}
                            </SubmitBtn>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setServerError('');
                                }}
                                className="text-slate-500 transition-colors hover:text-slate-800"
                            >
                                Change email
                            </button>
                            {cool > 0 ? (
                                <span className="text-slate-500">Resend in {cool}s</span>
                            ) : (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={sendOtp}
                                    className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline disabled:opacity-50"
                                >
                                    Resend OTP
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Step 3: Reset Password */}
                {step === 3 && (
                    <form onSubmit={reset} noValidate className="space-y-4">
                        <div className="space-y-1.5">
                            <Field
                                label="New Password"
                                icon={Lock}
                                type="password"
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                autoFocus
                                value={pw.password}
                                error={touched.password ? pwErrors.password : ''}
                                onChange={(e) => {
                                    setPw((prev) => ({ ...prev, password: e.target.value }));
                                    if (serverError) setServerError('');
                                }}
                                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                            />
                            <PasswordStrength value={pw.password} />
                        </div>

                        <Field
                            label="Confirm Password"
                            icon={Lock}
                            type="password"
                            placeholder="Re-enter your new password"
                            autoComplete="new-password"
                            value={pw.confirm}
                            error={touched.confirm ? pwErrors.confirm : ''}
                            onChange={(e) => setPw((prev) => ({ ...prev, confirm: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                        />

                        <div className="pt-2">
                            <SubmitBtn busy={busy}>
                                {busy ? 'Saving password...' : 'Reset Password'}
                            </SubmitBtn>
                        </div>
                    </form>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="space-y-5 text-center">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
                        <p className="text-sm text-slate-600">
                            You can now log in using your new password.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Go to Log In
                        </button>
                    </div>
                )}

                {/* Footer Link */}
                {step < 4 && (
                    <div className="mt-6 text-center text-sm text-slate-600">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                        >
                            <ArrowLeft size={15} /> Back to Log In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}