

import { Player, Schedule, Match, EventSummary, EventInfo } from '../types.ts';
import { generateRoundOneMatches, generateNextRoundMatches, generateEventSummary, summarizeRulesForPlayer } from './geminiService.ts';

/**
 * Parses a string of player data into an array of Player objects.
 * Expects format: "FirstName LastName [spaces or tab] seedNumber" on each line.
 * Can handle seed at start or end, or no seed.
 * Generates a unique ID for each player.
 */
export const parsePlayers = (playerData: string, eventType: 'individual' | 'pairs'): Player[] => {
  const lines = playerData.trim().split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    throw new Error('Player data is empty. Please provide a list of players.');
  }

  if (eventType === 'pairs') {
    const players: Player[] = [];
    let playerIdCounter = 1;
    lines.forEach((line, index) => {
      const teamId = `t${index + 1}`;
      // Regex to find two names separated by '&' and an optional seed in parentheses
      const pairMatch = line.match(/(.+?)\s*&\s*(.+)/);
      if (!pairMatch) {
        throw new Error(`Invalid pair format on line ${index + 1}: '${line}'. Expected 'Player One & Player Two (Seed: 10)'.`);
      }
      
      const player1Name = pairMatch[1].trim();
      let remaining = pairMatch[2].trim();
      
      let player2Name: string;
      let skillLevel: number = 999;
      
      const seedMatch = remaining.match(/(.+?)\s*\(\s*Seed\s*:\s*(\d+)\s*\)/i);
      if (seedMatch) {
        player2Name = seedMatch[1].trim();
        skillLevel = parseInt(seedMatch[2], 10);
      } else {
        player2Name = remaining;
      }
      
      players.push({ id: `p${playerIdCounter++}`, name: player1Name, skillLevel, teamId });
      players.push({ id: `p${playerIdCounter++}`, name: player2Name, skillLevel, teamId });
    });
    return players;

  } else { // 'individual'
    return lines.map((line, index) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 0) {
        throw new Error(`Invalid data on line ${index + 1}: Line is empty.`);
      }

      let name: string;
      let skillLevel: number;

      const firstPartAsNum = parseInt(parts[0], 10);
      const lastPartAsNum = parseInt(parts[parts.length - 1], 10);

      if (!isNaN(firstPartAsNum) && parts.length > 1) {
        skillLevel = firstPartAsNum;
        name = parts.slice(1).join(' ');
      } else if (!isNaN(lastPartAsNum) && parts.length > 1) {
        skillLevel = lastPartAsNum;
        name = parts.slice(0, -1).join(' ');
      } else {
        name = parts.join(' ');
        skillLevel = 999;
      }

      return {
        id: `p${index + 1}`,
        name,
        skillLevel,
      };
    });
  }
};


/**
 * Builds full Match objects from raw match data (with player IDs) and a player map.
 */
const buildMatchesFromPlayerIds = (rawMatches: any[], players: Player[], round: number): Match[] => {
    const playerMap = new Map<string, Player>(players.map(p => [p.id, p]));
    return rawMatches.map(m => {
        const teamAPlayer1 = playerMap.get(m.teamA[0]);
        const teamAPlayer2 = playerMap.get(m.teamA[1]);
        const teamBPlayer1 = playerMap.get(m.teamB[0]);
        const teamBPlayer2 = playerMap.get(m.teamB[1]);

        if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1 || !teamBPlayer2) {
            console.error('Invalid player ID found in match data from AI.', {match: m, playerMap});
            throw new Error(`Invalid player ID in match ${m.id}. Ensure all player IDs in the schedule exist in the player list. One of these is invalid: ${m.teamA[0]}, ${m.teamA[1]}, ${m.teamB[0]}, ${m.teamB[1]}`);
        }
        
        return {
            id: m.id,
            round,
            court: m.court,
            teamA: [teamAPlayer1, teamAPlayer2],
            teamB: [teamBPlayer1, teamBPlayer2],
            scoreA: null,
            scoreB: null,
            winner: null,
        };
    });
}

/**
 * A helper function to manage regenerating the current round with an updated player list.
 * This is used for substitutions, adding players, or removing players.
 */
const regenerateCurrentRound = async (
    currentSchedule: Schedule,
    updatedPlayers: Player[],
    rules: string,
    eventType: 'individual' | 'pairs'
): Promise<Schedule> => {
    const currentRoundNumber = currentSchedule.rounds;

    if (isRoundInProgress(currentRoundNumber, currentSchedule)) {
        throw new Error(`Cannot modify players for Round ${currentRoundNumber} because scores have already been reported.`);
    }

    if (currentRoundNumber === 1) {
        // Special case: In Round 1. Regenerate Round 1 from scratch with the new player list.
        const rawMatches = await generateRoundOneMatches(updatedPlayers, rules, eventType);
        const matches = buildMatchesFromPlayerIds(rawMatches, updatedPlayers, 1);
        return { rounds: 1, matches };
    } else {
        // In a later round. Truncate schedule to the end of the PREVIOUS round.
        const previousRoundMatches = currentSchedule.matches.filter(m => m.round < currentRoundNumber);
        const truncatedSchedule: Schedule = {
            rounds: currentRoundNumber - 1,
            matches: previousRoundMatches,
        };

        // Call generateNextRound with the truncated data and the OVERRIDE player list.
        // This will correctly regenerate ONLY the current round.
        return await generateNextRound(truncatedSchedule, rules, eventType, updatedPlayers);
    }
};


/**
 * Initiates an event by parsing players and generating the first round via AI.
 */
