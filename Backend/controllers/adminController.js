const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const StockLog = require('../models/StockLog');
const { asyncHandler, httpError } = require('../middleware/error');
const { logStock } = require('../utils/stock');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { isEmail, isPhone, isName, passwordError } = require('../utils/validate');
const ContactMessage = require('../models/ContactMessage');

const TZ = 'Asia/Kolkata';
const EXCLUDED = ['Cancelled', 'Pending Payment'];
const STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const istStart = (d = new Date()) => new Date(`${d.toLocaleDateString('en-CA', { timeZone: TZ })}T00:00:00+05:30`);
const dayRange = (d) => { const from = new Date(`${d}T00:00:00+05:30`); return { $gte: from, $lt: new Date(from.getTime() + 86400000) }; };
const monthRange = (m) => {
    const [y, mo] = m.split('-').map(Number);
    const from = new Date(`${m}-01T00:00:00+05:30`);
    const to = new Date(`${mo === 12 ? y + 1 : y}-${String(mo === 12 ? 1 : mo + 1).padStart(2, '0')}-01T00:00:00+05:30`);
    return { $gte: from, $lt: to };
};

/* ---------------- SALES ---------------- */
const salesRows = async (unit) => {
    const n = unit === 'month' ? 12 : 30;
    const fmt = unit === 'month' ? '%Y-%m' : '%Y-%m-%d';
    const since = new Date();
    if (unit === 'month') since.setMonth(since.getMonth() - (n - 1), 1);
    else since.setDate(since.getDate() - (n - 1));
    since.setHours(0, 0, 0, 0);
    const key = { $dateToString: { format: fmt, date: '$createdAt', timezone: TZ } };

    const [orders, restocks] = await Promise.all([
        Order.aggregate([
            { $match: { status: { $nin: EXCLUDED }, createdAt: { $gte: since } } },
            { $group: { _id: key, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 }, items: { $sum: { $sum: '$items.qty' } } } },
        ]),
        StockLog.aggregate([
            { $match: { reason: 'restock', createdAt: { $gte: since } } },
            { $group: { _id: key, restocked: { $sum: '$change' } } },
        ]),
    ]);

    const o = Object.fromEntries(orders.map((r) => [r._id, r]));
    const s = Object.fromEntries(restocks.map((r) => [r._id, r]));
    const now = new Date();
    const rows = [];
    for (let i = n - 1; i >= 0; i--) {
        const x = new Date(now);
        if (unit === 'month') x.setMonth(now.getMonth() - i, 1);
        else x.setDate(now.getDate() - i);
        const label = x.toLocaleDateString('en-CA', { timeZone: TZ }).slice(0, unit === 'month' ? 7 : 10);
        rows.push({ label, revenue: o[label]?.revenue || 0, orders: o[label]?.orders || 0, items: o[label]?.items || 0, restocked: s[label]?.restocked || 0 });
    }
    return rows;
};

exports.sales = asyncHandler(async (req, res) => {
    const unit = req.query.unit === 'month' ? 'month' : 'day';
    res.json({ unit, rows: await salesRows(unit) });
});

/* ---------------- DASHBOARD ---------------- */
exports.stats = asyncHandler(async (req, res) => {
    const startToday = istStart();
    const [daily, monthly, totals, products, customers, customersToday, pending, lowStockCount, lowStock, recent, top, statusAgg, recentUsers, catList, catAgg] =
        await Promise.all([
            salesRows('day'),
            salesRows('month'),
            Order.aggregate([{ $match: { status: { $nin: EXCLUDED } } }, { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }]),
            Product.countDocuments(),
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'user', createdAt: { $gte: startToday } }),
            Order.countDocuments({ status: { $in: ['Placed', 'Processing'] } }),
            Product.countDocuments({ stock: { $lte: 5 } }),
            Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).select('name stock images'),
            Order.find({ status: { $ne: 'Pending Payment' } }).sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
            Product.find().sort({ sold: -1 }).limit(5).select('name sold price images'),
            Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
            User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email phone createdAt lastLoginAt'),
            Category.find().sort({ createdAt: 1 }).select('name icon image'),
            Product.aggregate([
                { $group: { _id: '$category', products: { $sum: 1 }, stock: { $sum: '$stock' }, sold: { $sum: '$sold' }, low: { $sum: { $cond: [{ $lte: ['$stock', 5] }, 1, 0] } } } },
            ]),
        ]);

    const categoryStats = catList.map((c) => {
        const a = catAgg.find((x) => String(x._id) === String(c._id)) || {};
        return { _id: c._id, name: c.name, icon: c.icon, image: c.image, products: a.products || 0, stock: a.stock || 0, sold: a.sold || 0, low: a.low || 0 };
    });

    res.json({
        today: daily[daily.length - 1],
        month: monthly[monthly.length - 1],
        totalRevenue: totals[0]?.revenue || 0,
        totalOrders: totals[0]?.orders || 0,
        statusCounts: Object.fromEntries(statusAgg.map((s) => [s._id, s.n])),
        products, customers, customersToday, pending, lowStockCount, lowStock, recent, top, recentUsers, categoryStats,
    });
});

