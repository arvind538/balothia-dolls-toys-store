const ContactMessage = require('../models/ContactMessage');

exports.run = async () => {
    await ContactMessage.updateMany(
        { lastActivityAt: { $exists: false } },
        [{ $set: { lastActivityAt: '$createdAt' } }]
    );
};