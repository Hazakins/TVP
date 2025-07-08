
import React, { useState, useEffect } from 'react';
import { Player, Schedule, Match } from '../types.ts';
import ScoreInput from './ScoreInput.tsx';
import { CourtIcon } from './icons/CourtIcon.tsx';
import { UserGroupIcon } from './icons/UserGroupIcon.tsx';

interface PlayerDashboardProps {
  player: Player;
  schedule: Schedule;
  currentRound: number;
  onScoreSubmit: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  isDirectorMode: boolean;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, schedule, currentRound, onScoreSubmit, isDirectorMode }) => {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const playerMatchesForRound = schedule.matches
    .filter(m => m.round === currentRound && (m.teamA.some(p => p.id === player.id) || m.teamB.some(p => p.id === player.id)))
    .sort((a, b) => a.id.localeCompare(b.id));
    
  const currentMatch = playerMatchesForRound[currentGameIndex];

  useEffect(() => {
    setCurrentGameIndex(0);
  }, [currentRound, player.id]);

  const handleGameChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < playerMatchesForRound.length) {
      setCurrentGameIndex(newIndex);
    }
  };

  const renderMatchInfo = (match: Match) => {
    const isTeamA = match.teamA.some(p => p.id === player.id);
    const partner = (isTeamA ? match.teamA : match.teamB).find(p => p.id !== player.id);
    const opponents = isTeamA ? match.teamB : match.teamA;
    const numGames = playerMatchesForRound.length;

    return (
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
        <div className="flex justify-between items-start md:items-center mb-4 flex-col md:flex-row gap-y-2">
            <h2 className="font-teko text-4xl text-lime-400 uppercase tracking-wide">
              Round {currentRound} Match
            </h2>
            {numGames > 1 && (
                <div className="flex items-center space-x-2 bg-slate-700/50 rounded-lg p-1">
                    <button onClick={() => handleGameChange(currentGameIndex - 1)} disabled={currentGameIndex === 0} className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors" title="Previous Game">&lt;</button>
                    <span className="text-sm font-medium w-24 text-center">Game {currentGameIndex + 1} of {numGames}</span>
                    <button onClick={() => handleGameChange(currentGameIndex + 1)} disabled={currentGameIndex >= numGames - 1} className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors" title="Next Game">&gt;</button>
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-4">
            <CourtIcon className="h-10 w-10 text-lime-400"/>
            <div>
              <p className="text-sm text-slate-400">Court</p>
              <p className="text-2xl font-bold text-white">{match.court}</p>
            </div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-4">
            <UserGroupIcon className="h-10 w-10 text-lime-400"/>
            <div>
              <p className="text-sm text-slate-400">Your Partner</p>
              <p className="text-2xl font-bold text-white">{partner?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
            <h3 className="font-teko text-2xl text-white uppercase mb-2">Matchup</h3>
            <div className="flex items-center justify-center space-x-4 bg-slate-900 p-4 rounded-lg">
                <div className="text-center">
                    <p className="font-bold text-lime-300">{player.name}</p>
                    <p className="font-bold text-lime-300">& {partner?.name}</p>
                </div>
                <span className="text-slate-500 font-teko text-3xl">VS</span>
                <div className="text-center text-red-300">
                    <p>{opponents[0].name}</p>
                    <p>& {opponents[1].name}</p>
                </div>
            </div>
        </div>

        <div>
          <h3 className="font-teko text-2xl text-white uppercase mb-3">Report Score</h3>
          <ScoreInput match={match} onScoreSubmit={onScoreSubmit} isDirectorMode={isDirectorMode} selectedPlayer={player} />
        </div>
      </div>
    );
  };

  return (
    <div>
        {currentMatch ? renderMatchInfo(currentMatch) : (
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 text-center">
            <h2 className="font-teko text-4xl text-slate-400">No Match This Round</h2>
            <p className="text-slate-300">You may have a bye. Enjoy your break!</p>
          </div>
        )}
    </div>
  );
};

export default PlayerDashboard;
