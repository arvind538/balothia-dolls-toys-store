const router = require('express').Router();
const c = require('../controllers/homeController');

router.get('/sections', c.publicSections);

module.exports = router;