exports.notifications = asyncHandler(async (req, res) => {
    const [orders, users, lowStock, messages, unreadMessages] = await Promise.all([
        Order.find({ status: { $ne: 'Pending Payment' } }).sort({ createdAt: -1 }).limit(10).populate('user', 'name').select('user totalPrice status createdAt paidAt'),
        User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(10).select('name email createdAt'),
        Product.countDocuments({ stock: { $lte: 5 }, isActive: true }),
        ContactMessage.find().sort({ lastActivityAt: -1, createdAt: -1 }).limit(10).select('name topic status lastReplyBy lastActivityAt createdAt'),
        ContactMessage.countDocuments({ status: 'new' }),
    ]);
    res.json({ orders, users, lowStock, messages, unreadMessages, now: new Date().toISOString() });
});

/* ---------------- PRODUCTS / STOCK ---------------- */
// exports.listProducts = asyncHandler(async (req, res) => {
//     const { search, category, stock, page = 1, limit = 20 } = req.query;
//     const q = {};
//     if (search) q.name = { $regex: esc(search), $options: 'i' };
//     if (category && mongoose.isValidObjectId(category)) q.category = category;
//     if (stock === 'low') q.stock = { $lte: 5 };
//     if (stock === 'out') q.stock = 0;
//     const [items, total] = await Promise.all([
//         Product.find(q).populate('category', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
//         Product.countDocuments(q),
//     ]);
//     res.json({ items, total, pages: Math.ceil(total / limit) });
// });


exports.listProducts = asyncHandler(async (req, res) => {
    const { search, category, stock, status, sort = 'newest', page = 1, limit = 20 } = req.query;
    const q = {};

    if (search && search.trim()) {
        const rx = { $regex: esc(search.trim()), $options: 'i' };
        q.$or = [{ name: rx }, { tags: rx }];
    }
    if (category && mongoose.isValidObjectId(category)) q.category = category;
    if (stock === 'low') q.stock = { $lte: 5 };
    if (stock === 'out') q.stock = 0;
    if (status === 'active') q.isActive = true;
    if (status === 'hidden') q.isActive = false;

    const sorts = {
        newest: { createdAt: -1 },
        sold: { sold: -1, createdAt: -1 },
        'stock-asc': { stock: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        rating: { rating: -1 },
        name: { name: 1 },
    };
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const pg = Math.max(1, parseInt(page, 10) || 1);

    const [items, total] = await Promise.all([
        Product.find(q).populate('category', 'name').sort(sorts[sort] || sorts.newest).skip((pg - 1) * lim).limit(lim),
        Product.countDocuments(q),
    ]);
    res.json({ items, total, pages: Math.ceil(total / lim) });
});

exports.updateStock = asyncHandler(async (req, res) => {
    const p = await Product.findById(req.params.id);
    if (!p) throw httpError(404, 'Product not found');
    const next = req.body.add !== undefined ? p.stock + Number(req.body.add) : Number(req.body.stock);
    if (!Number.isFinite(next) || next < 0) throw httpError(400, 'Invalid stock value');
    const diff = next - p.stock;
    p.stock = next;
    await p.save();
    if (diff !== 0) await logStock(p._id, diff, diff > 0 ? 'restock' : 'adjust', req.user._id, req.body.note);
    res.json(p);
});

exports.uploadImages = asyncHandler(async (req, res) => {
    if (!req.files?.length) throw httpError(400, 'Koi image select nahi ki');
    const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer)));
    res.json({ urls: results.map((r) => r.secure_url) });
});

/* ---------------- ORDERS ---------------- */
// status: pending (Placed+Processing) | counted (revenue wale) | exact status
// date=YYYY-MM-DD | month=YYYY-MM | q=customer name/email/order id
exports.listOrders = asyncHandler(async (req, res) => {
    const { status, date, month, q, page = 1, limit = 15 } = req.query;
    const f = {};
    if (status === 'pending') f.status = { $in: ['Placed', 'Processing'] };
    else if (status === 'counted') f.status = { $nin: EXCLUDED };
    else if (status) f.status = status;

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { f.createdAt = dayRange(date); if (!status) f.status = { $nin: EXCLUDED }; }
    else if (month && /^\d{4}-\d{2}$/.test(month)) { f.createdAt = monthRange(month); if (!status) f.status = { $nin: EXCLUDED }; }

    if (q && q.trim()) {
        const rx = esc(q.trim());
        const users = await User.find({ $or: [{ name: { $regex: rx, $options: 'i' } }, { email: { $regex: rx, $options: 'i' } }] }).select('_id').limit(50);
        f.$or = [
            { user: { $in: users.map((u) => u._id) } },
            { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: rx, options: 'i' } } },
        ];
    }

    const [items, total] = await Promise.all([
        Order.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit).populate('user', 'name email'),
        Order.countDocuments(f),
    ]);
    res.json({ items, total, pages: Math.ceil(total / limit) });
});

