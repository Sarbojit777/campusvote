import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import InstitutionSelect from '../components/InstitutionSelect';
import { useInstitutions } from '../hooks/useInstitutions';

export default function Landing() {
  const { institutions, loading } = useInstitutions();
  const [selected, setSelected] = useState(null);
  const nav = useNavigate();

  const handleContinue = () => {
    if (selected) nav(`/login?institution=${selected.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-5xl font-light text-white tracking-tight mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          CampusVote
        </motion.h1>
        <motion.p
          className="text-[#a1a1aa] text-base mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Democratic elections for your campus
        </motion.p>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="h-12 shimmer rounded-xl" />
          ) : (
            <InstitutionSelect
              institutions={institutions}
              value={selected}
              onChange={setSelected}
              placeholder="Search your college..."
            />
          )}

          <motion.button
            className={`btn-primary ${!selected ? 'opacity-40 pointer-events-none' : ''}`}
            whileTap={{ scale: 0.97 }}
            onClick={handleContinue}
          >
            Continue →
          </motion.button>
        </motion.div>

        <motion.p
          className="text-[#52525b] text-xs mt-12 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Secure · Transparent · Student-Led
        </motion.p>
      </motion.div>
    </div>
  );
}
