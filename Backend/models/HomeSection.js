const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 60 },
        source: {
            type: String,
            enum: ['category', 'ageGroup', 'bestSeller', 'featured', 'newest', 'offers'],
            required: true,
        },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        ageGroup: { type: String, enum: ['0-3', '3-6', '6-9', '9-12', '12+'] },
        limit: { type: Number, default: 4, min: 1, max: 12 },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('HomeSection', homeSectionSchema);