const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const c = require('../controllers/supportController');

const replyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many replies were sent. Please try again in a few minutes.' },
});

router.use(protect);
router.get('/', c.list);
router.get('/summary', c.summary); // must stay above "/:id"
router.get('/:id', c.getOne);
router.post('/:id/reply', replyLimiter, c.reply);

module.exports = router;