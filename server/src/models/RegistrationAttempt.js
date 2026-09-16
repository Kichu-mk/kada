const mongoose = require('mongoose');

const registrationAttemptSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    shopName: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 1800 }
});

module.exports = mongoose.model('RegistrationAttempt', registrationAttemptSchema);
