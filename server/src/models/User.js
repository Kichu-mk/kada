const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        default: null,
        index: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        default: null
    },
    passwordResetTokenHash: {
        type: String,
        select: false
    },
    passwordResetExpiresAt: {
        type: Date,
        select: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
