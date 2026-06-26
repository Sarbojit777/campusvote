const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body?.email || req.ip,
  message: { error: true, message: 'Too many OTP requests. Try again in 1 hour.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: true, message: 'Too many login attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpLimiter, loginLimiter };