exports.getOrder = asyncHandler(async (req, res) => {
    const o = await Order.findById(req.params.id).populate('user', 'name email phone role');
    if (!o) throw httpError(404, 'Order not found');
    res.json(o);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found');
    const { status } = req.body;
    if (!STATUSES.includes(status)) throw httpError(400, 'Invalid status');
    if (order.status === 'Cancelled') throw httpError(400, 'Cancelled order cannot be changed');
    if (order.status === 'Pending Payment') throw httpError(400, 'Payment is still pending');

    if (status === 'Cancelled' && order.stockDeducted) {
        await Product.bulkWrite(order.items.map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.qty, sold: -i.qty } } } })));
        await StockLog.insertMany(order.items.map((i) => ({ product: i.product, change: i.qty, reason: 'cancel', note: order._id.toString(), by: req.user._id })));
        order.stockDeducted = false; // Razorpay refund dashboard se manually
    }
    if (status === 'Delivered' && order.paymentMethod === 'cod' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
    }
    order.status = status;
    await order.save();
    res.json(order);
});

/* ---------------- USERS (customers + admins) ---------------- */
exports.listUsers = asyncHandler(async (req, res) => {
    const { search = '', role = '', page = 1, limit = 20 } = req.query;
    const q = {};
    if (['user', 'admin'].includes(role)) q.role = role;
    if (search.trim()) {
        const rx = { $regex: esc(search.trim()), $options: 'i' };
        q.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const [users, total, roleAgg] = await Promise.all([
        User.find(q).select('name email phone role createdAt lastLoginAt loginCount wishlist').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit).lean(),
        User.countDocuments(q),
        User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
    ]);
    const agg = await Order.aggregate([
        { $match: { user: { $in: users.map((u) => u._id) }, status: { $nin: EXCLUDED } } },
        { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$totalPrice' } } },
    ]);
    const map = Object.fromEntries(agg.map((a) => [String(a._id), a]));
    const items = users.map(({ wishlist, ...u }) => ({
        ...u,
        wishlistCount: wishlist?.length || 0,
        orders: map[String(u._id)]?.orders || 0,
        spent: map[String(u._id)]?.spent || 0,
    }));
    const counts = Object.fromEntries(roleAgg.map((r) => [r._id, r.n]));
    res.json({ items, total, pages: Math.ceil(total / limit), counts });
});

exports.getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('name email phone role wishlist createdAt lastLoginAt loginCount')
        .populate({ path: 'wishlist', select: 'name images price', options: { limit: 8 } });
    if (!user) throw httpError(404, 'User not found');
    const [orders, agg] = await Promise.all([
        Order.find({ user: user._id, status: { $ne: 'Pending Payment' } }).sort({ createdAt: -1 }).limit(50),
        Order.aggregate([{ $match: { user: user._id, status: { $nin: EXCLUDED } } }, { $group: { _id: null, spent: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }]),
    ]);
    res.json({ user, orders, stats: { orders: agg[0]?.orders || 0, spent: agg[0]?.spent || 0 } });
});

exports.createUser = asyncHandler(async (req, res) => {
    const { name, phone, password, role = 'user' } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!isName(name)) throw httpError(400, 'Valid naam daalo');
    if (!isEmail(email)) throw httpError(400, 'Valid email daalo');
    if (!isPhone(phone)) throw httpError(400, '10 digit ka valid mobile number daalo');
    const pErr = passwordError(password);
    if (pErr) throw httpError(400, pErr);
    if (!['user', 'admin'].includes(role)) throw httpError(400, 'Role sirf "user" ya "admin" ho sakta hai');
    if (await User.exists({ email })) throw httpError(409, 'Ye email pehle se registered hai');

    const u = await User.create({ name: name.trim(), email, phone, password, role });
    res.status(201).json({ user: { _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role } });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) throw httpError(400, 'Role sirf "user" ya "admin" ho sakta hai');
    if (req.params.id === req.user._id.toString()) throw httpError(400, 'Apna role khud nahi badal sakte');
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role');
    if (!user) throw httpError(404, 'User not found');
    res.json({ user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (id === req.user._id.toString()) throw httpError(400, 'Apna account yahan se delete nahi kar sakte');
    const user = await User.findById(id);
    if (!user) throw httpError(404, 'User not found');
    if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) throw httpError(400, 'Last admin delete nahi ho sakta');
    if (await Order.exists({ user: id })) throw httpError(400, 'Is user ke orders hain. Delete ki jagah role "user" rakho.');
    await user.deleteOne();
    res.json({ message: 'User delete ho gaya' });
});