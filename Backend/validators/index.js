const { body, param } = require('express-validator');
const { CATEGORIES, ORDER_STATUSES } = require('../config/constants');

const productCreate = [
    body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Name 2-150 characters ka ho'),
    body('price').isFloat({ min: 0 }).withMessage('Price 0 ya usse zyada ho').toFloat(),
    body('stock').isInt({ min: 0 }).withMessage('Stock whole number ho, 0 ya usse zyada').toInt(),
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('discountPercent').optional().isInt({ min: 0, max: 90 }).withMessage('Discount 0-90 ke beech ho').toInt(),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description 2000 se kam ho'),
    body('images').optional().isArray().withMessage('Images array hona chahiye'),
    body('images.*').optional().isURL().withMessage('Image valid URL ho'),
];

const productUpdate = [
    param('id').isMongoId().withMessage('Invalid product id'),
    body('name').optional().trim().isLength({ min: 2, max: 150 }),
    body('price').optional().isFloat({ min: 0 }).toFloat(),
    body('stock').optional().isInt({ min: 0 }).toInt(),
    body('category').optional().isIn(CATEGORIES),
    body('discountPercent').optional().isInt({ min: 0, max: 90 }).toInt(),
    body('isActive').optional().isBoolean().toBoolean(),
];

const stockUpdate = [
    param('id').isMongoId().withMessage('Invalid product id'),
    body('stock').isInt({ min: 0 }).withMessage('Stock 0 ya usse zyada integer ho').toInt(),
];

const orderCreate = [
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name required'),
    body('shippingAddress.phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10 digit mobile daalo'),
    body('shippingAddress.line1').trim().notEmpty().withMessage('Address zaroori hai'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City zaroori hai'),
    body('shippingAddress.state').trim().notEmpty().withMessage('State zaroori hai'),
    body('shippingAddress.pincode').matches(/^\d{6}$/).withMessage('6 digit pincode daalo'),
    body('paymentMethod').isIn(['razorpay', 'cod']).withMessage('Payment method galat hai'),
    body('items').isArray({ min: 1 }).withMessage('Cart khali hai'),
    body('items.*.productId').isMongoId().withMessage('Invalid product id'),
    body('items.*.qty').isInt({ min: 1, max: 10 }).withMessage('Quantity 1-10 ke beech ho').toInt(),
];

const orderStatusUpdate = [
    param('id').isMongoId().withMessage('Invalid order id'),
    body('orderStatus').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
];

module.exports = { productCreate, productUpdate, stockUpdate, orderCreate, orderStatusUpdate };