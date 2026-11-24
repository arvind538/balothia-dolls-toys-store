const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');

const limiter = (limit, minutes) =>
    rateLimit({
        windowMs: minutes * 60 * 1000,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Bahut zyada koshish ho gayi. Thodi der baad try karo.' },
    });

router.post('/register', limiter(20, 15), c.register);
router.post('/login', limiter(20, 15), c.login);
router.post('/forgot-password', limiter(8, 15), c.forgotPassword);
router.post('/verify-otp', limiter(20, 15), c.verifyOtp);
router.post('/reset-password', limiter(10, 15), c.resetPassword);

router.get('/me', protect, c.me);
router.put('/profile', protect, c.updateProfile);
router.put('/change-password', protect, limiter(10, 15), c.changePassword);

router.get('/wishlist', protect, c.getWishlist);
router.post('/wishlist/:productId', protect, c.toggleWishlist);

module.exports = router;