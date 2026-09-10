const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    place: {
        type: String, // Where the product is stored
    },
    type: {
        type: String, // Category/Type of product
        default: 'General'
    },
    price: { // Spelled 'prize' as per user requirement, which might mean 'price'
        type: Number,
        required: true
    },
    stock: {
        type: String, // e.g., 'In Stock', 'Out of Stock', 'Low Stock'
        default: 'In Stock'
    },
    image: {
        type: String, // Cloudinary URL
        default: ''
    },
    about: {
        type: String, // Description of the product
        default: ''
    },

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
