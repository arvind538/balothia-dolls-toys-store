
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    User,
    Hash,
    CheckCircle2,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Headphones,
    Send,
    Sparkles,
    MessageSquareText,
    ChevronRight,
    LockKeyhole,
    RotateCcw,
} from 'lucide-react';

import { api } from '@/lib/api';
import { SITE } from '@/lib/siteInfo';
import { POLICY_LINKS } from '@/lib/links';
import { useAuth } from '@/context/AuthContext';
import { ServerError } from '@/components/AuthUI';
import { isEmail, isPhone } from '@/lib/validators';

/* ---------------------------------------------
   CONTACT FORM CONFIGURATION
--------------------------------------------- */

const TOPICS = [
    'Order status',
    'Return or refund',
    'Cancellation',
    'Product question',
    'Payment issue',
    'Feedback',
    'Other',
];

const EMPTY = {
    name: '',
    email: '',
    phone: '',
    orderId: '',
    topic: '',
    message: '',
    website: '',
};

const inputClasses = `
    w-full min-w-0 rounded-xl border border-slate-200
    bg-white px-4 py-3 text-sm font-medium text-slate-800
    placeholder:text-slate-400
    outline-none transition-all duration-200
    hover:border-slate-300
    focus:border-[#0b2a5b] focus:ring-4 focus:ring-[#0b2a5b]/[0.07]
    disabled:cursor-not-allowed disabled:bg-slate-100
`;

const errorClasses = '!border-red-400 focus:!border-red-500 focus:!ring-red-100';

/* ---------------------------------------------
   FORM VALIDATION
--------------------------------------------- */

function validateForm(form) {
    const errors = {};

    if (form.name.trim().length < 2) {
        errors.name = 'Please enter your full name.';
    }

    if (!isEmail(form.email.trim())) {
        errors.email = 'Please enter a valid email address.';
    }

    if (form.phone && !isPhone(form.phone)) {
        errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!form.topic) {
        errors.topic = 'Please select a query topic.';
    }

    if (form.message.trim().length < 10) {
        errors.message = 'Message must contain at least 10 characters.';
    }

    if (form.message.trim().length > 1500) {
        errors.message = 'Message cannot exceed 1500 characters.';
    }

    return errors;
}

/* ---------------------------------------------
   REUSABLE FORM FIELD
--------------------------------------------- */

