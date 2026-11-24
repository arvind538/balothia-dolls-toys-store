const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/categoryController');

router.get('/', c.list);
router.post('/', protect, adminOnly, c.create);
router.put('/:id', protect, adminOnly, c.update);
router.delete('/:id', protect, adminOnly, c.remove);

module.exports = router;