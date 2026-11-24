const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const c = require('../controllers/adminController');
const home = require('../controllers/homeController');
const msg = require('../controllers/messageController');

router.use(protect, adminOnly);

router.get('/stats', c.stats);
router.get('/sales', c.sales);
router.get('/notifications', c.notifications);

router.get('/products', c.listProducts);
router.patch('/products/:id/stock', c.updateStock);
router.post('/upload', uploadImages, c.uploadImages);

router.get('/orders', c.listOrders);
router.get('/orders/:id', c.getOrder);
router.patch('/orders/:id/status', c.updateOrderStatus);

router.get('/users', c.listUsers);
router.post('/users', c.createUser);
router.get('/users/:id', c.getUser);
router.patch('/users/:id/role', c.updateUserRole);
router.delete('/users/:id', c.deleteUser);

// Home page sections (fixed paths must stay above "/:id")
router.get('/home-sections', home.adminList);
router.post('/home-sections', home.create);
router.post('/home-sections/defaults', home.createDefaults);
router.put('/home-sections/reorder', home.reorder);
router.put('/home-sections/:id', home.update);
router.delete('/home-sections/:id', home.remove);

router.post('/messages/:id/reply', msg.reply);
// Contact messages (note: "summary" must stay above "/:id")
router.get('/messages', msg.list);
router.get('/messages/summary', msg.summary);
router.get('/messages/:id', msg.getOne);
router.patch('/messages/:id', msg.update);
router.delete('/messages/:id', msg.remove);

module.exports = router;