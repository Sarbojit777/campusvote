import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useInstitutions } from '../hooks/useInstitutions';
import Spinner from '../components/ui/Spinner';

export default function Login() {
  const [params] = useSearchParams();
  const institutionId = params.get('institution');
  const { institutions } = useInstitutions();
  const [institution, setInstitution] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (institutionId && institutions.length) {
      const inst = institutions.find((i) => i.id === institutionId);
      setInstitution(inst || null);
    }
  }, [institutionId, institutions]);

  const validateEmail = (val) => {
    if (!institution) return;
    if (val && !val.toLowerCase().endsWith(institution.emailSuffix.toLowerCase())) {
      setEmailError(`Email must end with ${institution.emailSuffix}`);
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) return;
    setError('');
    setLoading(true);
    try {
      await loginStudent(email, password);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-light text-white">CampusVote</Link>
        </div>

        <div className="card">
          {institution && (
            <div className="mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-sm text-[#a1a1aa]">{institution.name}</span>
            </div>
          )}

          <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                className={`input-field ${emailError ? 'border-red-500/50' : ''}`}
                placeholder={institution ? `yourname${institution.emailSuffix}` : 'your@college.edu'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                required
              />
              {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
            </div>

            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link
              to={`/signup${institutionId ? `?institution=${institutionId}` : ''}`}
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              New here? Create account
            </Link>
            <br />
            <Link to="/admin/login" className="text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