function FormField({
    label,
    icon: Icon,
    prefix,
    error,
    className = '',
    ...props
}) {
    return (
        <div className={`min-w-0 ${className}`}>
            <label
                htmlFor={props.id}
                className="mb-2 block text-sm font-bold text-slate-700"
            >
                {label}
            </label>

            <div className="relative flex min-w-0 items-center">
                {Icon && (
                    <Icon
                        size={17}
                        className="pointer-events-none absolute left-3.5 text-slate-400"
                    />
                )}

                {prefix && (
                    <span className="absolute left-3.5 z-10 border-r border-slate-200 pr-3 text-sm font-bold text-slate-600">
                        {prefix}
                    </span>
                )}

                <input
                    {...props}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${props.id}-error` : undefined}
                    className={`
                        ${inputClasses}
                        ${Icon ? 'pl-10' : ''}
                        ${prefix ? 'pl-[4.2rem]' : ''}
                        ${error ? errorClasses : ''}
                    `}
                />
            </div>

            {error && (
                <p
                    id={`${props.id}-error`}
                    className="mt-1.5 text-xs font-medium text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

/* ---------------------------------------------
   MAIN CONTACT PAGE
--------------------------------------------- */

export default function ContactPage() {
    const { user } = useAuth();

    const [f, setF] = useState(EMPTY);
    const [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState('');

    const errors = validateForm(f);

    /* -----------------------------------------
       AUTO FILL SIGNED-IN USER
    ----------------------------------------- */

    useEffect(() => {
        if (!user) return;

        setF((prev) => ({
            ...prev,
            name: prev.name || user.name || '',
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || '',
        }));
    }, [user]);

    /* -----------------------------------------
       HANDLE INPUT CHANGE
    ----------------------------------------- */

    const handleChange = (name, value) => {
        setF((prev) => ({
            ...prev,
            [name]: value,
        }));

        setServerError('');
    };

    const handleBlur = (name) => {
        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));
    };

    const handleTopic = (topic) => {
        handleChange('topic', topic);
        handleBlur('topic');
    };

    /* -----------------------------------------
       SUBMIT CONTACT FORM
    ----------------------------------------- */

    const submit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm(f);

        setTouched({
            name: true,
            email: true,
            phone: true,
            topic: true,
            message: true,
        });

        if (Object.keys(validationErrors).length > 0) {
            const firstError = Object.keys(validationErrors)[0];

            document.getElementById(`contact-${firstError}`)?.focus();

            return;
        }

        if (busy) return;

        setBusy(true);
        setServerError('');

        try {
            await api('/contact', {
                method: 'POST',
                body: {
                    name: f.name.trim(),
                    email: f.email.trim(),
                    phone: f.phone,
                    orderId: f.orderId.trim(),
                    topic: f.topic,
                    message: f.message.trim(),
                    website: f.website,
                },
            });

            setSent(true);
        } catch (err) {
            setServerError(
                err?.message ||
                'Something went wrong. Please try again later.'
            );
        } finally {
            setBusy(false);
        }
    };

    /* -----------------------------------------
       RESET FORM
    ----------------------------------------- */

    const resetForm = () => {
        setF({
            ...EMPTY,
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
        });

        setTouched({});
        setServerError('');
        setSent(false);
    };

    /* -----------------------------------------
       CONTACT INFORMATION
    ----------------------------------------- */

    const info = [
        {
            icon: Mail,
            label: 'Email Support',
            value: SITE.email,
            href: SITE.email ? `mailto:${SITE.email}` : null,
            hint: 'Get assistance through email',
        },
        {
            icon: Phone,
            label: 'Call / Helpline',
            value: SITE.phone,
            href: SITE.phoneHref || null,
            hint: 'Speak directly with our team',
        },
        {
            icon: MapPin,
            label: 'Store & Office',
            value: SITE.address,
            href: null,
            hint: 'Our business location',
        },
        {
            icon: Clock,
            label: 'Business Hours',
            value: SITE.hours,
            href: null,
            hint: 'Our customer support timings',
        },
    ];

    const policies = POLICY_LINKS.filter((p) =>
        [
            'return-policy',
            'shipping-policy',
            'cancellation-policy',
        ].includes(p.slug)
    );

    /* -----------------------------------------
       SUCCESS SCREEN
    ----------------------------------------- */

    if (sent) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12 sm:py-20">
                <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">

                    <div className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-12 text-center shadow-xl shadow-slate-200/50 sm:px-12">

                        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
                            <CheckCircle2
                                size={48}
                                className="text-emerald-600"
                                strokeWidth={1.8}
                            />
                        </div>

                        <span className="mt-8 inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                            Message Submitted Successfully
                        </span>

                        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0b2a5b] sm:text-3xl">
                            Thank you for contacting us!
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
                            Your message has been successfully submitted.
                            Our customer support team will get back to you
                            {SITE.responseTime ? ` ${SITE.responseTime}` : ' as soon as possible'}.
                        </p>

                        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Response will be sent to
                            </p>
                            <p className="mt-1 break-all text-sm font-bold text-slate-800">
                                {f.email}
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

                            {user && (
                                <Link
                                    href="/support"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2a5b] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#082046]"
                                >
                                    <MessageSquareText size={17} />
                                    View My Messages
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={resetForm}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-[#0b2a5b] hover:text-[#0b2a5b]"
                            >
                                <RotateCcw size={16} />
                                Send Another Message
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    /* -----------------------------------------
       MAIN PAGE UI
    ----------------------------------------- */

    return (
        <main className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">

            {/* ===================================
                PREMIUM HERO SECTION
            =================================== */}

            <section className="relative isolate overflow-hidden bg-[#0b2a5b] text-white">

                <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-40 -right-20 h-[450px] w-[450px] rounded-full bg-orange-400/15 blur-3xl" />

                <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            'radial-gradient(#ffffff 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <div className="wrap relative px-4 py-14 sm:py-20 lg:py-24">

                    <div className="mx-auto max-w-3xl text-center">

                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-100 backdrop-blur-md">
                            <Headphones size={16} className="text-orange-300" />
                            Customer Care & Support
                        </span>

                        <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[54px]">
                            We're Here to
                            <span className="mt-1 block text-orange-300">
                                Help You
                            </span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100/90 sm:text-base">
                            Have a question about an order, a product,
                            or your delivery? Our friendly support team
                            is always ready to assist you.
                        </p>

                        <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-blue-100/90 sm:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-300" />
                                Customer First
                            </span>

                            <span className="hidden h-4 w-px bg-white/20 sm:block" />

                            <span className="inline-flex items-center gap-2">
                                <ShieldCheck size={16} className="text-orange-300" />
                                Secure Communication
                            </span>
                        </div>

                        {user && (
                            <Link
                                href="/support"
                                className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/20 sm:text-sm"
                            >
                                <MessageSquareText size={16} />
                                Track Existing Support Messages
                                <ArrowRight size={15} />
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ===================================
                MAIN CONTENT
            =================================== */}

            <section className="wrap relative px-4 pb-16 pt-8 sm:pb-24 sm:pt-12">

                <div className="grid items-start gap-7 lg:grid-cols-[0.82fr_1.35fr] lg:gap-9">

                    {/* ===================================
                        LEFT SIDEBAR
                    =================================== */}

                    <aside className="space-y-6">

                        {/* Contact Details */}

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-200/40">

                            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">

                                <div className="flex items-center gap-3">

                                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0b2a5b]/[0.07] text-[#0b2a5b]">
                                        <Headphones size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-extrabold text-[#0b2a5b]">
                                            Get in Touch
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            We're happy to hear from you
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">

                                {info.map(({ icon: Icon, label, value, href, hint }) => {

                                    const content = (
                                        <>
                                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0b2a5b]/[0.06] text-[#0b2a5b] transition-all duration-300 group-hover:bg-[#0b2a5b] group-hover:text-white">
                                                <Icon size={19} />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block text-xs font-semibold text-slate-400">
                                                    {label}
                                                </span>

                                                <span className="mt-1 block break-words text-sm font-bold leading-relaxed text-slate-800">
                                                    {value || 'Contact information unavailable'}
                                                </span>

                                                <span className="mt-1 block text-[11px] text-slate-500">
                                                    {hint}
                                                </span>
                                            </span>

                                            {href && (
                                                <ChevronRight
                                                    size={17}
                                                    className="mt-3 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#0b2a5b]"
                                                />
                                            )}
                                        </>
                                    );

                                    return href ? (
                                        <a
                                            key={label}
                                            href={href}
                                            className="group flex min-w-0 items-start gap-3.5 p-4 transition-colors hover:bg-slate-50 sm:p-5"
                                        >
                                            {content}
                                        </a>
                                    ) : (
                                        <div
                                            key={label}
                                            className="group flex min-w-0 items-start gap-3.5 p-4 sm:p-5"
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Help */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <div className="flex items-center gap-3">

                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-500">
                                    <Sparkles size={19} />
                                </div>

                                <h3 className="text-sm font-extrabold text-slate-900">
                                    Quick Help & Support
                                </h3>
                            </div>

                            <p className="mt-3 text-xs leading-6 text-slate-500">
                                Looking for an immediate answer?
                                Explore our helpful customer policies.
                            </p>

                            <div className="mt-4 space-y-2">

                                {policies.map((p) => (
                                    <Link
                                        key={p.slug}
                                        href={`/policies/${p.slug}`}
                                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#0b2a5b]/20 hover:bg-[#0b2a5b]/[0.04] hover:text-[#0b2a5b]"
                                    >
                                        <span className="min-w-0">
                                            {p.title}
                                        </span>

                                        <ArrowRight
                                            size={16}
                                            className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                                        />
                                    </Link>
                                ))}

                            </div>
                        </div>

                        {/* Grievance Officer */}

                        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-slate-50 p-5 shadow-sm sm:p-6">

                            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/50 blur-2xl" />

                            <div className="relative">

                                <div className="flex items-center gap-3">

                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b2a5b] text-white">
                                        <ShieldCheck size={20} />
                                    </div>

                                    <h3 className="text-sm font-extrabold text-[#0b2a5b]">
                                        Grievance Officer
                                    </h3>
                                </div>

                                <p className="mt-4 text-sm font-extrabold text-slate-800">
                                    {SITE.grievanceOfficer.name}
                                </p>

                                <a
                                    href={`mailto:${SITE.grievanceOfficer.email}`}
                                    className="mt-1 inline-block break-all text-xs font-bold text-blue-700 hover:underline"
                                >
                                    {SITE.grievanceOfficer.email}
                                </a>

                                <p className="mt-3 text-xs leading-6 text-slate-500">
                                    In accordance with consumer protection
                                    guidelines, we acknowledge formal
                                    complaints within 48 hours.
                                </p>
                            </div>
                        </div>

                        {/* Privacy Assurance */}

                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

                            <LockKeyhole
                                size={19}
                                className="mt-0.5 shrink-0 text-emerald-700"
                            />

                            <div>
                                <p className="text-xs font-extrabold text-emerald-900">
                                    Your Information Is Safe
                                </p>

                                <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                                    We use your contact details only
                                    to respond to your inquiry.
                                </p>
                            </div>
                        </div>

                    </aside>

                    {/* ===================================
                        RIGHT CONTACT FORM
                    =================================== */}

                    <div
                        id="contact-form"
                        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40"
                    >

                        {/* Form Header */}

                        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-6 sm:px-8 sm:py-7">

                            <div className="flex items-center gap-3">

                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0b2a5b] text-white shadow-lg shadow-blue-900/15">
                                    <MessageSquareText size={23} />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-xl font-extrabold tracking-tight text-[#0b2a5b] sm:text-2xl">
                                        Send Us a Message
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                        Complete the form and our team
                                        will assist you.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Body */}

                        <form
                            onSubmit={submit}
                            noValidate
                            className="space-y-6 p-5 sm:p-8"
                        >

                            <ServerError msg={serverError} />

                            {/* Personal Information */}

                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="h-5 w-1 rounded-full bg-orange-400" />

                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        Personal Information
                                    </h3>
                                </div>

                                <div className="grid min-w-0 gap-5 sm:grid-cols-2">

                                    <FormField
                                        id="contact-name"
                                        label="Full Name *"
                                        icon={User}
                                        placeholder="Enter your full name"
                                        autoComplete="name"
                                        value={f.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        onBlur={() => handleBlur('name')}
                                        error={touched.name ? errors.name : ''}
                                        disabled={busy}
                                    />

                                    <FormField
                                        id="contact-email"
                                        label="Email Address *"
                                        icon={Mail}
                                        type="email"
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        value={f.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        error={touched.email ? errors.email : ''}
                                        disabled={busy}
                                    />

                                    <FormField
                                        id="contact-phone"
                                        label="Mobile Number (Optional)"
                                        prefix="+91"
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="10-digit mobile number"
                                        autoComplete="tel-national"
                                        value={f.phone}
                                        onChange={(e) =>
                                            handleChange(
                                                'phone',
                                                e.target.value.replace(/\D/g, '').slice(0, 10)
                                            )
                                        }
                                        onBlur={() => handleBlur('phone')}
                                        error={touched.phone ? errors.phone : ''}
                                        disabled={busy}
                                    />

                                    <FormField
                                        id="contact-orderId"
                                        label="Order ID (Optional)"
                                        icon={Hash}
                                        placeholder="e.g. A1B2C3"
                                        maxLength={24}
                                        value={f.orderId}
                                        onChange={(e) =>
                                            handleChange(
                                                'orderId',
                                                e.target.value.replace(/[^a-zA-Z0-9#]/g, '').slice(0, 24)
                                            )
                                        }
                                        disabled={busy}
                                    />
                                </div>
                            </div>

                            {/* Query Topic */}

                            <div>

                                <div className="mb-3 flex items-center gap-2">
                                    <span className="h-5 w-1 rounded-full bg-orange-400" />

                                    <label
                                        htmlFor="contact-topic"
                                        className="text-sm font-extrabold text-slate-800"
                                    >
                                        How Can We Help You? *
                                    </label>
                                </div>

                                <div className="flex flex-wrap gap-2">

                                    {TOPICS.map((topic) => {
                                        const active = f.topic === topic;

                                        return (
                                            <button
                                                key={topic}
                                                type="button"
                                                disabled={busy}
                                                aria-pressed={active}
                                                onClick={() => handleTopic(topic)}
                                                className={`
                                                    rounded-full border px-3.5 py-2
                                                    text-xs font-bold transition-all duration-200
                                                    disabled:cursor-not-allowed disabled:opacity-60
                                                    ${active
                                                        ? 'border-[#0b2a5b] bg-[#0b2a5b] text-white shadow-md shadow-blue-900/10'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#0b2a5b]/40 hover:bg-blue-50/50 hover:text-[#0b2a5b]'
                                                    }
                                                `}
                                            >
                                                {topic}
                                            </button>
                                        );
                                    })}

                                </div>

                                <select
                                    id="contact-topic"
                                    value={f.topic}
                                    disabled={busy}
                                    onChange={(e) => handleTopic(e.target.value)}
                                    onBlur={() => handleBlur('topic')}
                                    aria-invalid={Boolean(touched.topic && errors.topic)}
                                    className={`
                                        ${inputClasses}
                                        mt-3 cursor-pointer
                                        ${touched.topic && errors.topic ? errorClasses : ''}
                                    `}
                                >
                                    <option value="">
                                        Or select a topic from the list
                                    </option>

                                    {TOPICS.map((topic) => (
                                        <option key={topic} value={topic}>
                                            {topic}
                                        </option>
                                    ))}
                                </select>

                                {touched.topic && errors.topic && (
                                    <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                                        {errors.topic}
                                    </p>
                                )}
                            </div>

                            {/* Message */}

                            <div>

                                <div className="mb-2 flex items-center justify-between gap-2">

                                    <label
                                        htmlFor="contact-message"
                                        className="text-sm font-extrabold text-slate-800"
                                    >
                                        Your Message *
                                    </label>

                                    <span className="text-[11px] font-medium text-slate-400">
                                        Minimum 10 characters
                                    </span>
                                </div>

                                <textarea
                                    id="contact-message"
                                    rows={6}
                                    maxLength={1500}
                                    disabled={busy}
                                    placeholder="Please describe your question or issue in detail. If it's about a particular product or order, mention its name or ID..."
                                    value={f.message}
                                    onChange={(e) => handleChange('message', e.target.value)}
                                    onBlur={() => handleBlur('message')}
                                    aria-invalid={Boolean(touched.message && errors.message)}
                                    aria-describedby="contact-message-help"
                                    className={`
                                        ${inputClasses}
                                        min-h-[150px] resize-y leading-7
                                        ${touched.message && errors.message ? errorClasses : ''}
                                    `}
                                />

                                <div
                                    id="contact-message-help"
                                    className="mt-2 flex flex-wrap items-center justify-between gap-2"
                                >
                                    <span className="text-xs font-medium text-red-600" role="alert">
                                        {touched.message ? errors.message : ''}
                                    </span>

                                    <span className={`text-xs font-semibold tabular-nums ${f.message.length >= 1400
                                        ? 'text-orange-600'
                                        : 'text-slate-400'
                                        }`}>
                                        {f.message.length} / 1500
                                    </span>
                                </div>
                            </div>

                            {/* Honeypot Spam Protection */}

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
                            >
                                <label htmlFor="contact-website">
                                    Website
                                </label>

                                <input
                                    id="contact-website"
                                    type="text"
                                    name="website"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={f.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                />
                            </div>

                            {/* Submit Footer */}

                            <div className="border-t border-slate-100 pt-5">

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="flex items-start gap-2.5">

                                        <LockKeyhole
                                            size={17}
                                            className="mt-0.5 shrink-0 text-emerald-600"
                                        />

                                        <p className="max-w-xs text-xs leading-5 text-slate-500">
                                            Your information is protected
                                            and will only be used to handle
                                            your inquiry.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="
                                            inline-flex w-full items-center
                                            justify-center gap-2.5 rounded-xl
                                            bg-[#0b2a5b] px-7 py-3.5
                                            text-sm font-extrabold text-white
                                            shadow-lg shadow-blue-950/15
                                            transition-all duration-300
                                            hover:-translate-y-0.5 hover:bg-[#082046]
                                            hover:shadow-xl
                                            focus:outline-none focus:ring-4
                                            focus:ring-[#0b2a5b]/20
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                            sm:w-auto
                                        "
                                    >
                                        {busy ? (
                                            <>
                                                <Loader2
                                                    size={18}
                                                    className="animate-spin"
                                                />
                                                Sending Message...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={17} />
                                                Send Message
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
