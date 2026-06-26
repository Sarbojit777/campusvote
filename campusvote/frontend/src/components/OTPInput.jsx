import { useRef } from 'react';

export default function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleChange = (i, char) => {
    const d = char.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    onChange(next.join(''));
    if (d && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold bg-[#111111] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#3a3a3a] transition-colors disabled:opacity-50"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
