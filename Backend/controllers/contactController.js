const ContactMessage = require('../models/ContactMessage');
const { asyncHandler, httpError } = require('../middleware/error');
const { isEmail, isPhone, isName } = require('../utils/validate');
const { sendSupportMail } = require('../utils/mailer');

const TOPICS = ['Order status', 'Return or refund', 'Cancellation', 'Product question', 'Payment issue', 'Feedback', 'Other'];

exports.submit = asyncHandler(async (req, res) => {
    const b = req.body || {};

    // Honeypot: real visitors never fill this hidden field, but spam bots do.
    if (b.website) return res.status(201).json({ message: 'Thank you. Your message has been sent.' });

    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').trim();
    const orderId = String(b.orderId || '').trim().slice(0, 24);
    const topic = String(b.topic || '').trim();
    const message = String(b.message || '').trim();

    if (!isName(name)) throw httpError(400, 'Please enter your full name');
    if (!isEmail(email)) throw httpError(400, 'Please enter a valid email address');
    if (phone && !isPhone(phone)) throw httpError(400, 'Please enter a valid 10-digit mobile number');
    if (!TOPICS.includes(topic)) throw httpError(400, 'Please choose a topic');
    if (message.length < 10 || message.length > 1500) throw httpError(400, 'Your message must be between 10 and 1500 characters');

    const saved = await ContactMessage.create({
        user: req.user?._id, // linked to the account when the customer is signed in
        name, email, phone, orderId, topic, message,
        lastActivityAt: new Date(),
    });

    // The message is already saved, so an email problem should not fail the request.
    sendSupportMail({ name, email, phone, orderId, topic, message }).catch((e) => console.error('Contact mail error:', e.message));

    res.status(201).json({ message: 'Thank you. Your message has been sent.', id: saved._id });
});









// const ContactMessage = require('../models/ContactMessage');
// const { asyncHandler, httpError } = require('../middleware/error');
// const { isEmail, isPhone, isName } = require('../utils/validate');
// const { sendSupportMail } = require('../utils/mailer');

// const TOPICS = ['Order status', 'Return or refund', 'Cancellation', 'Product question', 'Payment issue', 'Feedback', 'Other'];

// exports.submit = asyncHandler(async (req, res) => {
//     const b = req.body || {};

//     // Honeypot: real visitors never fill this hidden field, but spam bots do.
//     if (b.website) return res.status(201).json({ message: 'Thank you. Your message has been sent.' });

//     const name = String(b.name || '').trim();
//     const email = String(b.email || '').trim().toLowerCase();
//     const phone = String(b.phone || '').trim();
//     const orderId = String(b.orderId || '').trim().slice(0, 24);
//     const topic = String(b.topic || '').trim();
//     const message = String(b.message || '').trim();

//     if (!isName(name)) throw httpError(400, 'Please enter your full name');
//     if (!isEmail(email)) throw httpError(400, 'Please enter a valid email address');
//     if (phone && !isPhone(phone)) throw httpError(400, 'Please enter a valid 10-digit mobile number');
//     if (!TOPICS.includes(topic)) throw httpError(400, 'Please choose a topic');
//     if (message.length < 10 || message.length > 1500) throw httpError(400, 'Your message must be between 10 and 1500 characters');

//     const saved = await ContactMessage.create({ name, email, phone, orderId, topic, message });

//     // The message is already saved, so an email problem should not fail the request.
//     sendSupportMail({ name, email, phone, orderId, topic, message }).catch((e) => console.error('Contact mail error:', e.message));

//     res.status(201).json({ message: 'Thank you. Your message has been sent.', id: saved._id });
// });