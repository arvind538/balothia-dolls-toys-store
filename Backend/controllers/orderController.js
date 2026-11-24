const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const { asyncHandler, httpError } = require('../middleware/error');

const razorpay = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

const calc = (lines) => {
    const itemsPrice = lines.reduce((s, i) => s + i.price * i.qty, 0);
    const shippingPrice = itemsPrice >= 999 ? 0 : 49;
    const totalPrice = itemsPrice + shippingPrice;
    const gstIncluded = +(totalPrice - totalPrice / 1.18).toFixed(2); // 18% GST included in price
    return { itemsPrice, shippingPrice, totalPrice, gstIncluded };
};

// stock minus + sold plus (sirf jab order confirm ho)
const finalize = async (order) => {
    await Product.bulkWrite(
        order.items.map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { stock: -i.qty, sold: i.qty } } } }))
    );
    await StockLog.insertMany(order.items.map((i) => ({ product: i.product, change: -i.qty, reason: 'order', note: order._id.toString() })));
    order.stockDeducted = true;
};

exports.createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress: a = {}, paymentMethod } = req.body;
    if (!items?.length) throw httpError(400, 'Cart is empty');
    if (!['razorpay', 'cod'].includes(paymentMethod)) throw httpError(400, 'Invalid payment method');
    for (const k of ['name', 'phone', 'address', 'city', 'state', 'pincode']) if (!a[k]) throw httpError(400, `Address: ${k} is required`);

    // Price + stock hamesha server se (client pe bharosa nahi)
    const products = await Product.find({ _id: { $in: items.map((i) => i.product) }, isActive: true });
    const lines = items.map((i) => {
        const p = products.find((x) => x._id.toString() === i.product);
        if (!p) throw httpError(400, 'A product in your cart is no longer available');
        const qty = Math.max(1, parseInt(i.qty) || 1);
        if (p.stock < qty) throw httpError(400, `${p.name}: only ${p.stock} left in stock`);
        return { product: p._id, name: p.name, image: p.images[0], price: p.price, qty };
    });

    const order = new Order({
        user: req.user._id,
        items: lines,
        shippingAddress: a,
        paymentMethod,
        ...calc(lines),
        status: paymentMethod === 'cod' ? 'Placed' : 'Pending Payment',
    });

    if (paymentMethod === 'cod') {
        await finalize(order);
        await order.save();
        return res.status(201).json({ order });
    }

    const rz = await razorpay().orders.create({ amount: Math.round(order.totalPrice * 100), currency: 'INR', receipt: order._id.toString() });
    order.razorpayOrderId = rz.id;
    await order.save();
    res.status(201).json({
        order,
        razorpay: { orderId: rz.id, amount: rz.amount, currency: rz.currency, key: process.env.RAZORPAY_KEY_ID },
    });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
    const { orderId, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) throw httpError(404, 'Order not found');
    if (order.isPaid) return res.json({ order });

    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
        .digest('hex');
    if (expected !== razorpay_signature) throw httpError(400, 'Payment verification failed');

    order.isPaid = true;
    order.paidAt = new Date();
    order.razorpayPaymentId = razorpay_payment_id;
    order.status = 'Placed';
    await finalize(order);
    await order.save();
    res.json({ order });
});

exports.myOrders = asyncHandler(async (req, res) =>
    res.json(await Order.find({ user: req.user._id, status: { $ne: 'Pending Payment' } }).sort({ createdAt: -1 }))
);

exports.getOrder = asyncHandler(async (req, res) => {
    const o = await Order.findById(req.params.id);
    if (!o) throw httpError(404, 'Order not found');
    if (o.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') throw httpError(403, 'Not allowed');
    res.json(o);
});