import { create } from "zustand";

interface StatsState {
  season: string | null;
  teamId: string | null;
  matchId: string | null;
  playerId: string | null;
  setNumber: number | null;

  setSeason: (season: string | null) => void;
  setTeamId: (teamId: string | null) => void;
  setMatchId: (matchId: string | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setSetNumber: (setNumber: number | null) => void;
  reset: () => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  season: null,
  teamId: null,
  matchId: null,
  playerId: null,
  setNumber: null,

  setSeason: (season) =>
    set({ season, teamId: null, matchId: null, playerId: null, setNumber: null }),
  setTeamId: (teamId) =>
    set({ teamId, matchId: null, playerId: null, setNumber: null }),
  setMatchId: (matchId) => set({ matchId, setNumber: null }),
  setPlayerId: (playerId) => set({ playerId }),
  setSetNumber: (setNumber) => set({ setNumber }),
  reset: () =>
    set({
      season: null,
      teamId: null,
      matchId: null,
      playerId: null,
      setNumber: null,
    }),
}));
