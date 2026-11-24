exports.isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

exports.isPhone = (v) => /^[6-9]\d{9}$/.test(String(v || ''));

exports.isName = (v) => typeof v === 'string' && v.trim().length >= 2 && /^[\p{L} .'-]+$/u.test(v.trim());

exports.passwordError = (p) => {
    if (typeof p !== 'string' || p.length < 8) return 'Password kam se kam 8 characters ka hona chahiye';
    if (p.length > 64) return 'Password 64 characters se zyada nahi ho sakta';
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password me letter aur number dono hone chahiye';
    return null;
};