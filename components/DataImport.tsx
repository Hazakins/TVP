

import React, { useState, useEffect } from 'react';
import { Preset } from '../types.ts';
import PresetModificationModal from './PresetModificationModal.tsx';
import { SaveIcon } from './icons/SaveIcon.tsx';

interface DataImportProps {
  onDataLoaded: (playerData: string, rulesDescription: string, eventType: 'individual' | 'pairs') => Promise<void>;
  presets: Preset[];
  onSavePreset: (name: string, rules: string) => void;
  onUpdatePreset: (id: string, rules: string) => void;
  onDeletePreset: (id: string) => void;
}

const PLAYER_DATA_INDIVIDUAL_EXAMPLE = `1 Geoff Putnam
2 Zack Petterson
Jon Carroll 3
Jeff Bailey 4
...and so on`;

const PLAYER_DATA_PAIRS_EXAMPLE = `Geoff Putnam & Zack Petterson (Seed: 2)
Jon Carroll & Jeff Bailey (Seed: 4)
Chris Haskins & Carrie Hutchings
...and so on`;


const RULES_EXAMPLE = `This is a ladder-style event. 
For Round 1, seed players by their seed number (skillLevel) and create random partnerships on each court. If a player has no seed number, assign them a random one after all seeded players.
For subsequent rounds, the winning team on each court moves up one court (except on court 1), and the losing team moves down one court (except on the last court). Partners should be swapped on each court for the new round.
Games are to 11, win by 1. 3 games per round.`;

const DataImport: React.FC<DataImportProps> = ({ onDataLoaded, presets, onSavePreset, onUpdatePreset, onDeletePreset }) => {
  const [playerData, setPlayerData] = useState('');
  const [rules, setRules] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [eventType, setEventType] = useState<'individual' | 'pairs'>('individual');

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const rulesModified = selectedPreset ? rules !== selectedPreset.rules : false;

  useEffect(() => {
    // If a preset is deleted, reset the selection
    if (selectedPresetId && !presets.some(p => p.id === selectedPresetId)) {
        setSelectedPresetId('');
    }
  }, [presets, selectedPresetId]);


  const handleLoadData = async () => {
    if (!playerData || !rules) {
      setError('Please provide both player data and event rules.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
        await onDataLoaded(playerData, rules, eventType);
    } catch(err: any) {
        setError(err.message || 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    const preset = presets.find(p => p.id === id);
    if (preset) {
        setRules(preset.rules);
    } else {
        setRules('');
    }
  };

  const handleSaveAsNew = () => {
    const newName = prompt("Enter a name for this new preset:", selectedPreset?.name || "New Event Style");
    if (newName && newName.trim() !== '') {
        onSavePreset(newName, rules);
        setSelectedPresetId(''); // Reset selection after saving
    }
  };

  const handleUpdate = () => {
    if (selectedPreset) {
        onUpdatePreset(selectedPreset.id, rules);
    }
  };
  
  const playerDataExample = eventType === 'individual' ? PLAYER_DATA_INDIVIDUAL_EXAMPLE : PLAYER_DATA_PAIRS_EXAMPLE;

  return (
    <div className="max-w-4xl mx-auto bg-slate-800 rounded-lg shadow-xl p-6 md:p-8">
      {isAiModalOpen && selectedPreset && (
        <PresetModificationModal 
            currentRules={selectedPreset.rules}
            onClose={() => setIsAiModalOpen(false)}
            onApply={(newRules) => {
                setRules(newRules);
                setIsAiModalOpen(false);
            }}
        />
      )}
      <div className="text-center mb-8 pt-8">
        <h1 className="font-teko text-5xl font-bold text-white uppercase tracking-wide">Create New Event</h1>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
          To begin, choose your event type, paste your player list, and describe the rules.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-md p-3 mb-6 text-sm">
          <p className="font-bold">Error Loading Data</p>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Event Type */}
        <div>
            <label className="block font-teko text-2xl text-lime-300 uppercase mb-3">
                1. Event Type
            </label>
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg max-w-md">
                <button
                    onClick={() => setEventType('individual')}
                    className={`flex-1 py-2 text-center rounded-md font-bold transition-colors ${eventType === 'individual' ? 'bg-lime-500 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    Individual Players
                </button>
                <button
                    onClick={() => setEventType('pairs')}
                    className={`flex-1 py-2 text-center rounded-md font-bold transition-colors ${eventType === 'pairs' ? 'bg-lime-500 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    Pre-defined Pairs
                </button>
            </div>
        </div>

        {/* Player Data Input */}
        <div>
          <label htmlFor="player-data" className="block font-teko text-2xl text-lime-300 uppercase mb-2">
            2. Player List
          </label>
          <textarea
            id="player-data"
            value={playerData}
            onChange={(e) => setPlayerData(e.target.value)}
            placeholder={playerDataExample}
            className="w-full h-48 p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none transition-shadow font-mono text-sm"
            disabled={isLoading}
          />
           <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400">
             {eventType === 'individual' 
               ? <p><span className="font-bold">Format:</span> Player Name and optional Seed Number on each line.</p>
               : <p><span className="font-bold">Format:</span> `Player One & Player Two (Seed: 10)` on each line. Seed is optional.</p>
             }
          </div>
        </div>

        {/* Schedule Data Input */}
        <div>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <label htmlFor="rules" className="block font-teko text-2xl text-red-300 uppercase">
                3. Event Format & Rules
            </label>
            {/* Preset Controls */}
            {presets.length > 0 && (
                <div className="flex items-center gap-2">
                    <select
                        value={selectedPresetId}
                        onChange={handlePresetChange}
                        className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-lime-400 focus:outline-none"
                    >
                        <option value="">Load Preset...</option>
                        {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {selectedPresetId && (
                         <button onClick={() => onDeletePreset(selectedPresetId)} className="text-red-400 hover:text-red-300 text-xs font-bold">DELETE</button>
                    )}
                </div>
            )}
           </div>
          <textarea
            id="rules"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder={RULES_EXAMPLE}
            className="w-full h-48 p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none transition-shadow font-sans text-base"
            disabled={isLoading}
          />
           <div className="mt-2 p-3 bg-slate-900/50 rounded text-xs text-slate-400 flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="font-bold mb-1">Describe your format. Be specific about seeding, player movement, and partnerships.</p>
            </div>
            {selectedPreset && (
                 <button 
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-sm transition-colors"
                >
                    Modify with AI
                </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
            {rulesModified && selectedPreset && (
                <div className="flex items-center gap-2">
                    <button onClick={handleUpdate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-md transition-colors">
                        <SaveIcon className="h-4 w-4" /> Update Preset
                    </button>
                    <button onClick={handleSaveAsNew} className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-md transition-colors">
                       <SaveIcon className="h-4 w-4" /> Save as New
                    </button>
                </div>
            )}
        </div>
        <button
          onClick={handleLoadData}
          disabled={isLoading || !playerData || !rules}
          className="px-6 py-4 bg-lime-600 hover:bg-lime-700 text-slate-900 font-bold rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-lg uppercase tracking-wider flex items-center justify-center"
        >
          {isLoading ? (
            <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mr-3"></div>
                Analyzing Rules & Generating Round 1...
            </>
          ) : 'Create Event & Generate Round 1'}
        </button>
      </div>
    </div>
  );
};

export default DataImport;