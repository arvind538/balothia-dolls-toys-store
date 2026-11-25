'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    MapPin, CreditCard, Smartphone, Wallet, Banknote, Home, Briefcase,
    Loader2, CheckCircle2, ShieldCheck, Sparkles, ArrowLeft, ArrowRight, Pencil, ChevronRight,
} from 'lucide-react';
import { api, inr } from '@/lib/api';
import { cld } from '@/lib/img';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const PAYMENT_OPTIONS = [
    {
        id: 'card',
        gateway: 'razorpay',
        methodPref: 'card',
        title: 'Credit / Debit Card',
        subtitle: 'Visa, Mastercard, RuPay',
        icon: CreditCard,
        accent: 'text-blue-600 bg-blue-50',
    },
    {
        id: 'upi',
        gateway: 'razorpay',
        methodPref: 'upi',
        title: 'UPI Payment',
        subtitle: 'GPay, PhonePe, Paytm, BHIM',
        icon: Smartphone,
        accent: 'text-emerald-600 bg-emerald-50',
    },
    {
        id: 'wallet',
        gateway: 'razorpay',
        methodPref: 'wallet',
        title: 'Wallet',
        subtitle: 'Paytm, Amazon Pay, Mobikwik',
        icon: Wallet,
        accent: 'text-purple-600 bg-purple-50',
    },
    {
        id: 'cod',
        gateway: 'cod',
        methodPref: null,
        title: 'Cash on Delivery',
        subtitle: 'Pay when delivered',
        icon: Banknote,
        accent: 'text-amber-600 bg-amber-50',
    },
];

const ADDRESS_TYPES = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'Work', label: 'Work', icon: Briefcase },
    { id: 'Other', label: 'Other', icon: MapPin },
];

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });

function matchIndianState(apiState = '') {
    const clean = apiState.trim().toLowerCase();
    if (!clean) return '';
    return (
        INDIAN_STATES.find((st) => st.toLowerCase() === clean) ||
        INDIAN_STATES.find((st) => clean.includes(st.toLowerCase()) || st.toLowerCase().includes(clean)) ||
        apiState.trim()
    );
}

function validateAddress(f, pinLookupError) {
    const errors = {};
    const name = f.name.trim();
    const phone = f.phone.replace(/\D/g, '');
    const pincode = f.pincode.replace(/\D/g, '');
    const address = f.address.trim();
    const city = f.city.trim();
    const state = f.state.trim();

    if (name.length < 2) {
        errors.name = 'Please enter your full name.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
        errors.name = 'Name should contain only letters and spaces.';
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
        errors.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        errors.pincode = 'Enter a valid 6-digit pincode.';
    } else if (pinLookupError) {
        errors.pincode = pinLookupError;
    }

    const words = address.split(/\s+/).filter(Boolean);
    if (address.length < 10 || words.length < 2) {
        errors.address = 'Please enter your house no., street and area.';
    }

    if (city.length < 2 || !/^[a-zA-Z\s.-]+$/.test(city)) {
        errors.city = 'Please enter a valid city or district.';
    }

    if (!state) {
        errors.state = 'Please select your state.';
    }

    return errors;
}

