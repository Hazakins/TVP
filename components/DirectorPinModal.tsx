
import React, { useState, useEffect, useRef } from 'react';

interface DirectorPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DIRECTOR_PIN = '1234';

const DirectorPinModal: React.FC<DirectorPinModalProps> = ({ onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input field when the modal opens
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DIRECTOR_PIN) {
      onSuccess();
    } else {
      setError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-sm border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-teko text-4xl text-white uppercase text-center mb-2">Director Access</h2>
        <p className="text-slate-400 text-center mb-6">Enter the PIN to access administrative functions.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={(e) => {
                setPin(e.target.value);
                setError(null);
            }}
            placeholder="****"
            maxLength={4}
            className="w-full text-center tracking-[1rem] font-mono text-3xl p-4 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none transition-shadow"
          />
          
          {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!pin}
            className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed uppercase"
          >
            Authorize
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectorPinModal;
