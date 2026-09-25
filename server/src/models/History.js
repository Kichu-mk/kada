const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
        index: true
    },
    action: {
        type: String, // e.g., 'Created', 'Updated', 'Stock Added', 'Delivered'
        required: true
    },
    changes: {
        type: mongoose.Schema.Types.Mixed, // Object storing what changed (e.g. { previousQuantity: 10, newQuantity: 15 })
    },
    date: {
        type: Date,
        default: Date.now
    }
});

historySchema.index({ tenantId: 1, shop: 1, date: -1 });
historySchema.index({ tenantId: 1, product: 1, shop: 1, action: 1, date: -1 });
historySchema.index({ tenantId: 1, shop: 1, action: 1, date: -1 });

module.exports = mongoose.model('History', historySchema);
