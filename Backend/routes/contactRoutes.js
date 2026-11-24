const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { optionalAuth } = require('../middleware/auth');
const c = require('../controllers/contactController');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many messages were sent. Please try again in a few minutes.' },
});

router.post('/', limiter, optionalAuth, c.submit);

module.exports = router;