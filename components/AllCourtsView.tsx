
import React from 'react';
import { Schedule, Match, Player } from '../types.ts';
import ScoreInput from './ScoreInput.tsx';
import { CourtIcon } from './icons/CourtIcon.tsx';

interface AllCourtsViewProps {
  schedule: Schedule;
  currentRound: number;
  onScoreSubmit: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  onBatchScoreSubmit: (scores: {matchId: string, scoreA: number, scoreB: number}[]) => void;
  selectedPlayer: Player | null;
  isDirectorMode: boolean;
}

const MatchCard: React.FC<{ match: Match; onScoreSubmit: (matchId: string, scoreA: number, scoreB: number) => Promise<void>; isDirectorMode: boolean; selectedPlayer: Player | null; }> = ({ match, onScoreSubmit, isDirectorMode, selectedPlayer }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-700/50 flex items-center space-x-3">
            <h3 className="font-teko text-2xl text-slate-300 uppercase">Match ID: {match.id}</h3>
        </div>
        <div className="p-4 flex-grow">
            <div className="mb-4">
                <div className="mb-2">
                    <p className="text-sm font-bold text-lime-300">Team A</p>
                    <p>{match.teamA[0].name} & {match.teamA[1].name}</p>
                </div>
                <div className="text-center text-slate-500 font-bold my-1">vs</div>
                <div>
                    <p className="text-sm font-bold text-red-300">Team B</p>
                    <p>{match.teamB[0].name} & {match.teamB[1].name}</p>
                </div>
            </div>
        </div>
        <div className="p-4 bg-slate-800/50 mt-auto">
            <ScoreInput 
                match={match} 
                onScoreSubmit={onScoreSubmit} 
                isCondensed={true} 
                isDirectorMode={isDirectorMode}
                selectedPlayer={selectedPlayer} 
            />
        </div>
    </div>
  );
};


const AllCourtsView: React.FC<AllCourtsViewProps> = ({ schedule, currentRound, onScoreSubmit, onBatchScoreSubmit, selectedPlayer, isDirectorMode }) => {
  const currentMatches = schedule.matches.filter(m => m.round === currentRound);

  const matchesByCourt = currentMatches.reduce((acc, match) => {
    const court = match.court;
    if (!acc[court]) {
      acc[court] = [];
    }
    acc[court].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const sortedCourts = Object.entries(matchesByCourt).sort(([a], [b]) => Number(a) - Number(b));

  const handleGenerateRandomScores = () => {
    const scoresToSubmit = currentMatches
      .filter(match => !match.winner)
      .map(match => {
        let scoreA, scoreB;
        if (Math.random() > 0.5) {
            scoreA = 11;
            scoreB = Math.floor(Math.random() * 10);
        } else {
            scoreB = 11;
            scoreA = Math.floor(Math.random() * 10);
        }
        return { matchId: match.id, scoreA, scoreB };
      });

    if (scoresToSubmit.length > 0) {
        onBatchScoreSubmit(scoresToSubmit);
    }
  };

  return (
    <div>
      <div className="text-center mb-6 flex justify-center items-center gap-6">
        <div>
          <h2 className="font-teko text-5xl font-bold text-white uppercase tracking-wide">
            All Courts - Round {currentRound}
          </h2>
          <p className="text-slate-400 mt-1">Live overview of all ongoing matches.</p>
        </div>
        {isDirectorMode && (
          <button
            onClick={handleGenerateRandomScores}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-slate-900 font-bold rounded-md transition-colors text-sm"
            title="Generates random scores for all unplayed matches in this round for testing."
          >
            Generate Random Scores (Test)
          </button>
        )}
      </div>

      <div className="space-y-12">
        {sortedCourts.length > 0 ? sortedCourts.map(([court, matches]) => (
            <div key={court}>
                <div className="flex items-center space-x-3 mb-4 border-b-2 border-slate-700 pb-2">
                    <CourtIcon className="h-8 w-8 text-lime-400" />
                    <h3 className="font-teko text-4xl text-white uppercase">Court {court}</h3>
                    <span className="text-slate-400 font-medium pt-1">({matches.length} {matches.length > 1 ? 'matches' : 'match'})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {matches.sort((a,b) => a.id.localeCompare(b.id)).map(match => (
                        <MatchCard key={match.id} match={match} onScoreSubmit={onScoreSubmit} isDirectorMode={isDirectorMode} selectedPlayer={selectedPlayer} />
                    ))}
                </div>
            </div>
        )) : (
            <div className="text-center py-10 bg-slate-800 rounded-lg">
                <p className="text-slate-400">No matches found for this round.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AllCourtsView;
