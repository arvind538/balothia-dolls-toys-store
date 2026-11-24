const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        ageGroup: { type: String, enum: ['0-3', '3-6', '6-9', '9-12', '12+'], default: '6-9' },
        price: { type: Number, required: true, min: 0 },
        mrp: { type: Number, required: true, min: 0 },
        images: { type: [String], default: [] },
        stock: { type: Number, default: 0, min: 0 },
        sold: { type: Number, default: 0 },
        rating: { type: Number, default: 4 },
        numReviews: { type: Number, default: 0 },
        tags: [String],
        isFeatured: { type: Boolean, default: false },
        isBestSeller: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

productSchema.virtual('discount').get(function () {
    return this.mrp > this.price ? Math.round((1 - this.price / this.mrp) * 100) : 0;
});

module.exports = mongoose.model('Product', productSchema);