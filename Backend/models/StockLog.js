const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        change: { type: Number, required: true }, // +ve = stock in, -ve = stock out
        reason: { type: String, enum: ['restock', 'order', 'cancel', 'adjust'], required: true },
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('StockLog', stockLogSchema);