export default function Checkout() {
    const { items, subtotal, shipping, total, clear } = useCart();
    const { user, loading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1); // 1 = Delivery Address, 2 = Payment Method
    const [selectedPayId, setSelectedPayId] = useState('upi');
    const [busy, setBusy] = useState(false);
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [pinMatched, setPinMatched] = useState('');
    const [pinLookupError, setPinLookupError] = useState('');

    const [f, setF] = useState({
        name: '',
        phone: '',
        pincode: '',
        address: '',
        landmark: '',
        city: '',
        state: '',
        addressType: 'Home',
    });

    const formRef = useRef(null);
    const selectedOption =
        PAYMENT_OPTIONS.find((opt) => opt.id === selectedPayId) || PAYMENT_OPTIONS[0];
    const pay = selectedOption.gateway;

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login?next=/checkout');
        }
        if (user) {
            setF((s) => ({
                ...s,
                name: s.name || user.name || '',
                phone: s.phone || (user.phone ? String(user.phone).replace(/\D/g, '').slice(0, 10) : ''),
            }));
        }
    }, [user, loading, router]);

    // Auto-fetch City & State when a valid 6-digit pincode is entered
    useEffect(() => {
        const pin = f.pincode.replace(/\D/g, '');
        if (pin.length < 6) {
            setPinMatched('');
            setPinLookupError('');
            setPinLoading(false);
            return;
        }

        if (!/^[1-9][0-9]{5}$/.test(pin)) {
            setPinMatched('');
            setPinLookupError('Enter a valid 6-digit pincode.');
            return;
        }

        let active = true;
        const controller = new AbortController();

        const lookupPincode = async () => {
            setPinLoading(true);
            setPinLookupError('');
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
                    signal: controller.signal,
                });
                const json = await res.json();
                if (!active) return;

                const entry = Array.isArray(json) ? json[0] : null;
                const postOffices = entry?.PostOffice;

                if (entry?.Status === 'Success' && Array.isArray(postOffices) && postOffices.length > 0) {
                    const po = postOffices[0];
                    const resolvedCity = (po.District || po.Block || po.Name || '').trim();
                    const resolvedState = matchIndianState(po.State || '');

                    setF((prev) => ({
                        ...prev,
                        city: resolvedCity || prev.city,
                        state: resolvedState || prev.state,
                    }));
                    setPinMatched(`${resolvedCity}${resolvedState ? `, ${resolvedState}` : ''}`);
                    setPinLookupError('');
                } else {
                    setPinMatched('');
                    setPinLookupError('Pincode not found. Please check and enter a valid 6-digit pincode.');
                }
            } catch (err) {
                if (!active || err.name === 'AbortError') return;
                setPinMatched('');
                setPinLookupError('');
            } finally {
                if (active) setPinLoading(false);
            }
        };

        const timer = setTimeout(lookupPincode, 250);
        return () => {
            active = false;
            controller.abort();
            clearTimeout(timer);
        };
    }, [f.pincode]);

    const errors = validateAddress(f, pinLookupError);

    const setField = (key) => (e) => {
        let val = e.target.value;
        if (key === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
        if (key === 'pincode') val = val.replace(/\D/g, '').slice(0, 6);
        setF((prev) => ({ ...prev, [key]: val }));
    };

    const markTouched = (key) => () => {
        setTouched((prev) => ({ ...prev, [key]: true }));
    };

    const showError = (key) => Boolean((touched[key] || submitted) && errors[key]);

    const handleNextToPayment = () => {
        setSubmitted(true);
        if (pinLoading) {
            return toast.error('Please wait while we verify your pincode.');
        }

        const currentErrors = validateAddress(f, pinLookupError);
        const firstErrorKey = Object.keys(currentErrors)[0];
        if (firstErrorKey) {
            toast.error(currentErrors[firstErrorKey]);
            const el = formRef.current?.querySelector(`[name="${firstErrorKey}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
            return;
        }

        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const place = async (e) => {
        e.preventDefault();
        if (step !== 2) {
            handleNextToPayment();
            return;
        }

        setSubmitted(true);
        const currentErrors = validateAddress(f, pinLookupError);
        const firstErrorKey = Object.keys(currentErrors)[0];
        if (firstErrorKey) {
            setStep(1);
            toast.error(currentErrors[firstErrorKey]);
            return;
        }

        setBusy(true);
        try {
            const cleanAddress = {
                name: f.name.trim(),
                phone: f.phone.trim(),
                pincode: f.pincode.trim(),
                address: f.address.trim(),
                landmark: f.landmark.trim(),
                city: f.city.trim(),
                state: f.state.trim(),
                addressType: f.addressType,
            };

            const { order, razorpay } = await api('/orders', {
                method: 'POST',
                body: {
                    items: items.map((i) => ({ product: i.product, qty: i.qty })),
                    shippingAddress: cleanAddress,
                    paymentMethod: pay,
                },
            });

            if (pay === 'cod') {
                clear();
                return router.push(`/order-success/${order._id}`);
            }

            if (!(await loadRazorpay())) {
                throw new Error('Unable to load payment gateway. Please check your internet connection.');
            }

            const rz = new window.Razorpay({
                key: razorpay.key,
                amount: razorpay.amount,
                currency: razorpay.currency,
                name: 'Balothia Refrigeration',
                description: 'Toys & learning store order',
                order_id: razorpay.orderId,
                prefill: {
                    name: cleanAddress.name,
                    contact: cleanAddress.phone,
                    email: user.email,
                    ...(selectedOption.methodPref ? { method: selectedOption.methodPref } : {}),
                },
                theme: { color: '#16a34a' },
                handler: async (resp) => {
                    try {
                        await api('/orders/verify', {
                            method: 'POST',
                            body: { orderId: order._id, ...resp },
                        });
                        clear();
                        router.push(`/order-success/${order._id}`);
                    } catch (err) {
                        toast.error(err.message);
                        setBusy(false);
                    }
                },
                modal: { ondismiss: () => setBusy(false) },
            });

            rz.on('payment.failed', (r) => {
                toast.error(r.error?.description || 'Payment failed. Please try again.');
                setBusy(false);
            });
            rz.open();
        } catch (err) {
            toast.error(err.message);
            setBusy(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="wrap py-16 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                <p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">Loading checkout...</p>
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="wrap py-16 text-center">
                <p className="text-4xl">🛒</p>
                <h1 className="mt-2.5 text-lg font-extrabold text-slate-900 sm:text-xl">Your cart is empty</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Add toys or dolls before proceeding to checkout.</p>
                <Link
                    href="/products"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 sm:text-sm"
                >
                    <ArrowLeft size={15} />
                    <span>Continue Shopping</span>
                </Link>
            </div>
        );
    }

    const inputClass = (fieldKey) =>
        `w-full rounded-lg border bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150 sm:text-sm ${showError(fieldKey)
            ? 'border-rose-500 ring-2 ring-rose-500/15 focus:border-rose-600'
            : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
        }`;

    const labelClass = 'mb-1 block text-xs font-semibold text-slate-700';

    return (
        <div className="wrap py-4 sm:py-6">
            {/* Compact Top Breadcrumb & Step Indicator */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs sm:mb-5 sm:px-5">
                <div className="flex items-center gap-2">
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                    >
                        <ArrowLeft size={14} />
                        <span>Cart</span>
                    </Link>
                    <ChevronRight size={13} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-900 sm:text-sm">Secure Checkout</span>
                </div>

                {/* Responsive Step Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all sm:px-3 sm:py-1.5 sm:text-xs ${step === 1
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                    >
                        {step > 1 ? <CheckCircle2 size={13} /> : <span className="grid h-4 w-4 place-items-center rounded-full bg-white/25 text-[10px]">1</span>}
                        <span>Address</span>
                    </button>

                    <ChevronRight size={13} className="text-slate-300" />

                    <button
                        type="button"
                        onClick={() => (step === 1 ? handleNextToPayment() : setStep(2))}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all sm:px-3 sm:py-1.5 sm:text-xs ${step === 2
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                    >
                        <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${step === 2 ? 'bg-white/25' : 'bg-slate-200/80'}`}>
                            2
                        </span>
                        <span>Payment</span>
                    </button>
                </div>
            </div>

            <form
                ref={formRef}
                onSubmit={place}
                noValidate
                className="grid items-start gap-5 lg:grid-cols-12 lg:gap-6"
            >
                {/* -------- Left Column: 2-Step Checkout -------- */}
                <div className="space-y-4 lg:col-span-8">
                    {step === 1 ? (
                        /* STEP 1: Compact & Responsive Delivery Address Card */
                        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all sm:p-5">
                            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-1 border-b border-slate-100 pb-3">
                                <h1 className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                                    <MapPin size={17} className="shrink-0 text-orange-500" />
                                    <span>Delivery Address</span>
                                </h1>
                                <p className="text-[11px] font-medium text-slate-400">
                                    * Required fields
                                </p>
                            </div>

                            <div className="space-y-3.5">
                                {/* Row 1: Full Name & Mobile Number (2-col on tablet/desktop) */}
                                <div className="grid gap-3.5 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>
                                            Full Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="e.g. Arvind Kumar"
                                            value={f.name}
                                            onChange={setField('name')}
                                            onBlur={markTouched('name')}
                                            className={inputClass('name')}
                                        />
                                        {showError('name') && (
                                            <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Mobile Number <span className="text-rose-500">*</span>
                                        </label>
                                        <div className={`flex items-stretch overflow-hidden rounded-lg border bg-white transition-all ${showError('phone')
                                            ? 'border-rose-500 ring-2 ring-rose-500/15'
                                            : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15'
                                            }`}>
                                            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-600 sm:text-sm">
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                name="phone"
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="10-digit number"
                                                value={f.phone}
                                                onChange={setField('phone')}
                                                onBlur={markTouched('phone')}
                                                className="w-full bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none sm:text-sm"
                                            />
                                        </div>
                                        {showError('phone') && (
                                            <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Pincode & Landmark (2-col on tablet/desktop) */}
                                <div className="grid gap-3.5 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <label className="block text-xs font-semibold text-slate-700">
                                                Pincode <span className="text-rose-500">*</span>
                                            </label>
                                            {pinLoading && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                                                    <Loader2 size={11} className="animate-spin" />
                                                    <span>Checking...</span>
                                                </span>
                                            )}
                                            {!pinLoading && pinMatched && !showError('pincode') && (
                                                <span className="inline-flex items-center gap-1 truncate text-[11px] font-bold text-emerald-600">
                                                    <CheckCircle2 size={11} className="shrink-0" />
                                                    <span className="truncate">{pinMatched}</span>
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            name="pincode"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="6-digit pincode"
                                            value={f.pincode}
                                            onChange={setField('pincode')}
                                            onBlur={markTouched('pincode')}
                                            className={inputClass('pincode')}
                                        />
                                        {showError('pincode') && (
                                            <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.pincode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Landmark <span className="font-normal text-slate-400">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            placeholder="e.g. Near City Hospital"
                                            value={f.landmark}
                                            onChange={setField('landmark')}
                                            className={inputClass('landmark')}
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Full Street Address */}
                                <div>
                                    <label className={labelClass}>
                                        Address (House No., Building, Street, Area) <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="address"
                                        rows={2}
                                        placeholder="e.g. 12, Shanti Nagar, Near City Mall"
                                        value={f.address}
                                        onChange={setField('address')}
                                        onBlur={markTouched('address')}
                                        className={`${inputClass('address')} resize-y min-h-[64px]`}
                                    />
                                    {showError('address') && (
                                        <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.address}</p>
                                    )}
                                </div>

                                {/* Row 4: City / District & State */}
                                <div className="grid gap-3.5 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>
                                            City / District <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="City"
                                            value={f.city}
                                            onChange={setField('city')}
                                            onBlur={markTouched('city')}
                                            className={inputClass('city')}
                                        />
                                        {showError('city') && (
                                            <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            State <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="state"
                                            value={f.state}
                                            onChange={setField('state')}
                                            onBlur={markTouched('state')}
                                            className={inputClass('state')}
                                        >
                                            <option value="">Select state</option>
                                            {INDIAN_STATES.map((st) => (
                                                <option key={st} value={st}>
                                                    {st}
                                                </option>
                                            ))}
                                        </select>
                                        {showError('state') && (
                                            <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.state}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 5: Address Type + Next Button */}
                                <div className="flex flex-col justify-between gap-3.5 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-end">
                                    <div className="w-full sm:max-w-xs">
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Address Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {ADDRESS_TYPES.map((t) => {
                                                const Icon = t.icon;
                                                const active = f.addressType === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setF((prev) => ({ ...prev, addressType: t.id }))}
                                                        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-all duration-150 active:scale-[0.98] ${active
                                                            ? 'border-orange-500 bg-orange-50/70 text-orange-600'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <Icon size={13} className={active ? 'text-orange-500' : 'text-slate-400'} />
                                                        <span>{t.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNextToPayment}
                                        disabled={pinLoading}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-xs transition-all duration-150 hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-sm"
                                    >
                                        <span>Next: Payment</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </section>
                    ) : (
                        /* STEP 2: Confirmed Address Summary + Payment Method Card */
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all sm:items-center sm:px-5 sm:py-4">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/70">
                                            <CheckCircle2 size={11} />
                                            <span>{f.addressType}</span>
                                        </span>
                                        <span className="text-xs font-bold tracking-normal text-slate-900 sm:text-sm">
                                            {f.name}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500">
                                            · +91 {f.phone}
                                        </span>
                                    </div>

                                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                                        {f.address}
                                        {f.landmark ? `, Near ${f.landmark}` : ''}, {f.city}, {f.state} –{' '}
                                        <span className="font-semibold text-slate-800">{f.pincode}</span>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 active:scale-95"
                                >
                                    <Pencil size={12} />
                                    <span>Edit</span>
                                </button>
                            </div>

                            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all sm:p-5">
                                <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                                        Select Payment Method
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                                    >
                                        <ArrowLeft size={13} />
                                        <span>Back</span>
                                    </button>
                                </div>

                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {PAYMENT_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const active = selectedPayId === opt.id;
                                        return (
                                            <label
                                                key={opt.id}
                                                onClick={() => setSelectedPayId(opt.id)}
                                                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-150 ${active
                                                    ? 'border-orange-500 bg-amber-50/40 ring-1 ring-orange-500/25'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                                                    }`}
                                            >
                                                <span
                                                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition-colors ${active ? 'border-orange-600' : 'border-slate-300'
                                                        }`}
                                                >
                                                    {active && <span className="h-2 w-2 rounded-full bg-orange-600" />}
                                                </span>

                                                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${opt.accent}`}>
                                                    <Icon size={16} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">{opt.title}</p>
                                                    <p className="truncate text-[11px] font-medium text-slate-500">{opt.subtitle}</p>
                                                </div>

                                                <input
                                                    type="radio"
                                                    name="paymentOption"
                                                    value={opt.id}
                                                    checked={active}
                                                    onChange={() => setSelectedPayId(opt.id)}
                                                    className="sr-only"
                                                />
                                            </label>
                                        );
                                    })}
                                </div>

                                <p className="mt-3.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                    <Sparkles size={13} className="shrink-0 text-teal-600" />
                                    <span>Secure payment gateway · Encrypted transaction</span>
                                </p>

                                <button
                                    type="submit"
                                    disabled={busy || pinLoading}
                                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-xs transition-all duration-150 hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                                >
                                    {busy ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Please wait...</span>
                                        </>
                                    ) : pay === 'cod' ? (
                                        <span>Place Order · {inr(total)}</span>
                                    ) : (
                                        <span>Pay {inr(total)}</span>
                                    )}
                                </button>
                            </section>
                        </div>
                    )}
                </div>

                {/* -------- Right Column: Order Summary -------- */}
                <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all lg:sticky lg:top-28 lg:col-span-4 sm:p-5">
                    <h2 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                        Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </h2>

                    <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                        {items.map((i) => (
                            <div
                                key={i.product}
                                className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2"
                            >
                                <img
                                    src={cld(i.image, 200)}
                                    alt={i.name}
                                    className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-1"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = 'https://placehold.co/200x200?text=Toy';
                                    }}
                                />
                                <span className="line-clamp-2 flex-1 text-xs font-semibold text-slate-800">
                                    {i.name} × {i.qty}
                                </span>
                                <span className="shrink-0 text-xs font-extrabold text-slate-900">
                                    {inr(i.price * i.qty)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3.5 space-y-1.5 border-t border-slate-200/80 pt-3 text-xs sm:text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-800">{inr(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Delivery</span>
                            <span className={shipping ? 'font-bold text-slate-800' : 'font-extrabold text-emerald-600'}>
                                {shipping ? inr(shipping) : 'FREE'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between border-t border-slate-200/80 pt-3">
                        <div>
                            <span className="text-sm font-extrabold text-slate-900 sm:text-base">Total</span>
                            <p className="text-[11px] text-slate-400">Inclusive of all taxes (GST)</p>
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                            {inr(total)}
                        </span>
                    </div>

                    <div className="mt-3.5 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-medium text-slate-500">
                        <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                        <span>100% safe &amp; verified checkout</span>
                    </div>
                </aside>
            </form>
        </div>
    );
}