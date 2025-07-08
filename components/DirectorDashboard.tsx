

import React, { useState, useEffect } from 'react';
import { Player, EventInfo, Schedule } from '../types.ts';
import { isRoundComplete } from '../services/eventService.ts';

interface DirectorDashboardProps {
  players: Player[];
  checkedInPlayerIds: Set<string>;
  onStartEvent: (warmupMinutes: number) => void;
  eventInfo: EventInfo;
  onSetTotalRounds: (rounds: number) => void;
  schedule: Schedule;
  onGenerateNextRound: () => void;
  onFinishEvent: () => void;
  isGenerating: boolean;
  onPlayerAdd: (playerName: string, playerSkillLevel: number) => Promise<void>;
  onPlayerRemove: (playerId: string) => Promise<void>;
  onPlayerSubstitute: (playerOutId: string, subInName: string, subInSkillLevel: number) => Promise<void>;
  isRoundInProgress: boolean;
  isManagingPlayers: boolean;
  onToggleCheckIn: (playerId: string) => void;
  onCheckInAll: () => void;
  rules: string;
  onSavePreset: (name: string, rules: string) => void;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ 
  players, 
  checkedInPlayerIds, 
  onStartEvent, 
  eventInfo, 
  onSetTotalRounds,
  schedule,
  onGenerateNextRound,
  onFinishEvent,
  isGenerating,
  onPlayerAdd,
  onPlayerRemove,
  onPlayerSubstitute,
  isRoundInProgress,
  isManagingPlayers,
  onToggleCheckIn,
  onCheckInAll,
  rules,
  onSavePreset
}) => {
  const [warmup, setWarmup] = useState('15');
  const [localTotalRounds, setLocalTotalRounds] = useState<string>(eventInfo.totalRounds?.toString() || '');
  const [presetName, setPresetName] = useState('');
  
  // State for forms
  const [addPlayerName, setAddPlayerName] = useState('');
  const [addPlayerSeed, setAddPlayerSeed] = useState('');
  const [removePlayerId, setRemovePlayerId] = useState<string>('');
  const [subPlayerOutId, setSubPlayerOutId] = useState<string>('');
  const [subPlayerInName, setSubPlayerInName] = useState('');
  const [subPlayerInSeed, setSubPlayerInSeed] = useState('');


  const checkedInCount = checkedInPlayerIds.size;
  const totalPlayers = players.length;
  const allPlayersCheckedIn = totalPlayers > 0 && checkedInCount === totalPlayers;
  const progress = totalPlayers > 0 ? (checkedInCount / totalPlayers) * 100 : 0;
  
  const currentRoundNumber = schedule.rounds;
  const currentRoundIsComplete = isRoundComplete(currentRoundNumber, schedule);
  const isFinalRound = eventInfo.totalRounds ? currentRoundNumber >= eventInfo.totalRounds : false;
  
  const handleSetRounds = () => {
    const numRounds = parseInt(localTotalRounds, 10);
    if (!isNaN(numRounds)) {
      onSetTotalRounds(numRounds);
    }
  };

  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPlayerName || !addPlayerSeed) return alert("Please provide a name and seed for the new player.");
    const seed = parseInt(addPlayerSeed, 10);
    if (isNaN(seed)) return alert("Please enter a valid number for seed/skill.");
    await onPlayerAdd(addPlayerName, seed);
    setAddPlayerName('');
    setAddPlayerSeed('');
  };

  const handleRemovePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removePlayerId) return alert("Please select a player to remove.");
    if (window.confirm(`Are you sure you want to remove ${players.find(p=>p.id === removePlayerId)?.name}? This will fix the current round.`)) {
      await onPlayerRemove(removePlayerId);
      setRemovePlayerId(players.length > 0 ? players[0].id : '');
    }
  };
  
  const handleSubFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subPlayerOutId || !subPlayerInName || !subPlayerInSeed) {
        return alert("Please fill out all fields for the substitution.");
    }
    const seed = parseInt(subPlayerInSeed, 10);
    if (isNaN(seed)) {
        return alert("Please enter a valid number for the seed/skill level.");
    }
    await onPlayerSubstitute(subPlayerOutId, subPlayerInName, seed);
    setSubPlayerOutId(players.length > 0 ? players[0].id : '');
    setSubPlayerInName('');
    setSubPlayerInSeed('');
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
        alert("Please enter a name for the preset.");
        return;
    }
    onSavePreset(presetName, rules);
    setPresetName('');
  };
  
  useEffect(() => {
    setLocalTotalRounds(eventInfo.totalRounds?.toString() || '');
  }, [eventInfo.totalRounds]);

  useEffect(() => {
    if (players.length > 0) {
      if (!removePlayerId) setRemovePlayerId(players[0].id);
      if (!subPlayerOutId) setSubPlayerOutId(players[0].id);
    }
  }, [players, removePlayerId, subPlayerOutId]);

  if (players.length === 0) {
      return (
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 text-center">
            <h2 className="font-teko text-4xl text-slate-400">No Event Data Found</h2>
            <p className="text-slate-300">Create a new event to manage players and matches.</p>
          </div>
      )
  }

  const renderEventControls = () => {
    if (eventInfo.startTime) {
      return (
        <div className="text-center p-4 bg-green-900/50 border border-green-500 rounded-lg">
          <p className="font-bold text-lg">Event has been started!</p>
          <p className="text-slate-300">Matches will begin at {new Date(eventInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} after a {eventInfo.warmupMinutes}-minute warm-up.</p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="warmup" className="font-bold text-slate-300">Warm-up time (minutes):</label>
          <input 
            type="number"
            id="warmup"
            value={warmup}
            onChange={e => setWarmup(e.target.value)}
            className="w-24 p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => onStartEvent(parseInt(warmup,10))}
          disabled={!allPlayersCheckedIn}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          title={!allPlayersCheckedIn ? 'All players must be checked in to start the event' : 'Start the event'}
        >
          Start Event & Notify Players
        </button>
      </div>
    );
  };
  
  const renderProgressionButtons = () => {
    if (isGenerating || isManagingPlayers) {
        return (
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="flex justify-center items-center gap-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400"></div>
                    <div>
                        <p className="font-bold text-lg text-slate-200">AI is working...</p>
                        <p className="text-slate-400 text-sm">{isManagingPlayers ? 'Fixing current round with new players...' : 'Analyzing results and building new matchups...'}</p>
                    </div>
                </div>
            </div>
        );
    }

    const showGenerateButton = currentRoundIsComplete && !isFinalRound;
    const showFinishButton = currentRoundIsComplete && isFinalRound;

    return (
        <div className="space-y-4">
            {showGenerateButton && (
                <div className="text-center">
                    <button
                        onClick={onGenerateNextRound}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-lg uppercase tracking-wider shadow-lg hover:shadow-indigo-500/50"
                    >
                        {`Generate Round ${currentRoundNumber + 1}`}
                    </button>
                </div>
            )}

            {showFinishButton && (
                <div className="text-center">
                    <button
                        onClick={onFinishEvent}
                        className="px-8 py-4 bg-lime-600 hover:bg-lime-700 text-slate-900 font-bold rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-lg uppercase tracking-wider shadow-lg hover:shadow-lime-500/50"
                    >
                        {`Finish Event & Calculate Results`}
                    </button>
                </div>
            )}
        </div>
    );
  };
  
  const playerManagementDisabled = isRoundInProgress || isManagingPlayers || eventInfo.eventType === 'pairs';
  
  return (
    <div className="space-y-8">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
        <h2 className="font-teko text-4xl text-white uppercase tracking-wide mb-4">Event Progression</h2>
         
        <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg flex-wrap gap-4 mb-4">
           <div className="flex items-center space-x-4">
              <label htmlFor="totalRounds" className="font-bold text-slate-300">Total Rounds:</label>
              <input 
                type="number"
                id="totalRounds"
                value={localTotalRounds}
                onChange={e => setLocalTotalRounds(e.target.value)}
                onBlur={handleSetRounds}
                min="1"
                placeholder="e.g., 5"
                className="w-24 p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
              />
            </div>
            <p className="text-slate-400 text-sm flex-1">Set the total number of rounds for the event.</p>
        </div>
         
        {eventInfo.startTime ? renderProgressionButtons() : (
           <p className="text-slate-400 text-center p-4">Player check-in must be completed and the event must be started before managing rounds.</p>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
          <h2 className="font-teko text-4xl text-white uppercase tracking-wide mb-4">Manage Event Style</h2>
            <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-lg">
                <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., Weekly Ladder Fun"
                    className="flex-grow p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                />
                <button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600"
                    title="Save the current event rules as a reusable preset"
                >
                    Save Event Style
                </button>
            </div>
      </div>
      
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
        <h2 className="font-teko text-4xl text-white uppercase tracking-wide mb-4">Player Management</h2>
        <fieldset disabled={playerManagementDisabled} className="space-y-6">
            {/* Add Player */}
            <form onSubmit={handleAddPlayerSubmit} className="space-y-2 p-4 border border-slate-700 rounded-lg">
                <h3 className="font-teko text-2xl text-slate-300">Add Player</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" value={addPlayerName} onChange={e => setAddPlayerName(e.target.value)} placeholder="New Player Name" required className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none md:col-span-1" />
                    <input type="number" value={addPlayerSeed} onChange={e => setAddPlayerSeed(e.target.value)} placeholder="Seed/Skill" required className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none" />
                    <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600">Add Player & Fix Round</button>
                </div>
            </form>
            
            {/* Remove Player */}
            <form onSubmit={handleRemovePlayerSubmit} className="space-y-2 p-4 border border-slate-700 rounded-lg">
                <h3 className="font-teko text-2xl text-slate-300">Remove Player</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={removePlayerId} onChange={e => setRemovePlayerId(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none md:col-span-2">
                        {players.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="submit" className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600">Remove Player & Fix Round</button>
                </div>
            </form>

            {/* Substitute Player */}
            <form onSubmit={handleSubFormSubmit} className="space-y-2 p-4 border border-slate-700 rounded-lg">
                <h3 className="font-teko text-2xl text-slate-300">Substitute Player</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select value={subPlayerOutId} onChange={e => setSubPlayerOutId(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none md:col-span-1">
                        {players.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="text" value={subPlayerInName} onChange={e => setSubPlayerInName(e.target.value)} placeholder="Substitute Name" required className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none md:col-span-1" />
                    <input type="number" value={subPlayerInSeed} onChange={e => setSubPlayerInSeed(e.target.value)} placeholder="Substitute Seed" required className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none" />
                    <button type="submit" className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-600">Substitute Player & Fix Round</button>
                </div>
            </form>
        </fieldset>
         {(isRoundInProgress || eventInfo.eventType === 'pairs') && (
                <p className="text-xs text-yellow-400 text-center mt-4">
                    {isRoundInProgress && `Player management is locked for Round ${currentRoundNumber} because scores have been reported.`}
                    {eventInfo.eventType === 'pairs' && 'Player management is not available for pre-defined pairs events.'}
                </p>
            )}
      </div>


      <div className="bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="font-teko text-4xl text-white uppercase tracking-wide">Player Check-in</h2>
            <button 
                onClick={onCheckInAll}
                disabled={allPlayersCheckedIn}
                className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-slate-900 font-bold rounded-md transition-colors text-sm disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                Check In All Players
            </button>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-lg text-slate-300">{checkedInCount} / {totalPlayers} Players Checked In</span>
            {allPlayersCheckedIn && <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full uppercase">All Players Present</span>}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-lime-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[40vh] overflow-y-auto pr-2">
          {players.sort((a, b) => a.skillLevel - b.skillLevel).map(player => (
            <button 
              key={player.id} 
              onClick={() => onToggleCheckIn(player.id)}
              className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md text-left hover:bg-slate-700 transition-colors w-full cursor-pointer"
            >
              <div className="flex items-center space-x-3 truncate">
                <span className={`h-3 w-3 rounded-full flex-shrink-0 ${checkedInPlayerIds.has(player.id) ? 'bg-green-400 shadow-[0_0_5px_#84cc16]' : 'bg-slate-600'}`}></span>
                <span className="text-slate-200 truncate" title={`${player.name} - Seed: ${player.skillLevel === 999 ? 'Unseeded' : player.skillLevel}`}>
                  {player.name}
                </span>
              </div>
              <span className="text-xs font-bold text-lime-400 ml-2 flex-shrink-0">
                {player.skillLevel === 999 ? 'UN' : player.skillLevel}
              </span>
            </button>
          ))}
        </div>
        
        <div className="mt-6">
             {renderEventControls()}
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;