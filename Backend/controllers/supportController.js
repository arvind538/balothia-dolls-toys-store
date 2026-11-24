const ContactMessage = require('../models/ContactMessage');
const { asyncHandler, httpError } = require('../middleware/error');
const { sendSupportMail } = require('../utils/mailer');

// A customer can see the messages linked to their account, or sent from the same email address.
const mine = (user) => ({ $or: [{ user: user._id }, { email: user.email }] });

const ownTicket = async (req) => {
    const t = await ContactMessage.findOne({ _id: req.params.id, ...mine(req.user) });
    if (!t) throw httpError(404, 'Message not found');
    return t;
};

exports.list = asyncHandler(async (req, res) => {
    const items = await ContactMessage.find(mine(req.user))
        .sort({ lastActivityAt: -1, createdAt: -1 })
        .select('topic message status orderId replyCount lastReplyBy lastActivityAt customerUnread createdAt')
        .lean();
    res.json(items);
});

exports.summary = asyncHandler(async (req, res) => {
    res.json({ unread: await ContactMessage.countDocuments({ ...mine(req.user), customerUnread: true }) });
});

exports.getOne = asyncHandler(async (req, res) => {
    const t = await ownTicket(req);
    if (t.customerUnread) {
        t.customerUnread = false; // the customer has now seen the latest reply
        await t.save();
    }
    res.json(t);
});

exports.reply = asyncHandler(async (req, res) => {
    const text = String(req.body.message || '').trim();
    if (text.length < 2 || text.length > 1500) throw httpError(400, 'Your reply must be between 2 and 1500 characters');

    const t = await ownTicket(req);
    if (!t.user) t.user = req.user._id;

    t.replies.push({ from: 'customer', by: req.user._id, name: req.user.name, message: text });
    t.replyCount = t.replies.length;
    t.lastReplyBy = 'customer';
    t.lastActivityAt = new Date();
    t.status = 'new'; // a customer reply reopens the conversation for the admin
    await t.save();

    sendSupportMail({
        name: t.name, email: t.email, phone: t.phone, orderId: t.orderId,
        topic: `Reply: ${t.topic}`, message: text,
    }).catch((e) => console.error('Support mail error:', e.message));

    res.status(201).json(t);
});