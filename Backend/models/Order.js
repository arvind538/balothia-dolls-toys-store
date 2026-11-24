const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                name: String,
                image: String,
                price: Number,
                qty: Number,
            },
        ],
        shippingAddress: {
            name: { type: String, required: true },
            phone: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
        },
        paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        itemsPrice: Number,
        shippingPrice: Number,
        gstIncluded: Number,
        totalPrice: Number,
        isPaid: { type: Boolean, default: false },
        paidAt: Date,
        stockDeducted: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ['Pending Payment', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Placed',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);