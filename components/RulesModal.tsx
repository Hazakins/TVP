
import React, { useEffect } from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullRules: string;
  summary: string;
  isLoading: boolean;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, fullRules, summary, isLoading }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-2xl border border-slate-700 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-teko text-4xl text-white uppercase">Event Rules & Format</h2>

        <div>
          <h3 className="font-bold text-lime-300 mb-2">Quick Summary</h3>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-2 h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
              <p className="text-slate-400">Getting the details...</p>
            </div>
          ) : summary ? (
            <div className="prose prose-invert prose-sm text-slate-200 max-w-none" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
          ) : (
            <p className="text-slate-400">Could not generate a summary. Please see the full rules below.</p>
          )}
        </div>

        <details className="bg-slate-900/50 rounded-lg">
          <summary className="cursor-pointer p-3 font-bold text-slate-300 hover:text-white">
            Show Full Details
          </summary>
          <div className="p-4 border-t border-slate-700">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-400">{fullRules}</pre>
          </div>
        </details>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
