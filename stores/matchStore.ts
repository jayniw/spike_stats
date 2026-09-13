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

  setMatchId: (id: string) => void;
  setSets: (sets: MatchSetWithScore[]) => void;
  setEvents: (events: PlayEventWithQuality[]) => void;
  setCurrentSet: (set: number) => void;
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

  setMatchId: (id) => set({ matchId: id }),

  setSets: (sets) => set({ sets }),

  setEvents: (events) => set({ events }),

  setCurrentSet: (setNumber) => set({ currentSet: setNumber }),

  addEvent: (event) => {
    const state = get();
    const newEvents = [...state.events, event];
    const newUndoStack = [...state.undoStack, event].slice(-state.maxUndo);

    // Update score if it's a point event
    const newSets = updateScore(state.sets, event, state.currentSet);

    // Update rotation if side-out
    const newRotation = calculateNewRotation(
      event,
      state.currentRotation,
      state.servingTeam
    );

    set({
      events: newEvents,
      sets: newSets,
      undoStack: newUndoStack,
      currentRotation: newRotation.rotation,
      servingTeam: newRotation.servingTeam,
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const lastEvent = state.undoStack[state.undoStack.length - 1];
    const newEvents = state.events.slice(0, -1);
    const newUndoStack = state.undoStack.slice(0, -1);

    // Recalculate score without the undone event
    const newSets = recalculateSets(newEvents, state.sets, state.currentSet);

    // Recalculate rotation
    const newRotation = recalculateRotation(
      newEvents,
      state.currentRotation,
      state.servingTeam
    );

    set({
      events: newEvents,
      sets: newSets,
      undoStack: newUndoStack,
      currentRotation: newRotation.rotation,
      servingTeam: newRotation.servingTeam,
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
    }),
}));

const pointQualities: Record<string, string[]> = {
  serve: ["ace"],
  reception: [],
  attack: ["kill"],
  block: ["kill"],
  set: [],
  defense: [],
};

function isPointEvent(fundamental: string, quality: string): boolean {
  return pointQualities[fundamental]?.includes(quality) ?? false;
}

function updateScore(
  sets: MatchSetWithScore[],
  event: PlayEventWithQuality,
  currentSet: number
): MatchSetWithScore[] {
  return sets.map((set) => {
    if (set.set_number !== currentSet) return set;

    if (isPointEvent(event.fundamental, event.quality)) {
      // Point for the event's team
      return {
        ...set,
        points_home: event.team_id === "home" ? set.points_home + 1 : set.points_home,
        points_away: event.team_id !== "home" ? set.points_away + 1 : set.points_away,
      };
    }

    // Check if it's an opponent error that gives a point
    if (event.quality === "error") {
      return {
        ...set,
        points_home: event.team_id !== "home" ? set.points_home + 1 : set.points_home,
        points_away: event.team_id === "home" ? set.points_away + 1 : set.points_away,
      };
    }

    return set;
  });
}

function recalculateSets(
  events: PlayEventWithQuality[],
  sets: MatchSetWithScore[],
  currentSet: number
): MatchSetWithScore[] {
  // Reset current set scores and recalculate from events
  return sets.map((set) => {
    if (set.set_number !== currentSet) return set;

    let pointsHome = 0;
    let pointsAway = 0;

    events.forEach((event) => {
      if (event.set_number !== currentSet) return;

      if (isPointEvent(event.fundamental, event.quality)) {
        pointsHome += 1;
      } else if (event.quality === "error") {
        pointsAway += 1;
      }
    });

    return { ...set, points_home: pointsHome, points_away: pointsAway };
  });
}

function calculateNewRotation(
  event: PlayEventWithQuality,
  currentRotation: number,
  currentServingTeam: ServingTeam
): { rotation: number; servingTeam: ServingTeam } {
  // If point scored (side-out), rotate and switch server
  if (isPointEvent(event.fundamental, event.quality)) {
    return {
      rotation: currentRotation === 6 ? 1 : currentRotation + 1,
      servingTeam: currentServingTeam === "home" ? "away" : "home",
    };
  }

  // If opponent error, same as point
  if (event.quality === "error") {
    return {
      rotation: currentRotation === 6 ? 1 : currentRotation + 1,
      servingTeam: currentServingTeam === "home" ? "away" : "home",
    };
  }

  // No rotation change
  return {
    rotation: currentRotation,
    servingTeam: currentServingTeam,
  };
}

function recalculateRotation(
  events: PlayEventWithQuality[],
  currentRotation: number,
  currentServingTeam: ServingTeam
): { rotation: number; servingTeam: ServingTeam } {
  let rotation = 1;
  let servingTeam: ServingTeam = "home";

  events.forEach((event) => {
    const result = calculateNewRotation(event, rotation, servingTeam);
    rotation = result.rotation;
    servingTeam = result.servingTeam;
  });

  return { rotation, servingTeam };
}
