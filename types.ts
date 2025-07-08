

export interface Player {
  id: string;
  name: string;
  skillLevel: number;
  teamId?: string; // Used to group players in pre-defined pairs
}

export interface Match {
  id:string;
  round: number;
  court: number;
  teamA: [Player, Player];
  teamB: [Player, Player];
  scoreA: number | null;
  scoreB: number | null;
  winner: 'A' | 'B' | null;
}

export interface Schedule {
  rounds: number;
  matches: Match[];
}

export interface EventInfo {
  startTime: string | null; // Stored as ISO string
  warmupMinutes: number | null;
  totalRounds: number | null;
  eventType: 'individual' | 'pairs';
}

export interface PlayerStats {
    playerId: string;
    finalRank: number;
    newSeed: number;
    wins: number;
    losses: number;
    pointFor: number;
    pointsAgainst: number;
    pointDifferential: number;
}

export interface EventSummary {
    playerStats: PlayerStats[];
    specialAwards: {
        title: string;
        playerName: string;
        description: string;
    }[];
}

export interface Preset {
  id: string;
  name: string;
  rules: string;
}

export enum View {
  DataImport,
  PlayerSelection,
  PlayerDashboard,
  AllCourts,
  DirectorDashboard,
  Results,
}