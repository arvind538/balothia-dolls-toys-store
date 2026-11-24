const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, httpError } = require('../middleware/error');
const { isEmail, isPhone, isName, passwordError } = require('../utils/validate');
const { sendOtpMail, mailConfigured } = require('../utils/mailer');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const pack = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, wishlist: u.wishlist, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt });
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cleanEmail = (v) => String(v || '').trim().toLowerCase();

// ---------- REGISTER / LOGIN ----------
exports.register = asyncHandler(async (req, res) => {
    const { name, phone, password } = req.body;
    const email = cleanEmail(req.body.email);

    if (!isName(name)) throw httpError(400, 'Valid naam daalo (sirf letters, kam se kam 2)');
    if (!isEmail(email)) throw httpError(400, 'Valid email daalo');
    if (!isPhone(phone)) throw httpError(400, '10 digit ka valid mobile number daalo');
    const pErr = passwordError(password);
    if (pErr) throw httpError(400, pErr);

    if (await User.findOne({ email })) throw httpError(409, 'Ye email pehle se registered hai. Login karo.');

    const user = await User.create({ name: name.trim(), email, phone, password, lastLoginAt: new Date(), loginCount: 1 });
    res.status(201).json({ user: pack(user), token: sign(user._id) });
});

exports.login = asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body.email);
    const { password } = req.body;
    if (!isEmail(email) || !password) throw httpError(400, 'Email aur password daalo');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Email ya password galat hai');

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() }, $inc: { loginCount: 1 } });
    user.lastLoginAt = new Date();

    res.json({ user: pack(user), token: sign(user._id) });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: pack(req.user) }));

// ---------- WISHLIST ----------
exports.getWishlist = asyncHandler(async (req, res) => {
    const u = await User.findById(req.user._id).populate('wishlist');
    res.json(u.wishlist);
});

exports.toggleWishlist = asyncHandler(async (req, res) => {
    const id = req.params.productId;
    const already = await User.exists({ _id: req.user._id, wishlist: id });
    const user = await User.findByIdAndUpdate(
        req.user._id,
        already ? { $pull: { wishlist: id } } : { $addToSet: { wishlist: id } },
        { new: true }
    );
    res.json({ wishlist: user.wishlist });
});

// ---------- FORGOT PASSWORD (3 steps) ----------
// 1) email -> OTP bhejo
exports.forgotPassword = asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body.email);
    if (!isEmail(email)) throw httpError(400, 'Valid email daalo');

    const user = await User.findOne({ email }).select('+resetOtpSentAt');
    if (!user) throw httpError(404, 'Is email se koi account nahi mila');

    if (user.resetOtpSentAt && Date.now() - user.resetOtpSentAt.getTime() < 30000) {
        throw httpError(429, 'Thoda ruko, 30 second baad dobara OTP maango');
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                resetOtpHash: sha(`${email}:${otp}`),
                resetOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
                resetOtpSentAt: new Date(),
                resetOtpAttempts: 0,
            },
            $unset: { resetTokenHash: 1, resetTokenExpires: 1 },
        }
    );

    let mailFailed = false;
    try {
        await sendOtpMail(user.email, user.name, otp);
    } catch (e) {
        console.error('Mail error:', e.message);
        if (process.env.NODE_ENV === 'production') {
            throw httpError(502, 'Email bhej nahi paye. Thodi der baad try karo.');
        }
        mailFailed = true; // dev mein error nahi, OTP response mein de do
    }

    res.json({
        message: 'OTP bhej diya gaya hai',
        ...((!mailConfigured() || mailFailed) && process.env.NODE_ENV !== 'production'
            ? { devOtp: otp }
            : {}),
    });
});

// 2) OTP verify -> resetToken do
exports.verifyOtp = asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    if (!isEmail(email) || !/^\d{6}$/.test(otp)) throw httpError(400, '6 digit ka OTP daalo');

    const user = await User.findOne({ email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');
    if (!user || !user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
        throw httpError(400, 'OTP expire ho gaya. Naya OTP maango');
    }
    if (user.resetOtpAttempts >= 5) {
        await User.updateOne({ _id: user._id }, { $unset: { resetOtpHash: 1, resetOtpExpires: 1 } });
        throw httpError(429, 'Bahut zyada galat koshish. Naya OTP maango');
    }
    if (!same(sha(`${email}:${otp}`), user.resetOtpHash)) {
        await User.updateOne({ _id: user._id }, { $inc: { resetOtpAttempts: 1 } });
        throw httpError(400, `Galat OTP. ${4 - user.resetOtpAttempts} koshish baaki hain`);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.updateOne(
        { _id: user._id },
        {
            $set: { resetTokenHash: sha(resetToken), resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000) },
            $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpSentAt: 1 },
        }
    );
    res.json({ resetToken });
});

// 3) naya password set
exports.resetPassword = asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body.email);
    const { resetToken, password } = req.body;
    const pErr = passwordError(password);
    if (pErr) throw httpError(400, pErr);

    const user = await User.findOne({ email }).select('+password +resetTokenHash +resetTokenExpires');
    if (
        !user || !resetToken || !user.resetTokenHash || !user.resetTokenExpires ||
        user.resetTokenExpires < new Date() || !same(sha(resetToken), user.resetTokenHash)
    ) {
        throw httpError(400, 'Session expire ho gaya. Forgot password se dobara shuru karo');
    }

    user.password = password; // pre-save hook hash karega
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Password change ho gaya. Ab login karo.' });
});

// ---------- PROFILE ----------
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    if (!isName(name)) throw httpError(400, 'Valid naam daalo (sirf letters, kam se kam 2)');
    if (!isPhone(phone)) throw httpError(400, '10 digit ka valid mobile number daalo');

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { name: name.trim(), phone },
        { new: true, runValidators: true }
    );
    res.json({ user: pack(user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) throw httpError(400, 'Current password daalo');
    const pErr = passwordError(newPassword);
    if (pErr) throw httpError(400, pErr);

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) throw httpError(400, 'Current password galat hai');
    if (await user.matchPassword(newPassword)) throw httpError(400, 'Naya password purane se alag hona chahiye');

    user.password = newPassword; // pre-save hook hash karega
    await user.save();
    res.json({ message: 'Password change ho gaya' });
});