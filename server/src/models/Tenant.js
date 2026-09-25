const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'trial', 'suspended'],
        default: 'active'
    },
    settings: {
        currency: {
            type: String,
            default: 'USD'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
