const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/orderController');

router.use(protect);
router.post('/', c.createOrder);
router.post('/verify', c.verifyPayment);
router.get('/mine', c.myOrders);
router.get('/:id', c.getOrder);

module.exports = router;