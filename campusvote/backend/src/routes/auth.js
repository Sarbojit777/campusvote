const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTPHandler, signup, login, adminLogin, refreshToken } = require('../controllers/authController');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', otpLimiter, sendOTP);
router.post('/verify-otp', verifyOTPHandler);
router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/refresh', refreshToken);

module.exports = router;
