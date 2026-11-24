const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');
const { asyncHandler, httpError } = require('../middleware/error');
const { sendReplyMail } = require('../utils/mailer');

const STATUSES = ['new', 'read', 'resolved'];
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finds the customer account (if any) so the admin can open the profile in one click.
const withCustomer = async (messages) => {
    const users = await User.find({ email: { $in: messages.map((m) => m.email) } }).select('_id email').lean();
    const byEmail = Object.fromEntries(users.map((u) => [u.email, String(u._id)]));
    return messages.map((m) => ({ ...m, userId: m.user ? String(m.user) : byEmail[m.email] || null }));
};

exports.list = asyncHandler(async (req, res) => {
    const { status, topic, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (STATUSES.includes(status)) filter.status = status;
    if (topic) filter.topic = topic;
    if (q && q.trim()) {
        const rx = { $regex: esc(q.trim()), $options: 'i' };
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { topic: rx }, { message: rx }, { orderId: rx }];
    }

    const lim = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const pg = Math.max(1, parseInt(page, 10) || 1);

    const [items, total, grouped] = await Promise.all([
        ContactMessage.find(filter)
            .select('-replies')
            .sort({ lastActivityAt: -1, createdAt: -1 })
            .skip((pg - 1) * lim)
            .limit(lim)
            .lean(),
        ContactMessage.countDocuments(filter),
        ContactMessage.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ]);

    const c = Object.fromEntries(grouped.map((g) => [g._id, g.n]));
    res.json({
        items: await withCustomer(items),
        total,
        pages: Math.ceil(total / lim),
        counts: { new: c.new || 0, read: c.read || 0, resolved: c.resolved || 0, all: (c.new || 0) + (c.read || 0) + (c.resolved || 0) },
    });
});

// Small summary used by the sidebar badge and the dashboard card.
exports.summary = asyncHandler(async (req, res) => {
    const [unread, total, recent] = await Promise.all([
        ContactMessage.countDocuments({ status: 'new' }),
        ContactMessage.countDocuments(),
        ContactMessage.find()
            .sort({ lastActivityAt: -1, createdAt: -1 })
            .limit(5)
            .select('name email topic message status lastReplyBy lastActivityAt createdAt')
            .lean(),
    ]);
    res.json({ unread, total, recent });
});

exports.getOne = asyncHandler(async (req, res) => {
    const m = await ContactMessage.findById(req.params.id).lean();
    if (!m) throw httpError(404, 'Message not found');
    res.json((await withCustomer([m]))[0]);
});

exports.update = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!STATUSES.includes(status)) throw httpError(400, 'Invalid status');
    const m = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!m) throw httpError(404, 'Message not found');
    res.json(m);
});

// The admin replies. The reply is saved in the conversation and emailed to the customer.
exports.reply = asyncHandler(async (req, res) => {
    const text = String(req.body.message || '').trim();
    if (text.length < 2 || text.length > 2000) throw httpError(400, 'Your reply must be between 2 and 2000 characters');

    const ticket = await ContactMessage.findById(req.params.id);
    if (!ticket) throw httpError(404, 'Message not found');

    ticket.replies.push({ from: 'admin', by: req.user._id, name: req.user.name, message: text });
    ticket.replyCount = ticket.replies.length;
    ticket.lastReplyBy = 'admin';
    ticket.lastActivityAt = new Date();
    ticket.customerUnread = true;

    if (req.body.resolve) ticket.status = 'resolved';
    else if (ticket.status !== 'read') ticket.status = 'read';
    await ticket.save();

    // The reply is already saved, so an email problem should not fail the request.
    let emailed = false;
    try {
        const r = await sendReplyMail({
            to: ticket.email, name: ticket.name, topic: ticket.topic, original: ticket.message,
            reply: text, adminName: req.user.name, id: ticket._id,
        });
        emailed = r.sent;
    } catch (e) {
        console.error('Reply mail error:', e.message);
    }

    const message = (await withCustomer([ticket.toObject()]))[0];
    res.status(201).json({ message, emailed });
});

exports.remove = asyncHandler(async (req, res) => {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
});