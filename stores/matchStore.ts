import { create } from "zustand";
import type {
  PlayEventWithQuality,
  MatchSetWithScore,
  ServingTeam,
} from "@/src/types/volleyball";

interface MatchState {
  matchId: string | null;
  sets: MatchSetWithScore[];
  events: PlayEventWithQuality[];
  currentSet: number;
  currentRotation: number;
  servingTeam: ServingTeam;
  serverPosition: number;
  undoStack: PlayEventWithQuality[];
  maxUndo: number;
  selectedPlayerId: string | null;

  setMatchId: (id: string) => void;
  setSets: (sets: MatchSetWithScore[]) => void;
  setEvents: (events: PlayEventWithQuality[]) => void;
  setCurrentSet: (set: number) => void;
  setSelectedPlayerId: (playerId: string | null) => void;
  addEvent: (event: PlayEventWithQuality) => void;
  undo: () => void;
  canUndo: () => boolean;
  setRotation: (rot: number) => void;
  setServer: (team: ServingTeam, pos: number) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  sets: [],
  events: [],
  currentSet: 1,
  currentRotation: 1,
  servingTeam: "home",
  serverPosition: 1,
  undoStack: [],
  maxUndo: 50,
  selectedPlayerId: null,

  setMatchId: (id) => set({ matchId: id }),

  setSets: (sets) => set({ sets }),

  setEvents: (events) => set({ events }),

  setCurrentSet: (setNumber) => set({ currentSet: setNumber }),

  setSelectedPlayerId: (playerId) => set({ selectedPlayerId: playerId }),

  addEvent: (event) => {
    const state = get();
    const newEvents = [...state.events, event];
    const newUndoStack = [...state.undoStack, event].slice(-state.maxUndo);

    set({
      events: newEvents,
      undoStack: newUndoStack,
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const newEvents = state.events.slice(0, -1);
    const newUndoStack = state.undoStack.slice(0, -1);

    set({
      events: newEvents,
      undoStack: newUndoStack,
    });
  },

  canUndo: () => get().undoStack.length > 0,

  setRotation: (rot) => set({ currentRotation: rot }),

  setServer: (team, pos) => set({ servingTeam: team, serverPosition: pos }),

  reset: () =>
    set({
      matchId: null,
      sets: [],
      events: [],
      currentSet: 1,
      currentRotation: 1,
      servingTeam: "home",
      serverPosition: 1,
      undoStack: [],
      selectedPlayerId: null,
    }),
}));


