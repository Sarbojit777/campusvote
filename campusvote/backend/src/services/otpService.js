const crypto = require('crypto');
const redis = require('../utils/redisClient');

const OTP_TTL = 600; // 10 minutes

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function storeOTP(email, otp) {
  const key = `otp:${email}`;
  const hashed = hashOTP(otp);
  await redis.set(key, hashed, 'EX', OTP_TTL);
}

async function verifyOTP(email, otp) {
  const key = `otp:${email}`;
  const stored = await redis.get(key);
  if (!stored) return false;
  const hashed = hashOTP(otp);
  const valid = hashed === stored;
  if (valid) await redis.del(key);
  return valid;
}

module.exports = { generateOTP, storeOTP, verifyOTP };
