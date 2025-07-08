
import React, { useState, useEffect, useCallback } from 'react';
import { Player, Match, Schedule, View, EventInfo, EventSummary, Preset } from './types.ts';
import { startEvent, generateNextRound, isRoundComplete, getEventSummary, isRoundInProgress, substitutePlayerAndRegenerateRound, getRulesSummary, addPlayerAndRegenerateRound, removePlayerAndRegenerateRound } from './services/eventService.ts';
import DataImport from './components/DataImport.tsx';
import PlayerSelection from './components/PlayerSelection.tsx';
import PlayerDashboard from './components/PlayerDashboard.tsx';
import AllCourtsView from './components/AllCourtsView.tsx';
import Header from './components/Header.tsx';
import DirectorPinModal from './components/DirectorPinModal.tsx';
import DirectorDashboard from './components/DirectorDashboard.tsx';
import EventStartNotification from './components/TournamentStartNotification.tsx';
import ResultsView from './components/ResultsView.tsx';
import RulesModal from './components/RulesModal.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.PlayerSelection);
  const [players, setPlayers] = useState<Player[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  const [rules, setRules] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isManagingPlayers, setIsManagingPlayers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isDirectorMode, setIsDirectorMode] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const [checkedInPlayerIds, setCheckedInPlayerIds] = useState<Set<string>>(new Set());
  const [eventInfo, setEventInfo] = useState<EventInfo>({ startTime: null, warmupMinutes: null, totalRounds: null, eventType: 'individual' });
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesSummary, setRulesSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Centralized function to sync all state from localStorage
  const syncStateFromStorage = useCallback(() => {
    try {
      const storedPlayers = localStorage.getItem('event_players');
      const storedSchedule = localStorage.getItem('event_schedule');
      const storedRules = localStorage.getItem('event_rules');
      const storedDirectorMode = localStorage.getItem('event_director_mode');
      const storedCheckedIn = localStorage.getItem('event_checked_in');
      const storedEventInfo = localStorage.getItem('event_info');
      const storedEventSummary = localStorage.getItem('event_summary');
      const storedPresets = localStorage.getItem('event_presets');
      const storedSummary = localStorage.getItem('event_rules_summary');

      setPlayers(storedPlayers ? JSON.parse(storedPlayers) : []);
      const newSchedule = storedSchedule ? JSON.parse(storedSchedule) : null;
      setSchedule(newSchedule);
      setCurrentRound(newSchedule ? newSchedule.rounds : 1);
      setRules(storedRules || '');
      setIsDirectorMode(storedDirectorMode === 'true');
      setCheckedInPlayerIds(storedCheckedIn ? new Set(JSON.parse(storedCheckedIn)) : new Set());
      setEventInfo(storedEventInfo ? JSON.parse(storedEventInfo) : { startTime: null, warmupMinutes: null, totalRounds: null, eventType: 'individual' });
      setPresets(storedPresets ? JSON.parse(storedPresets) : []);
      setRulesSummary(storedSummary || '');
      setEventSummary(storedEventSummary ? JSON.parse(storedEventSummary) : null);
    } catch (err) {
      console.error("Failed to sync data from localStorage", err);
    }
  }, []);

  // Effect for initial load and cross-window state synchronization
  useEffect(() => {
    setIsLoading(true);
    syncStateFromStorage();
    setIsLoading(false);

    const handleStorageChange = (event: StorageEvent) => {
      // Key is null when localStorage.clear() is called
      if (event.key === null || event.key.startsWith('event_')) {
        console.log(`Storage change detected for key: ${event.key}. Syncing state.`);
        syncStateFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncStateFromStorage]);
  
  const handleDirectorLogin = () => {
      setIsDirectorMode(true);
      localStorage.setItem('event_director_mode', 'true');
      setShowPinModal(false);
  };

  const handleDirectorExit = () => {
      setIsDirectorMode(false);
      localStorage.removeItem('event_director_mode');
  };

  const handleDataImport = async (playerData: string, rulesDescription: string, eventType: 'individual' | 'pairs') => {
    setIsGenerating(true);
    setError(null);
    try {
      await handleResetEvent(); // Clear old data before setting new
      const { players, schedule } = await startEvent(playerData, rulesDescription, eventType);
      
      const newEventInfo = { ...eventInfo, eventType };
      
      localStorage.setItem('event_players', JSON.stringify(players));
      localStorage.setItem('event_schedule', JSON.stringify(schedule));
      localStorage.setItem('event_rules', rulesDescription);
      localStorage.setItem('event_info', JSON.stringify(newEventInfo));

      setPlayers(players);
      setSchedule(schedule);
      setRules(rulesDescription);
      setEventInfo(newEventInfo);
      setCurrentRound(1);
      setView(View.PlayerSelection);
    } catch (err: any) {
      setError(err.message || 'Failed to start event. Check your data and rules.');
      throw err; // re-throw to be caught in the component
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSelectPlayer = (player: Player) => {
    const newCheckedInIds = new Set(checkedInPlayerIds).add(player.id);
    setCheckedInPlayerIds(newCheckedInIds);
    localStorage.setItem('event_checked_in', JSON.stringify(Array.from(newCheckedInIds)));
    
    setSelectedPlayer(player);
    setView(eventSummary ? View.Results : View.PlayerDashboard);
  };
  
  const handleToggleCheckIn = (playerId: string) => {
    const newCheckedInIds = new Set(checkedInPlayerIds);
    if (newCheckedInIds.has(playerId)) {
      newCheckedInIds.delete(playerId);
    } else {
      newCheckedInIds.add(playerId);
    }
    setCheckedInPlayerIds(newCheckedInIds);
    localStorage.setItem('event_checked_in', JSON.stringify(Array.from(newCheckedInIds)));
  };

  const handleCheckInAll = () => {
    const allPlayerIds = new Set(players.map(p => p.id));
    setCheckedInPlayerIds(allPlayerIds);
    localStorage.setItem('event_checked_in', JSON.stringify(Array.from(allPlayerIds)));
  };

  const handlePlayerLogout = () => {
    setSelectedPlayer(null);
    setView(eventSummary ? View.Results : View.PlayerSelection);
  };
  
  const handleResetEvent = async () => {
    // These local state resets are immediate for the current window.
    setPlayers([]);
    setSchedule(null);
    setRules('');
    setCurrentRound(1);
    setSelectedPlayer(null);
    setCheckedInPlayerIds(new Set());
    setEventInfo({ startTime: null, warmupMinutes: null, totalRounds: null, eventType: 'individual' });
    setEventSummary(null);
    setRulesSummary('');
    setView(View.DataImport);
    
    // This will trigger the 'storage' event in other windows with key=null
    localStorage.clear();
  };
  
  const handleViewChange = (newView: View) => setView(newView);
  const handleRoundChange = (round: number) => {
    if (schedule && round > 0 && round <= schedule.rounds) {
      setCurrentRound(round);
    }
  };

  const handleScoreSubmit = async (matchId: string, scoreA: number, scoreB: number) => {
    setSchedule(currentSchedule => {
      if (!currentSchedule) return null;
      const newMatches = currentSchedule.matches.map(m => {
        if (m.id === matchId) {
          const winner: 'A' | 'B' = scoreA > scoreB ? 'A' : 'B';
          return { ...m, scoreA, scoreB, winner };
        }
        return m;
      });
      const newSchedule = { ...currentSchedule, matches: newMatches };
      localStorage.setItem('event_schedule', JSON.stringify(newSchedule));
      return newSchedule;
    });
  };
  
  const handleBatchScoreSubmit = (scores: {matchId: string, scoreA: number, scoreB: number}[]) => {
     setSchedule(currentSchedule => {
        if (!currentSchedule) return null;
        const scoreMap = new Map(scores.map(s => [s.matchId, s]));
        const newMatches = currentSchedule.matches.map(m => {
            if (scoreMap.has(m.id)) {
                const score = scoreMap.get(m.id)!;
                const winner: 'A' | 'B' = score.scoreA > score.scoreB ? 'A' : 'B';
                return { ...m, scoreA: score.scoreA, scoreB: score.scoreB, winner};
            }
            return m;
        });
        const newSchedule = { ...currentSchedule, matches: newMatches };
        localStorage.setItem('event_schedule', JSON.stringify(newSchedule));
        return newSchedule;
    });
  };

  const handleGenerateNextRound = async () => {
    if (!schedule || !rules || !isDirectorMode) return;
    setIsGenerating(true);
    setError(null);
    try {
      const updatedSchedule = await generateNextRound(schedule, rules, eventInfo.eventType);
      setSchedule(updatedSchedule);
      setCurrentRound(updatedSchedule.rounds);
      localStorage.setItem('event_schedule', JSON.stringify(updatedSchedule));
    } catch (err: any) {
      setError(err.message || 'Failed to generate the next round.');
      alert(err.message || 'Failed to generate the next round.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleStartEvent = (warmupMinutes: number) => {
    const startTime = new Date(Date.now() + warmupMinutes * 60 * 1000);
    const newEventInfo = {
        ...eventInfo,
        startTime: startTime.toISOString(),
        warmupMinutes
    };
    setEventInfo(newEventInfo);
    localStorage.setItem('event_info', JSON.stringify(newEventInfo));
  };
  
  const handleSetTotalRounds = (rounds: number) => {
    const newInfo = { ...eventInfo, totalRounds: rounds > 0 ? rounds : null };
    setEventInfo(newInfo);
    localStorage.setItem('event_info', JSON.stringify(newInfo));
  };
  
  const handleFinishEvent = async () => {
    if (!schedule || !players || !rules) return;
    setIsGenerating(true);
    setError(null);
    try {
      const summary = await getEventSummary(schedule, players, rules);
      setEventSummary(summary);
      localStorage.setItem('event_summary', JSON.stringify(summary));
      setView(View.Results);
    } catch (err: any) {
      setError(err.message || "Failed to generate event summary.");
      alert(err.message || "Failed to generate event summary.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAddPlayer = async (playerName: string, playerSkillLevel: number) => {
    if (!schedule || !players || !rules) return;
    setIsManagingPlayers(true);
    setError(null);
    try {
      const { players: newPlayers, schedule: newSchedule } = await addPlayerAndRegenerateRound(
        playerName,
        playerSkillLevel,
        schedule,
        players,
        rules,
        eventInfo.eventType
      );
      setPlayers(newPlayers);
      setSchedule(newSchedule);
      localStorage.setItem('event_players', JSON.stringify(newPlayers));
      localStorage.setItem('event_schedule', JSON.stringify(newSchedule));
      alert(`Successfully added player and fixed Round ${newSchedule.rounds}.`);
    } catch (err: any) {
      setError(err.message || "Failed to add player.");
      alert(err.message || "Failed to add player.");
    } finally {
      setIsManagingPlayers(false);
    }
  };

  const handleRemovePlayer = async (playerOutId: string) => {
    if (!schedule || !players || !rules) return;
    setIsManagingPlayers(true);
    setError(null);
    try {
      const { players: newPlayers, schedule: newSchedule } = await removePlayerAndRegenerateRound(
        playerOutId,
        schedule,
        players,
        rules,
        eventInfo.eventType
      );
      setPlayers(newPlayers);
      setSchedule(newSchedule);
      localStorage.setItem('event_players', JSON.stringify(newPlayers));
      localStorage.setItem('event_schedule', JSON.stringify(newSchedule));
      alert(`Successfully removed player and fixed Round ${newSchedule.rounds}.`);
    } catch (err: any) {
      setError(err.message || "Failed to remove player.");
      alert(err.message || "Failed to remove player.");
    } finally {
      setIsManagingPlayers(false);
    }
  };

  const handleSubstitutePlayer = async (playerOutId: string, subInName: string, subInSkillLevel: number) => {
    if (!schedule || !players || !rules) {
      alert("Cannot perform substitution: missing event data.");
      return;
    }
    setIsManagingPlayers(true);
    setError(null);
    try {
      const { players: newPlayers, schedule: newSchedule } = await substitutePlayerAndRegenerateRound(
        playerOutId,
        subInName,
        subInSkillLevel,
        schedule,
        players,
        rules,
        eventInfo.eventType
      );
      setPlayers(newPlayers);
      setSchedule(newSchedule);
      localStorage.setItem('event_players', JSON.stringify(newPlayers));
      localStorage.setItem('event_schedule', JSON.stringify(newSchedule));
      alert(`Successfully substituted player and regenerated Round ${newSchedule.rounds}.`);
    } catch (err: any) {
      setError(err.message || "Failed to substitute player.");
      alert(err.message || "Failed to substitute player.");
    } finally {
      setIsManagingPlayers(false);
    }
  };

  const handleSavePreset = (name: string, rules: string) => {
    const newPreset: Preset = { id: Date.now().toString(), name, rules };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('event_presets', JSON.stringify(updatedPresets));
    alert(`Preset "${name}" saved!`);
  };

  const handleUpdatePreset = (id: string, rules: string) => {
    const updatedPresets = presets.map(p => p.id === id ? { ...p, rules } : p);
    setPresets(updatedPresets);
    localStorage.setItem('event_presets', JSON.stringify(updatedPresets));
    alert('Preset updated!');
  };

  const handleDeletePreset = (id: string) => {
    if (window.confirm("Are you sure you want to delete this preset?")) {
      const updatedPresets = presets.filter(p => p.id !== id);
      setPresets(updatedPresets);
      localStorage.setItem('event_presets', JSON.stringify(updatedPresets));
    }
  };

  const handleOpenRules = useCallback(async () => {
    if (!rules) return;
    setIsRulesModalOpen(true);
    // If we already have a summary, don't refetch
    if (rulesSummary) return;

    setIsSummaryLoading(true);
    try {
        const summary = await getRulesSummary(rules);
        setRulesSummary(summary);
        localStorage.setItem('event_rules_summary', summary);
    } catch (err) {
        // If AI fails, we can just show the full rules, so no need to show an error
        console.error("Failed to get rules summary:", err);
    } finally {
        setIsSummaryLoading(false);
    }
  }, [rules, rulesSummary]);


  const roundInProgress = schedule ? isRoundInProgress(currentRound, schedule) : false;

  const renderContent = () => {
    if (isLoading) return <div className="text-center p-10">Initializing App...</div>;

    // View is determined by data state first, then by user interaction
    if (eventSummary) {
        return <ResultsView summary={eventSummary} players={players} isDirectorMode={isDirectorMode} />;
    }

    if (!schedule) {
       return isDirectorMode ? (
            <DataImport 
                onDataLoaded={handleDataImport} 
                presets={presets}
                onSavePreset={handleSavePreset}
                onUpdatePreset={handleUpdatePreset}
                onDeletePreset={handleDeletePreset}
            />
        ) : <PlayerSelection players={[]} onSelectPlayer={() => {}} />;
    }

    switch (view) {
      case View.PlayerSelection:
         return <PlayerSelection players={players} onSelectPlayer={handleSelectPlayer} />;
      case View.PlayerDashboard:
        if (selectedPlayer) {
          return <PlayerDashboard player={selectedPlayer} schedule={schedule} currentRound={currentRound} onScoreSubmit={handleScoreSubmit} isDirectorMode={isDirectorMode} />;
        }
        // if player gets deselected, fall through to player selection
        return <PlayerSelection players={players} onSelectPlayer={handleSelectPlayer} />;
      case View.AllCourts:
        return <AllCourtsView 
            schedule={schedule}
            currentRound={currentRound}
            onScoreSubmit={handleScoreSubmit}
            onBatchScoreSubmit={handleBatchScoreSubmit}
            selectedPlayer={selectedPlayer}
            isDirectorMode={isDirectorMode}
           />;
       case View.DirectorDashboard:
        if (isDirectorMode) {
          return <DirectorDashboard 
            players={players} 
            checkedInPlayerIds={checkedInPlayerIds} 
            onStartEvent={handleStartEvent}
            eventInfo={eventInfo}
            onSetTotalRounds={handleSetTotalRounds}
            schedule={schedule}
            onGenerateNextRound={handleGenerateNextRound}
            onFinishEvent={handleFinishEvent}
            isGenerating={isGenerating || isManagingPlayers}
            onPlayerAdd={handleAddPlayer}
            onPlayerRemove={handleRemovePlayer}
            onPlayerSubstitute={handleSubstitutePlayer}
            isRoundInProgress={roundInProgress}
            isManagingPlayers={isManagingPlayers}
            onToggleCheckIn={handleToggleCheckIn}
            onCheckInAll={handleCheckInAll}
            rules={rules}
            onSavePreset={handleSavePreset}
            />;
        }
        // if not director, fall through
        return <PlayerSelection players={players} onSelectPlayer={handleSelectPlayer} />;
      default:
        // Fallback to player selection if view state is weird
        return <PlayerSelection players={players} onSelectPlayer={handleSelectPlayer} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      <EventStartNotification eventInfo={eventInfo} />
      {showPinModal && <DirectorPinModal onSuccess={handleDirectorLogin} onClose={() => setShowPinModal(false)} />}
      <RulesModal 
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        fullRules={rules}
        summary={rulesSummary}
        isLoading={isSummaryLoading}
      />
      <Header 
        selectedPlayer={selectedPlayer}
        onPlayerLogout={handlePlayerLogout}
        currentView={view}
        onViewChange={handleViewChange}
        currentRound={currentRound}
        totalRounds={schedule?.rounds ?? 0}
        definedTotalRounds={eventInfo.totalRounds}
        onRoundChange={handleRoundChange}
        isDirectorMode={isDirectorMode}
        onDirectorLoginClick={() => setShowPinModal(true)}
        onDirectorExit={handleDirectorExit}
        onNewEventClick={handleResetEvent}
        checkedInCount={checkedInPlayerIds.size}
        playerCount={players.length}
        eventFinished={!!eventSummary}
        onViewRulesClick={handleOpenRules}
        isEventActive={!!schedule}
        onRefresh={syncStateFromStorage}
      />
      <main className="container mx-auto p-4 md:p-6">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-xs text-slate-500">
        Treasure Valley Pickleball | Powered by Gemini
      </footer>
    </div>
  );
};

export default App;
