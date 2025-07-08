

import React, { useState } from 'react';
import { modifyRulesWithAI } from '../services/geminiService.ts';

interface PresetModificationModalProps {
  currentRules: string;
  onClose: () => void;
  onApply: (newRules: string) => void;
}

const PresetModificationModal: React.FC<PresetModificationModalProps> = ({ currentRules, onClose, onApply }) => {
  const [modification, setModification] = useState('');
  const [newRules, setNewRules] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!modification.trim()) {
        setError('Please enter a modification request.');
        return;
    }
    setError('');
    setIsLoading(true);
    setNewRules('');
    try {
        const result = await modifyRulesWithAI(currentRules, modification);
        setNewRules(result);
    } catch (err: any) {
        setError(err.message || 'Failed to get suggestion from AI.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApply(newRules);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <div 
            className="bg-slate-800 rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-2xl border border-slate-700 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="font-teko text-4xl text-white uppercase">Modify Rules with AI</h2>
            
            <div>
                <label htmlFor="modification-request" className="block text-sm font-bold text-slate-300 mb-1">Your Request</label>
                <div className="flex items-center gap-2">
                    <input
                        id="modification-request"
                        type="text"
                        value={modification}
                        onChange={(e) => setModification(e.target.value)}
                        placeholder="e.g., Change games to 15, win by 2"
                        className="flex-grow p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600">
                        {isLoading ? 'Thinking...' : 'Generate'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            {newRules && (
                <div>
                    <h3 className="text-lg font-bold text-lime-300 mb-2">Suggested New Rules:</h3>
                    <textarea
                        readOnly
                        value={newRules}
                        className="w-full h-40 p-3 bg-slate-900 border border-slate-700 rounded-md font-sans text-sm"
                    />
                </div>
            )}

            <div className="flex justify-end items-center gap-4 mt-4">
                <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-md transition-colors">
                    Cancel
                </button>
                <button onClick={handleApply} disabled={!newRules} className="px-6 py-2 bg-lime-600 hover:bg-lime-700 text-slate-900 font-bold rounded-md transition-colors disabled:bg-slate-500">
                    Apply Changes
                </button>
            </div>
        </div>
    </div>
  );
};

export default PresetModificationModal;
