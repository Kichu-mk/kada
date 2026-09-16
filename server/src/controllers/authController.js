const crypto = require('crypto');
const User = require('../models/User');
const Shop = require('../models/Shop');
const RegistrationAttempt = require('../models/RegistrationAttempt');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendRegistrationOtp, sendPasswordResetEmail } = require('../services/emailService');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const userResponse = (user, shop) => ({
    _id: user.id,
    username: user.username,
    email: user.email,
    shop,
    token: generateToken(user._id)
});

const registerUser = async (req, res) => {
    try {
        const { username, password, email, shopName, location, description } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!username || !password || !normalizedEmail || !shopName) {
            return res.status(400).json({ message: 'Username, email, password, and shop name are required' });
        }
        if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

        const [userExists, emailExists] = await Promise.all([
            User.findOne({ username }),
            User.findOne({ email: normalizedEmail })
        ]);
        if (userExists) return res.status(409).json({ message: 'Username is already in use' });
        if (emailExists) return res.status(409).json({ message: 'Email is already in use' });

        const otp = generateOtp();
        const attempt = await RegistrationAttempt.findOneAndUpdate(
            { email: normalizedEmail },
            {
                username, email: normalizedEmail, password: await bcrypt.hash(password, 10),
                shopName, location, description, otpHash: hashValue(otp),
                otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
                otpAttempts: 0, lastOtpSentAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await sendRegistrationOtp(normalizedEmail, otp);
        res.status(201).json({ message: 'Verification code sent', registrationId: attempt.id });
    } catch (error) {
        console.error('Registration email error:', error.code || error.name, error.message);
        res.status(500).json({ message: error.message === 'SMTP configuration is missing' ? error.message : 'Server error' });
    }
};

const verifyRegistrationOtp = async (req, res) => {
    try {
        const { registrationId, otp } = req.body;
        const attempt = await RegistrationAttempt.findById(registrationId);
        if (!attempt) return res.status(400).json({ message: 'Registration attempt has expired' });
        if (attempt.otpAttempts >= 5) return res.status(429).json({ message: 'Too many verification attempts' });
        if (attempt.otpExpiresAt < new Date()) return res.status(400).json({ message: 'Verification code has expired' });

        attempt.otpAttempts += 1;
        if (hashValue(String(otp || '')) !== attempt.otpHash) {
            await attempt.save();
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        const user = await User.create({
            username: attempt.username, email: attempt.email, password: attempt.password
        });
        const shop = await Shop.create({
            name: attempt.shopName, owner: user._id,
            location: attempt.location, description: attempt.description
        });
        user.shop = shop._id;
        await user.save();
        await RegistrationAttempt.findByIdAndDelete(attempt._id);
        res.status(201).json(userResponse(user, shop));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resendRegistrationOtp = async (req, res) => {
    try {
        const attempt = await RegistrationAttempt.findById(req.body.registrationId);
        if (!attempt) return res.status(400).json({ message: 'Registration attempt has expired' });
        if (Date.now() - attempt.lastOtpSentAt.getTime() < RESEND_COOLDOWN_MS) {
            return res.status(429).json({ message: 'Please wait before requesting another code' });
        }

        const otp = generateOtp();
        attempt.otpHash = hashValue(otp);
        attempt.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
        attempt.otpAttempts = 0;
        attempt.lastOtpSentAt = new Date();
        await attempt.save();
        await sendRegistrationOtp(attempt.email, otp);
        res.json({ message: 'Verification code sent' });
    } catch (error) {
        console.error('OTP resend email error:', error.code || error.name, error.message);
        res.status(500).json({ message: error.message === 'SMTP configuration is missing' ? error.message : 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }).populate('shop');
        if (user && await bcrypt.compare(password, user.password)) {
            return res.json(userResponse(user, user.shop));
        }
        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const user = await User.findOne({ email });
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            user.passwordResetTokenHash = hashValue(token);
            user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
            await user.save();
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            await sendPasswordResetEmail(email, `${clientUrl}/reset-password/${token}`);
        }
        res.json({ message: 'If an account exists for this email, a password reset link has been sent' });
    } catch (error) {
        console.error('Password reset email error:', error.code || error.name, error.message);
        res.status(500).json({ message: error.message === 'SMTP configuration is missing' ? error.message : 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
        if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

        const user = await User.findOne({
            passwordResetTokenHash: hashValue(req.params.token),
            passwordResetExpiresAt: { $gt: new Date() }
        }).select('+passwordResetTokenHash +passwordResetExpiresAt');
        if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpiresAt = undefined;
        await user.save();
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email, shopName, location, description } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!username || !normalizedEmail || !shopName) {
            return res.status(400).json({ message: 'Username, email, and shop name are required' });
        }

        const [usernameExists, emailExists] = await Promise.all([
            User.findOne({ username, _id: { $ne: req.user._id } }),
            User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } })
        ]);
        if (usernameExists) return res.status(409).json({ message: 'Username is already in use' });
        if (emailExists) return res.status(409).json({ message: 'Email is already in use' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.username = username.trim();
        user.email = normalizedEmail;
        await user.save();

        const shop = await Shop.findOneAndUpdate(
            { owner: user._id },
            { name: shopName.trim(), location: location?.trim() || '', description: description?.trim() || '' },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.json(userResponse(user, shop));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const user = await User.findById(req.user._id);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser, verifyRegistrationOtp, resendRegistrationOtp,
    loginUser, forgotPassword, resetPassword, updateProfile, changePassword
};
