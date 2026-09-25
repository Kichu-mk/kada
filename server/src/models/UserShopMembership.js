const mongoose = require('mongoose');

const userShopMembershipSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'manager', 'staff', 'viewer'],
        default: 'staff'
    },
    status: {
        type: String,
        enum: ['active', 'invited', 'disabled'],
        default: 'active'
    }
}, { timestamps: true });

userShopMembershipSchema.index({ tenantId: 1, shopId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserShopMembership', userShopMembershipSchema);
