const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
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

module.exports = mongoose.model('History', historySchema);
