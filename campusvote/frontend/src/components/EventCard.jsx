import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EventCard({ event }) {
  const nav = useNavigate();

  const statusConfig = {
    active: { label: 'LIVE NOW', border: 'border-accent-green', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]', dot: 'bg-accent-green' },
    upcoming: { label: 'UPCOMING', border: 'border-[#2a2a2a]', glow: '', dot: 'bg-[#52525b]' },
    closed: { label: 'CLOSED', border: 'border-[#2a2a2a]', glow: '', dot: 'bg-[#52525b]' },
    results_published: { label: 'RESULTS', border: 'border-accent-amber', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]', dot: 'bg-accent-amber' },
  };

  const cfg = event.hasVoted && event.status !== 'results_published'
    ? { label: 'YOU VOTED', border: 'border-accent-blue', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', dot: 'bg-accent-blue' }
    : statusConfig[event.status] || statusConfig.closed;

  return (
    <motion.div
      className={`card cursor-pointer ${cfg.border} ${cfg.glow} flex flex-col gap-3`}
      whileHover={{ borderColor: '#3a3a3a', y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => nav(`/dashboard/events/${event.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className="label-caps">{cfg.label}</span>
        </div>
        {event.status === 'active' && !event.hasVoted && (
          <span className="text-xs font-medium text-accent-green">VOTE →</span>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-white leading-snug">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-[#a1a1aa] mt-1 line-clamp-1">{event.description}</p>
        )}
      </div>

      {event.status === 'active' && (
        <div>
          <p className="text-xs text-[#52525b] mb-2">Closes: {formatDateTime(event.endsAt)}</p>
          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-accent-green transition-all"
              style={{ width: `${Math.min(event.participationPercent || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-[#52525b] mt-1">{event.participationPercent || 0}% participated</p>
        </div>
      )}

      {event.status === 'upcoming' && (
        <p className="text-xs text-[#52525b]">Opens: {formatDate(event.startsAt)}</p>
      )}

      {(event.status === 'closed' || (event.hasVoted && event.status !== 'results_published')) && (
        <p className="text-xs text-[#52525b]">Results pending...</p>
      )}

      {event.status === 'results_published' && event.winner && (
        <div className="mt-1">
          <p className="text-sm font-semibold text-white">{event.winner?.name || '—'}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-accent-amber"
                style={{ width: `${event.winner?.votePercent || 0}%` }}
              />
            </div>
            <span className="text-xs text-accent-amber font-medium">{event.winner?.votePercent || 0}% WINNER</span>
          </div>
          <p className="text-xs text-[#52525b] mt-1">{event.totalVotes?.toLocaleString()} votes</p>
        </div>
      )}
    </motion.div>
  );
}
