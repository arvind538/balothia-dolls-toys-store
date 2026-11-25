export const isEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isPhone = (v = '') => /^[6-9]\d{9}$/.test(v);

export const pwChecks = (p = '') => ({
    length: p.length >= 8,
    letter: /[A-Za-z]/.test(p),
    number: /\d/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
});

// Score from 0 to 4
export const pwScore = (p = '') => {
    const c = pwChecks(p);
    let s = 0;
    if (c.length) s++;
    if (c.letter && c.number) s++;
    if (c.special) s++;
    if (p.length >= 12) s++;
    return s;
};

export const pwError = (p = '') => {
    if (!p) return 'Password is required';
    if (p.length < 8) return 'Must be at least 8 characters long';
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Must contain both letters and numbers';
    return '';
};

export function validateLogin(f) {
    const e = {};
    if (!f.email.trim()) e.email = 'Email is required';
    else if (!isEmail(f.email)) e.email = 'Enter a valid email (e.g., name@gmail.com)';
    if (!f.password) e.password = 'Password is required';
    return e;
}

export function validateRegister(f) {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name (at least 2 letters)';
    else if (!/^[\p{L} .'-]+$/u.test(f.name.trim())) e.name = 'Name should only contain letters';

    if (!f.email.trim()) e.email = 'Email is required';
    else if (!isEmail(f.email)) e.email = 'Enter a valid email (e.g., name@gmail.com)';

    if (!f.phone) e.phone = 'Mobile number is required';
    else if (!isPhone(f.phone)) e.phone = 'Enter a valid 10-digit mobile number';

    const pe = pwError(f.password);
    if (pe) e.password = pe;

    if (!f.confirm) e.confirm = 'Please confirm your password';
    else if (f.confirm !== f.password) e.confirm = 'Passwords do not match';

    if (!f.terms) e.terms = 'Please accept the terms to proceed';
    return e;
}

// Prevent open redirects: allow only internal site paths
export const safeNext = (n) =>
    n && n.startsWith('/') && !n.startsWith('//') && !/^\/(login|register|forgot-password)/.test(n) ? n : null;