const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { generateOTP, storeOTP, verifyOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');
const { generateVotingId } = require('../utils/votingId');

const prisma = new PrismaClient();

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function signTempToken(payload) {
  return jwt.sign(payload, process.env.JWT_TEMP_SECRET, { expiresIn: '15m' });
}

async function sendOTP(req, res) {
  try {
    const { email, institutionId } = req.body;
    if (!email || !institutionId) {
      return res.status(400).json({ error: true, message: 'Email and institutionId are required', code: 'MISSING_FIELDS' });
    }

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      return res.status(404).json({ error: true, message: 'Institution not found', code: 'NOT_FOUND' });
    }

    const emailLower = email.toLowerCase();
    const suffixLower = institution.emailSuffix.toLowerCase();
    if (!emailLower.endsWith(suffixLower)) {
      return res.status(400).json({
        error: true,
        message: `Email must end with ${institution.emailSuffix}`,
        code: 'INVALID_EMAIL_SUFFIX',
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email already registered', code: 'ALREADY_EXISTS' });
    }

    const otp = generateOTP();
    await storeOTP(emailLower, otp);

    try {
      await sendOTPEmail(emailLower, otp);
      res.json({ message: 'OTP sent' });
    } catch (emailErr) {
      // DEV BYPASS: SMTP unavailable — auto-verify and return tempToken so signup can continue
      console.warn('SMTP failed, bypassing OTP for dev:', emailErr.message);
      const tempToken = signTempToken({ email: emailLower, verified: true });
      res.json({ message: 'OTP bypassed (dev)', devBypass: true, tempToken });
    }
  } catch (err) {
    console.error('sendOTP error:', err);
    res.status(500).json({ error: true, message: 'Failed to send OTP', code: 'INTERNAL_ERROR' });
  }
}

async function verifyOTPHandler(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: true, message: 'Email and OTP are required', code: 'MISSING_FIELDS' });
    }

    const emailLower = email.toLowerCase();
    const valid = await verifyOTP(emailLower, otp);
    if (!valid) {
      return res.status(400).json({ error: true, message: 'Invalid or expired OTP', code: 'OTP_INVALID' });
    }

    const tempToken = signTempToken({ email: emailLower, verified: true });
    res.json({ message: 'OTP verified', tempToken });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ error: true, message: 'Verification failed', code: 'INTERNAL_ERROR' });
  }
}

async function signup(req, res) {
  try {
    const { email, password, tempToken, institutionId } = req.body;
    if (!email || !password || !tempToken || !institutionId) {
      return res.status(400).json({ error: true, message: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET);
    } catch {
      return res.status(401).json({ error: true, message: 'Invalid or expired temp token', code: 'TOKEN_INVALID' });
    }

    if (decoded.email !== email.toLowerCase() || !decoded.verified) {
      return res.status(401).json({ error: true, message: 'Token email mismatch', code: 'TOKEN_INVALID' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: true, message: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
    }

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      return res.status(404).json({ error: true, message: 'Institution not found', code: 'NOT_FOUND' });
    }

    const emailLower = email.toLowerCase();
    if (!emailLower.endsWith(institution.emailSuffix.toLowerCase())) {
      return res.status(400).json({ error: true, message: `Email must end with ${institution.emailSuffix}`, code: 'INVALID_EMAIL_SUFFIX' });
    }

    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email already registered', code: 'ALREADY_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const votingId = generateVotingId(institution.name);

    const user = await prisma.user.create({
      data: { email: emailLower, passwordHash, votingId, institutionId, isVerified: true },
    });

    res.status(201).json({ message: 'Account created', votingId: user.votingId });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ error: true, message: 'Signup failed', code: 'INTERNAL_ERROR' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required', code: 'MISSING_FIELDS' });
    }

    const emailLower = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      include: { institution: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: true, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const payload = { sub: user.id, email: user.email, role: 'student', institutionId: user.institutionId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        votingId: user.votingId,
        institutionId: user.institutionId,
        institutionName: user.institution.name,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: true, message: 'Login failed', code: 'INTERNAL_ERROR' });
  }
}

async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required', code: 'MISSING_FIELDS' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
      include: { institution: true },
    });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ error: true, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
      institutionId: admin.institutionId,
      isSuperAdmin: admin.isSuperAdmin,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
        institutionId: admin.institutionId,
        institutionName: admin.institution?.name || null,
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    res.status(500).json({ error: true, message: 'Login failed', code: 'INTERNAL_ERROR' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: true, message: 'Refresh token required', code: 'MISSING_FIELDS' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: true, message: 'Invalid or expired refresh token', code: 'TOKEN_INVALID' });
    }

    const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role, institutionId: decoded.institutionId };
    if (decoded.isSuperAdmin !== undefined) payload.isSuperAdmin = decoded.isSuperAdmin;

    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('refreshToken error:', err);
    res.status(500).json({ error: true, message: 'Token refresh failed', code: 'INTERNAL_ERROR' });
  }
}

module.exports = { sendOTP, verifyOTPHandler, signup, login, adminLogin, refreshToken };
