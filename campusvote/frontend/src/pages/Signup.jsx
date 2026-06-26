import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import OTPInput from '../components/OTPInput';
import { useInstitutions } from '../hooks/useInstitutions';
import api from '../api/axiosInstance';
import Spinner from '../components/ui/Spinner';

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-[#2a2a2a]'}`} />
        ))}
      </div>
      {password && <p className="text-xs text-[#a1a1aa] mt-1">{labels[strength]}</p>}
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
            step < current ? 'bg-white text-black' : step === current ? 'bg-white text-black' : 'bg-[#1a1a1a] text-[#52525b] border border-[#2a2a2a]'
          }`}>
            {step < current ? '✓' : step}
          </div>
          {step < 3 && <div className={`h-px flex-1 w-8 transition-all ${step < current ? 'bg-white' : 'bg-[#2a2a2a]'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function Signup() {
  const [params] = useSearchParams();
  const institutionId = params.get('institution');
  const { institutions } = useInstitutions();
  const [institution, setInstitution] = useState(null);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [votingId, setVotingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const nav = useNavigate();

  useEffect(() => {
    if (institutionId && institutions.length) {
      const inst = institutions.find((i) => i.id === institutionId);
      setInstitution(inst || null);
    }
  }, [institutionId, institutions]);

  useEffect(() => {
    if (step !== 2) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    const resendTimer = setTimeout(() => setCanResend(true), 60000);
    return () => { clearInterval(timer); clearTimeout(resendTimer); };
  }, [step]);

  useEffect(() => {
    if (canResend) return;
    if (step !== 2) return;
    const timer = setInterval(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, canResend]);

  useEffect(() => {
    if (step !== 3 || !votingId) return;
    const timer = setTimeout(() => nav(`/login${institutionId ? `?institution=${institutionId}` : ''}`), 5000);
    return () => clearTimeout(timer);
  }, [step, votingId]);

  const validateEmail = (val) => {
    if (!institution) { setEmailError('Please select an institution first'); return false; }
    if (!val.toLowerCase().endsWith(institution.emailSuffix.toLowerCase())) {
      setEmailError(`Email must end with ${institution.emailSuffix}`);
      return false;
    }
    setEmailError('');
    return true;
  };

  const sendOTP = async () => {
    if (!validateEmail(email)) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email, institutionId: institution.id });
      if (data.devBypass && data.tempToken) {
        // SMTP unavailable — skip OTP step, go straight to password creation
        setTempToken(data.tempToken);
        setStep(3);
      } else {
        setStep(2);
        setCountdown(600);
        setCanResend(false);
        setResendCountdown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setTempToken(data.tempToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', { email, password, tempToken, institutionId: institution.id });
      setVotingId(data.votingId);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-light text-white">CampusVote</Link>
        </div>

        <div className="card">
          <StepIndicator current={votingId ? 4 : step} />

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-xl font-semibold text-white mb-1">Create account</h2>
                <p className="text-sm text-[#a1a1aa] mb-6">Enter your college email to get started</p>

                {institution && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-green" />
                    <span className="text-sm text-[#a1a1aa]">{institution.name}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      className={`input-field ${emailError ? 'border-red-500/50' : ''}`}
                      placeholder={institution ? `yourname${institution.emailSuffix}` : 'your@college.edu'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => validateEmail(email)}
                    />
                    {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                  </div>
                  <button className="btn-primary flex items-center justify-center gap-2" onClick={sendOTP} disabled={loading || !email}>
                    {loading ? <Spinner size="sm" /> : 'Send OTP'}
                  </button>
                </div>

                <p className="text-center text-sm text-[#52525b] mt-6">
                  Already have an account?{' '}
                  <Link to={`/login${institutionId ? `?institution=${institutionId}` : ''}`} className="text-[#a1a1aa] hover:text-white">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-xl font-semibold text-white mb-1">Enter OTP</h2>
                <p className="text-sm text-[#a1a1aa] mb-6">
                  Sent to <span className="text-white">{email}</span>
                </p>

                <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                <div className="text-center mt-4 space-y-2">
                  <p className="text-sm text-[#52525b]">
                    {countdown > 0 ? `Expires in ${fmtTime(countdown)}` : 'OTP expired'}
                  </p>
                  {canResend ? (
                    <button className="text-sm text-[#a1a1aa] hover:text-white" onClick={sendOTP}>Resend OTP</button>
                  ) : (
                    <p className="text-xs text-[#52525b]">Resend in {resendCountdown}s</p>
                  )}
                </div>

                <button className="btn-primary mt-6 flex items-center justify-center gap-2" onClick={verifyOTP} disabled={loading || otp.length < 6}>
                  {loading ? <Spinner size="sm" /> : 'Verify OTP'}
                </button>
              </motion.div>
            )}

            {step === 3 && !votingId && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-xl font-semibold text-white mb-1">Set password</h2>
                <p className="text-sm text-[#a1a1aa] mb-6">Choose a strong password for your account</p>

                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {password && <PasswordStrength password={password} />}
                  </div>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button className="btn-primary flex items-center justify-center gap-2" onClick={createAccount} disabled={loading || !password || !confirmPassword}>
                    {loading ? <Spinner size="sm" /> : 'Create Account'}
                  </button>
                </div>
              </motion.div>
            )}

            {votingId && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green text-3xl mx-auto">✓</div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Account Created!</h2>
                    <p className="text-sm text-[#a1a1aa] mt-1">Keep your Voting ID safe</p>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <p className="label-caps mb-2">Your Voting ID</p>
                    <p className="text-lg font-mono font-bold text-white tracking-wider">{votingId}</p>
                    <p className="text-xs text-[#52525b] mt-2">Your vote has been securely recorded. Keep this as proof.</p>
                  </div>
                  <p className="text-xs text-[#52525b]">Redirecting to login in 5 seconds...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
