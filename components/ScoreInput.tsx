
import React, { useState, useEffect } from 'react';
import { Match, Player } from '../types.ts';

interface ScoreInputProps {
  match: Match;
  onScoreSubmit: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  isCondensed?: boolean;
  isDirectorMode?: boolean;
  selectedPlayer?: Player | null;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ match, onScoreSubmit, isCondensed = false, isDirectorMode = false, selectedPlayer = null }) => {
  const [scoreA, setScoreA] = useState<string>(match.scoreA?.toString() || '');
  const [scoreB, setScoreB] = useState<string>(match.scoreB?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If scores are updated from above (e.g. director override), reflect them
    setScoreA(match.scoreA?.toString() || '');
    setScoreB(match.scoreB?.toString() || '');
  }, [match.scoreA, match.scoreB]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScoreA = parseInt(scoreA, 10);
    const numScoreB = parseInt(scoreB, 10);

    if (isNaN(numScoreA) || isNaN(numScoreB) || numScoreA < 0 || numScoreB < 0) {
      setError('Please enter valid, non-negative scores.');
      return;
    }
    if (numScoreA === numScoreB) {
        setError('Scores cannot be tied. Please enter a winning score.');
        return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onScoreSubmit(match.id, numScoreA, numScoreB);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPlayerInMatch = selectedPlayer ? (match.teamA.some(p => p.id === selectedPlayer.id) || match.teamB.some(p => p.id === selectedPlayer.id)) : false;
  
  // A player can only edit if they are in the match AND a score hasn't been submitted yet.
  // A director can always edit.
  const canEdit = isDirectorMode || (isPlayerInMatch && !match.winner);
  
  // Render final score view if score is submitted, and we are not a director looking to override.
  if (match.winner && !isDirectorMode) {
      const scoreViewClasses = isCondensed 
        ? "text-center py-2 bg-green-900/50 border border-green-500 rounded-lg"
        : "text-center p-4 bg-green-900/50 border border-green-500 rounded-lg";
      return (
        <div className={scoreViewClasses}>
          <p className={isCondensed ? "text-sm text-slate-300" : "font-bold text-lg"}>Final Score Reported</p>
          <p className={isCondensed ? "font-bold text-xl" : "text-2xl"}>{match.scoreA} - {match.scoreB}</p>
        </div>
      );
  }
  
  // Render a read-only state for players looking at other matches on the AllCourts view
  if (!isDirectorMode && selectedPlayer && !isPlayerInMatch) {
    const readOnlyClasses = isCondensed ? "py-3" : "py-8";
    return (
        <div className={`text-center bg-slate-700/30 rounded-lg ${readOnlyClasses}`}>
            <p className="text-sm text-slate-400 font-medium">
                {match.winner ? `Final: ${match.scoreA} - ${match.scoreB}` : 'Score Not Reported'}
            </p>
        </div>
    );
  }

  const inputClasses = isCondensed 
    ? "w-full text-center bg-slate-700 border-slate-600 rounded-md p-1 focus:ring-lime-400 focus:outline-none"
    : "w-full text-center bg-slate-700 border border-slate-600 rounded-md p-2 text-lg font-bold focus:ring-2 focus:ring-lime-400 focus:outline-none transition-shadow";

  const buttonClasses = isCondensed
    ? "w-full mt-2 px-3 py-1 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-500"
    : "w-full mt-4 px-4 py-3 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-500";

  return (
    <form onSubmit={handleSubmit}>
       {isDirectorMode && match.winner && (
        <p className="text-center text-xs text-yellow-400 mb-2">Director Mode: Overriding submitted score.</p>
      )}
      <div className={`flex items-center justify-center space-x-2 ${isCondensed ? '' : 'md:space-x-4'}`}>
        <div className="flex-1 text-center">
          {!isCondensed && <label className="block text-sm text-lime-300 mb-1">{match.teamA[0].name.split(' ')[0]} & {match.teamA[1].name.split(' ')[0]}</label>}
          <input
            type="number"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className={inputClasses}
            min="0"
            disabled={isSubmitting || !canEdit}
            required
          />
        </div>
        <span className={`text-slate-400 font-bold ${isCondensed ? 'text-lg' : 'text-2xl'}`}>-</span>
        <div className="flex-1 text-center">
           {!isCondensed && <label className="block text-sm text-red-300 mb-1">{match.teamB[0].name.split(' ')[0]} & {match.teamB[1].name.split(' ')[0]}</label>}
           <input
            type="number"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className={inputClasses}
            min="0"
            disabled={isSubmitting || !canEdit}
            required
          />
        </div>
      </div>
      
      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !canEdit}
        className={buttonClasses}
        title={!canEdit && !isDirectorMode ? "You can only submit scores for your own match." : ""}
      >
        {isSubmitting ? 'Submitting...' : isDirectorMode && match.winner ? 'Override Score' : 'Submit Final Score'}
      </button>
    </form>
  );
};

export default ScoreInput;
