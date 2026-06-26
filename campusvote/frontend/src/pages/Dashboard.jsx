import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import api from '../api/axiosInstance';

function Avatar({ name }) {
  const initials = name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-sm font-medium text-white">
      {initials}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api.get('/events')
      .then(({ data }) => {
        // Fetch winner info for published results
        const enriched = data.map(async (event) => {
          if (event.status === 'results_published') {
            try {
              const { data: detail } = await api.get(`/events/${event.id}`);
              return { ...event, winner: detail.winner, totalVotes: detail.totalVotes };
            } catch {
              return event;
            }
          }
          return event;
        });
        Promise.all(enriched).then(setEvents);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); nav('/'); };

  const emailInitial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">CampusVote</span>
            {user?.institutionName && (
              <>
                <span className="text-[#2a2a2a]">/</span>
                <span className="text-sm text-[#a1a1aa]">{user.institutionName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-[#52525b]">{user?.email}</p>
              <p className="text-xs font-mono text-[#a1a1aa]">{user?.votingId}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-sm font-medium text-white">
              {emailInitial}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Elections</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">Active and upcoming elections for your institution</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">🗳️</div>
            <p className="text-[#a1a1aa] text-lg font-medium">No elections scheduled yet</p>
            <p className="text-[#52525b] text-sm mt-2">Check back later for upcoming elections</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
