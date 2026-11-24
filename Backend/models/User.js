const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6, select: false },
        phone: String,
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        lastLoginAt: Date,
        loginCount: { type: Number, default: 0 },

        resetOtpHash: { type: String, select: false },
        resetOtpExpires: { type: Date, select: false },
        resetOtpSentAt: { type: Date, select: false },
        resetOtpAttempts: { type: Number, default: 0, select: false },
        resetTokenHash: { type: String, select: false },
        resetTokenExpires: { type: Date, select: false },
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);