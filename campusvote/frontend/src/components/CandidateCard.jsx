import { motion } from 'framer-motion';

function Initials({ name }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-[120px] h-[120px] rounded-xl bg-[#1a1a1a] flex items-center justify-center text-2xl font-bold text-[#a1a1aa] border border-[#2a2a2a]">
      {initials.toUpperCase()}
    </div>
  );
}

export default function CandidateCard({ candidate, onVote, disabled, isVoted }) {
  return (
    <motion.div
      className={`card flex flex-col items-center text-center gap-3 ${isVoted ? 'border-accent-blue' : ''}`}
      whileHover={!disabled ? { y: -2 } : {}}
    >
      {candidate.photoUrl ? (
        <img
          src={candidate.photoUrl}
          alt={candidate.name}
          className="w-[120px] h-[120px] rounded-xl object-cover border border-[#2a2a2a]"
        />
      ) : (
        <Initials name={candidate.name} />
      )}

      <div className="w-full">
        <h3 className="font-semibold text-white">{candidate.name}</h3>
        <p className="label-caps mt-1">{candidate.position}</p>
        {candidate.bio && (
          <p className="text-xs text-[#a1a1aa] mt-2 line-clamp-3">{candidate.bio}</p>
        )}
      </div>

      {!disabled && onVote && (
        <motion.button
          className="mt-auto w-full py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-medium text-white transition-all hover:bg-white hover:text-black hover:border-white"
          whileTap={{ scale: 0.97 }}
          onClick={() => onVote(candidate)}
        >
          Cast Vote
        </motion.button>
      )}

      {isVoted && (
        <div className="mt-auto w-full py-2.5 rounded-xl border border-accent-blue text-sm font-medium text-accent-blue text-center">
          ✓ Your Vote
        </div>
      )}

      {disabled && !isVoted && onVote && (
        <div className="mt-auto w-full py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-medium text-[#52525b] text-center">
          Cast Vote
        </div>
      )}
    </motion.div>
  );
}
