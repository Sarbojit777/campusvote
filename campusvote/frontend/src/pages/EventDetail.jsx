import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosInstance';
import CandidateCard from '../components/CandidateCard';
import VoteConfirmModal from '../components/VoteConfirmModal';
import SkeletonCard from '../components/ui/SkeletonCard';

function Countdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) { setTimeLeft('Closed'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s remaining`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return <span className="text-accent-green text-sm font-mono">{timeLeft}</span>;
}

export default function EventDetail() {
  const { eventId } = useParams();
  const nav = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.get(`/events/${eventId}`)
      .then(({ data }) => setEvent(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleConfirmVote = async () => {
    const { data } = await api.post(`/events/${eventId}/vote`, { candidateId: confirming.id });
    setReceipt(data.receipt);
    setEvent((e) => ({ ...e, hasVoted: true, votedCandidateId: confirming.id }));
    await new Promise((r) => setTimeout(r, 1500));
    setConfirming(null);
    nav('/dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 max-w-4xl mx-auto">
      <div className="shimmer h-6 w-32 rounded mb-8" />
      <div className="shimmer h-8 w-64 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={() => nav('/dashboard')} className="mt-4 text-sm text-[#a1a1aa] hover:text-white">← Back to Dashboard</button>
      </div>
    </div>
  );

  const isActive = event.status === 'active';
  const isPublished = event.status === 'results_published';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => nav('/dashboard')}
          className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-accent-green' : isPublished ? 'bg-accent-amber' : 'bg-[#52525b]'
            }`} />
            <span className="label-caps">{
              isActive ? 'Live Now' : isPublished ? 'Results Published' : event.status
            }</span>
          </div>
          <h1 className="text-3xl font-semibold text-white">{event.title}</h1>
          {event.description && <p className="text-[#a1a1aa] mt-2">{event.description}</p>}
          {isActive && (
            <div className="mt-3">
              <Countdown endsAt={event.endsAt} />
            </div>
          )}
          <div className="flex gap-4 mt-3">
            <span className="text-xs text-[#52525b]">
              {event.totalVotes?.toLocaleString()} vote{event.totalVotes !== 1 ? 's' : ''} cast
            </span>
          </div>
        </div>

        {/* Already Voted Banner */}
        {event.hasVoted && (
          <motion.div
            className="mb-6 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl text-accent-blue text-sm flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>✓</span>
            <span>You have already cast your vote in this election.</span>
          </motion.div>
        )}

        {/* Results Winner */}
        {isPublished && event.winner && (
          <motion.div
            className="mb-8 card border-accent-amber"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="label-caps mb-3">Winner</p>
            <div className="flex items-center gap-4">
              {event.winner.photoUrl ? (
                <img src={event.winner.photoUrl} alt={event.winner.name} className="w-16 h-16 rounded-xl object-cover border border-[#2a2a2a]" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-xl font-bold text-[#a1a1aa] border border-[#2a2a2a]">
                  {event.winner.name[0]}
                </div>
              )}
              <div>
                <p className="text-xl font-semibold text-white">{event.winner.name}</p>
                <p className="text-accent-amber text-sm mt-1">{event.winner.votePercent}% · {event.winner.voteCount?.toLocaleString()} votes</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates */}
        {event.candidates?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.candidates.map((candidate, i) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CandidateCard
                  candidate={candidate}
                  onVote={isActive && !event.hasVoted ? setConfirming : null}
                  disabled={!isActive || event.hasVoted}
                  isVoted={event.votedCandidateId === candidate.id}
                />
                {isPublished && candidate.voteCount !== undefined && (
                  <div className="mt-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${candidate.isWinner ? 'bg-accent-amber' : 'bg-[#3a3a3a]'}`}
                          style={{ width: `${candidate.votePercent || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#52525b]">{candidate.votePercent || 0}%</span>
                    </div>
                    <p className="text-xs text-[#52525b] mt-1">{candidate.voteCount?.toLocaleString()} votes</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#a1a1aa]">No candidates added yet.</p>
          </div>
        )}
      </div>

      {confirming && (
        <VoteConfirmModal
          candidate={confirming}
          onConfirm={handleConfirmVote}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
