const express = require('express');
const router = express.Router();
const {
    registerUser, verifyRegistrationOtp, resendRegistrationOtp,
    loginUser, forgotPassword, resetPassword, updateProfile, changePassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', registerUser);
router.post('/register/verify', verifyRegistrationOtp);
router.post('/register/resend-otp', resendRegistrationOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