export const startEvent = async (playerData: string, rules: string, eventType: 'individual' | 'pairs'): Promise<{players: Player[], schedule: Schedule}> => {
    const players = parsePlayers(playerData, eventType);
    const rawMatches = await generateRoundOneMatches(players, rules, eventType);
    const matches = buildMatchesFromPlayerIds(rawMatches, players, 1);
    
    const schedule: Schedule = {
        rounds: 1,
        matches: matches,
    };
    return { players, schedule };
};

/**
 * Generates the next round of matches based on the previous round's results and rules.
 */
export const generateNextRound = async (currentSchedule: Schedule, rules: string, eventType: 'individual' | 'pairs', allPlayersOverride?: Player[]): Promise<Schedule> => {
    const nextRoundNumber = currentSchedule.rounds + 1;
    const lastRoundMatches = currentSchedule.matches.filter(m => m.round === currentSchedule.rounds);

    if (lastRoundMatches.length === 0 && currentSchedule.rounds > 0) {
        throw new Error("Could not find any matches from the previous round.");
    }
    
    if(!isRoundComplete(currentSchedule.rounds, currentSchedule) && currentSchedule.rounds > 0) {
        throw new Error("Cannot generate the next round until all scores from the current round have been reported.");
    }

    const previousRoundResults = lastRoundMatches.map(m => ({
        court: m.court,
        teamA: {
            players: m.teamA.map(p => ({ id: p.id, name: p.name, skillLevel: p.skillLevel, teamId: p.teamId })),
            score: m.scoreA
        },
        teamB: {
            players: m.teamB.map(p => ({ id: p.id, name: p.name, skillLevel: p.skillLevel, teamId: p.teamId })),
            score: m.scoreB
        },
        winner: m.winner
    }));
    
    const allPlayers = allPlayersOverride ?? Array.from(new Set(lastRoundMatches.flatMap(m => [...m.teamA, ...m.teamB])));
    const rawNewMatches = await generateNextRoundMatches(previousRoundResults, rules, allPlayers, nextRoundNumber, eventType);
    const newMatches = buildMatchesFromPlayerIds(rawNewMatches, allPlayers, nextRoundNumber);
    
    return {
        rounds: nextRoundNumber,
        matches: [...currentSchedule.matches, ...newMatches],
    };
};

export const addPlayerAndRegenerateRound = async (
  playerName: string,
  playerSkillLevel: number,
  currentSchedule: Schedule,
  currentPlayers: Player[],
  rules: string,
  eventType: 'individual' | 'pairs'
): Promise<{ players: Player[]; schedule: Schedule }> => {
  const newPlayer: Player = {
    id: `p${Date.now()}`,
    name: playerName,
    skillLevel: playerSkillLevel,
  };
  const updatedPlayers = [...currentPlayers, newPlayer];
  const newSchedule = await regenerateCurrentRound(currentSchedule, updatedPlayers, rules, eventType);
  return { players: updatedPlayers, schedule: newSchedule };
};

export const removePlayerAndRegenerateRound = async (
  playerOutId: string,
  currentSchedule: Schedule,
  currentPlayers: Player[],
  rules: string,
  eventType: 'individual' | 'pairs'
): Promise<{ players: Player[]; schedule: Schedule }> => {
  const updatedPlayers = currentPlayers.filter(p => p.id !== playerOutId);
  const newSchedule = await regenerateCurrentRound(currentSchedule, updatedPlayers, rules, eventType);
  return { players: updatedPlayers, schedule: newSchedule };
};

export const substitutePlayerAndRegenerateRound = async (
  playerOutId: string,
  subInName: string,
  subInSkillLevel: number,
  currentSchedule: Schedule,
  currentPlayers: Player[],
  rules: string,
  eventType: 'individual' | 'pairs'
): Promise<{ players: Player[]; schedule: Schedule }> => {
  const subInPlayer: Player = {
    id: `p${Date.now()}`, // Unique ID for the new player
    name: subInName,
    skillLevel: subInSkillLevel,
  };
  const updatedPlayers = currentPlayers.map(p => p.id === playerOutId ? subInPlayer : p);
  const newSchedule = await regenerateCurrentRound(currentSchedule, updatedPlayers, rules, eventType);
  return { players: updatedPlayers, schedule: newSchedule };
};

/**
 * Checks if all matches in a given round have been completed.
 */
export const isRoundComplete = (round: number, schedule: Schedule): boolean => {
    const roundMatches = schedule.matches.filter(m => m.round === round);
    if (roundMatches.length === 0) return false; // No matches for this round, so not complete.
    return roundMatches.every(m => m.winner !== null);
};

/**
 * Checks if any scores have been submitted for a given round.
 */
export const isRoundInProgress = (round: number, schedule: Schedule): boolean => {
    const roundMatches = schedule.matches.filter(m => m.round === round);
    // If any match in the round has a score, it's considered "in progress" and subs are locked.
    return roundMatches.some(m => m.winner !== null);
};


/**
 * Calls the AI service to analyze the entire event and generate a final summary.
 */
export const getEventSummary = async (schedule: Schedule, players: Player[], rules: string): Promise<EventSummary> => {
    if (!schedule || !players || players.length === 0) {
        throw new Error("Cannot generate summary without a schedule and players.");
    }
    const summary = await generateEventSummary(schedule, players, rules);
    return summary;
};

/**
 * Calls the AI service to summarize the event rules for a player.
 */
export const getRulesSummary = async (rules: string): Promise<string> => {
    if (!rules) return "No rules have been provided for this event.";
    const summary = await summarizeRulesForPlayer(rules);
    return summary;
};