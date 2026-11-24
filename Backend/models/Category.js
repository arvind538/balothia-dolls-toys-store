const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, unique: true },
        icon: { type: String, default: '🧸' },
        image: String,
    },
    { timestamps: true }
);

categorySchema.pre('validate', function () {
    if (this.name) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // next();
});

module.exports = mongoose.model('Category', categorySchema);