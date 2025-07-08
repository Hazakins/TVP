

import React, { useMemo, useState } from 'react';
import { EventSummary, Player } from '../types.ts';
import { TrophyIcon } from './icons/TrophyIcon.tsx';

interface ResultsViewProps {
  summary: EventSummary;
  players: Player[];
  isDirectorMode: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ summary, players, isDirectorMode }) => {
  const [copySuccess, setCopySuccess] = useState('');

  const playerMap = useMemo(() => {
    return new Map<string, Player>(players.map(p => [p.id, p]));
  }, [players]);

  const sortedPlayerStats = useMemo(() => {
    return [...summary.playerStats].sort((a, b) => a.finalRank - b.finalRank);
  }, [summary.playerStats]);

  const generateCopyText = () => {
    let text = '🏆 Pickleball Event Hub - Final Results 🏆\n\n';
    
    text += '=== ✨ Special Awards ✨ ===\n';
    summary.specialAwards.forEach(award => {
        text += `- ${award.title}: ${award.playerName} (${award.description})\n`;
    });
    text += '\n';

    text += '=== Final Rankings ===\n';
    sortedPlayerStats.forEach(stat => {
        const player = playerMap.get(stat.playerId);
        text += `${stat.finalRank}. ${player?.name || 'Unknown Player'} | W-L: ${stat.wins}-${stat.losses} | PD: ${stat.pointDifferential > 0 ? '+' : ''}${stat.pointDifferential} | New Seed: ${stat.newSeed}\n`;
    });
    
    return text;
  };

  const handleCopy = async () => {
    const textToCopy = generateCopyText();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess('Results copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy. Please try again.');
       setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  return (
    <div className="space-y-8">
       <div className="text-center">
        <h2 className="font-teko text-6xl font-bold text-white uppercase tracking-wide">
          Event Complete
        </h2>
        <p className="text-slate-300 mt-1 text-lg">Here are the final results and awards!</p>
      </div>

      {/* Special Awards */}
      <div>
        <h3 className="font-teko text-4xl text-lime-400 uppercase tracking-wide mb-4">Special Awards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summary.specialAwards.map((award, index) => (
                <div key={index} className="bg-slate-800 rounded-lg shadow-xl p-6 border-l-4 border-lime-400">
                    <div className="flex items-start space-x-4">
                        <TrophyIcon className="h-8 w-8 text-lime-400 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-teko text-2xl text-white">{award.title}</h4>
                            <p className="font-bold text-lg text-slate-100">{award.playerName}</p>
                            <p className="text-sm text-slate-400">{award.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>


      {/* Final Rankings */}
      <div>
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-teko text-4xl text-white uppercase tracking-wide">Final Rankings</h3>
            {isDirectorMode && (
                <button onClick={handleCopy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors">
                    {copySuccess ? copySuccess : 'Copy Summary'}
                </button>
            )}
         </div>
        
        <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th className="p-3 font-teko text-xl uppercase text-slate-300">Rank</th>
                            <th className="p-3 font-teko text-xl uppercase text-slate-300">Player</th>
                            <th className="p-3 font-teko text-xl uppercase text-slate-300 text-center">W - L</th>
                            <th className="p-3 font-teko text-xl uppercase text-slate-300 text-center">Point Diff.</th>
                            <th className="p-3 font-teko text-xl uppercase text-slate-300 text-center">New Seed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayerStats.map((stat, index) => {
                             const player = playerMap.get(stat.playerId);
                             return (
                                <tr key={stat.playerId} className={`border-t border-slate-700 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                    <td className="p-3 font-bold text-2xl text-center w-20">{stat.finalRank}</td>
                                    <td className="p-3 font-bold text-white">{player?.name || 'Unknown Player'}</td>
                                    <td className="p-3 text-center">{stat.wins} - {stat.losses}</td>
                                    <td className={`p-3 font-bold text-center ${stat.pointDifferential > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stat.pointDifferential > 0 ? '+' : ''}{stat.pointDifferential}
                                    </td>
                                    <td className="p-3 font-bold text-center text-lime-300">{stat.newSeed}</td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
