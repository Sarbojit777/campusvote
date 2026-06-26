import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Spinner from './ui/Spinner';

function Initials({ name }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-2xl font-bold text-[#a1a1aa] border border-[#2a2a2a]">
      {initials.toUpperCase()}
    </div>
  );
}

export default function VoteConfirmModal({ candidate, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setSuccess(true);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget && !loading && !success) onCancel(); }}
      >
        <motion.div
          className="card w-full max-w-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green text-3xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                ✓
              </motion.div>
              <p className="text-white font-semibold text-lg">Vote Cast!</p>
              <p className="text-[#a1a1aa] text-sm text-center">Your vote has been securely recorded.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 mb-6">
                {candidate.photoUrl ? (
                  <img src={candidate.photoUrl} alt={candidate.name} className="w-20 h-20 rounded-xl object-cover border border-[#2a2a2a]" />
                ) : (
                  <Initials name={candidate.name} />
                )}
                <div className="text-center">
                  <h3 className="font-semibold text-white">{candidate.name}</h3>
                  <p className="label-caps mt-0.5">{candidate.position}</p>
                </div>
              </div>
              <p className="text-[#a1a1aa] text-sm text-center mb-6">
                You are about to cast your vote for <span className="text-white font-medium">{candidate.name}</span>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button className="btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
                <button className="btn-primary flex items-center justify-center gap-2" onClick={handleConfirm} disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Confirm Vote'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
