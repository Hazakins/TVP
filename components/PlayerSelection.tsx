
import React, { useState } from 'react';
import { Player } from '../types.ts';

interface PlayerSelectionProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

const PlayerSelection: React.FC<PlayerSelectionProps> = ({ players, onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
      <div className="text-center mb-8 pt-8">
        <h2 className="font-teko text-5xl font-bold text-white uppercase tracking-wide">Player Check-In</h2>
        <p className="text-slate-400 mt-2">Find your name to see your matches and report scores.</p>
      </div>
      
      {players.length > 0 && (
         <div className="mb-6">
            <input
            type="text"
            placeholder="Search for your name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none transition-shadow"
            />
        </div>
      )}
     

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
        {players.length > 0 && filteredPlayers.length > 0 ? (
          filteredPlayers.map(player => (
            <button
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className="group w-full text-left p-4 bg-slate-700 rounded-lg hover:bg-lime-500 hover:text-slate-900 transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <p className="font-bold text-lg text-white group-hover:text-slate-900 transition-colors">{player.name}</p>
              <p className="text-sm text-slate-400 group-hover:text-slate-700 transition-colors">
                Seed: {player.skillLevel === 999 ? 'Unseeded' : player.skillLevel}
              </p>
            </button>
          ))
        ) : (
          <div className="text-slate-400 col-span-1 md:col-span-2 text-center py-4">
            {players.length === 0 ? (
              <div>
                <h3 className="font-teko text-3xl text-slate-300">No Active Event</h3>
                <p>An event has not been started yet. The event director must log in to create an event.</p>
              </div>
            ) : (
              <p>No players found matching your search.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSelection;
