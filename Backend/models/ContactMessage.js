const mongoose = require('mongoose');

// One reply inside a conversation.
const replySchema = new mongoose.Schema(
    {
        from: { type: String, enum: ['admin', 'customer'], required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const contactMessageSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set when the customer was signed in
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: String,
        orderId: String,
        topic: { type: String, required: true },
        message: { type: String, required: true, maxlength: 1500 },
        status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },

        replies: [replySchema],
        replyCount: { type: Number, default: 0 },
        lastReplyBy: { type: String, enum: ['admin', 'customer'] },
        lastActivityAt: { type: Date, default: Date.now },
        customerUnread: { type: Boolean, default: false }, // true when the admin replied and the customer has not opened it yet
    },
    { timestamps: true }
);

contactMessageSchema.index({ user: 1, lastActivityAt: -1 });
contactMessageSchema.index({ email: 1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);