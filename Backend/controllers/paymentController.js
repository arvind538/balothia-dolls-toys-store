const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { reduceStock } = require('../utils/stock');
const asyncHandler = require('../utils/asyncHandler');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Razorpay order banao
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
    if (order.paymentMethod !== 'razorpay') {
        return res.status(400).json({ success: false, message: 'Ye order online payment ka nahi hai' });
    }
    if (order.paymentStatus === 'paid') {
        return res.status(400).json({ success: false, message: 'Ye order pehle se paid hai' });
    }

    const rzpOrder = await razorpay.orders.create({
        amount: Math.round(order.totalPrice * 100), // paise me
        currency: 'INR',
        receipt: order._id.toString(),
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.json({ success: true, key: process.env.RAZORPAY_KEY_ID, rzpOrder });
});

// Step 2: Payment ka signature verify karo
exports.verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expected !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment signature invalid hai' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
    if (order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ success: false, message: 'Order mismatch' });
    }
    if (order.paymentStatus === 'paid') return res.json({ success: true, order }); // idempotent

    await reduceStock(order.items);

    order.paymentStatus = 'paid';
    order.orderStatus = 'processing';
    order.razorpayPaymentId = razorpay_payment_id;
    order.paidAt = new Date();
    await order.save();

    res.json({ success: true, order });
});