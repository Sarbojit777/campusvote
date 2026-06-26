import { useState, useRef, useEffect } from 'react';

export default function InstitutionSelect({ institutions, value, onChange, placeholder = 'Search your college...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = institutions.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    i.emailSuffix.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (inst) => {
    onChange(inst);
    setQuery(inst.name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <input
        className="input-field"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange(null); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
          {filtered.map((inst) => (
            <button
              key={inst.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#2a2a2a] last:border-0"
              onClick={() => select(inst)}
            >
              <div className="text-sm font-medium text-white">{inst.name}</div>
              <div className="text-xs text-[#52525b] mt-0.5">{inst.emailSuffix}</div>
            </button>
          ))}
        </div>
      )}
      {open && query.length > 1 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 text-center text-[#52525b] text-sm shadow-2xl">
          No colleges found
        </div>
      )}
    </div>
  );
}
