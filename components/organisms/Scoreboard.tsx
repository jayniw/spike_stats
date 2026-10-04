"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { MatchSetWithScore, MatchRow } from "@/src/types/volleyball";
import {
  calculateMatchState,
  type MatchState,
} from "@/lib/matchStateMachine";

interface ScoreboardProps {
  match: MatchRow;
  homeTeamName: string;
  awayTeamName: string;
  sets: MatchSetWithScore[];
  onUpdateScore: (setNumber: number, isHome: boolean, delta: number) => void;
  onSetLocked?: (setNumber: number) => void;
  onMatchComplete?: (matchState: MatchState) => void;
  onAdvanceSet?: (currentSet: number) => void;
  currentSet?: number;
}

// Helper: Detecta si un set está completo según reglas FIVB
function isSetComplete(
  pointsHome: number,
  pointsAway: number,
  setNumber: number,
  format: "best_of_3" | "best_of_5"
): { complete: boolean; winner: "home" | "away" | null } {
  const isFinalSet = format === "best_of_5" ? setNumber === 5 : setNumber === 3;
  const targetPoints = isFinalSet ? 15 : 25;
  const minDiff = 2;

  const homeWins = pointsHome >= targetPoints && pointsHome - pointsAway >= minDiff;
  const awayWins = pointsAway >= targetPoints && pointsAway - pointsHome >= minDiff;

  if (homeWins) return { complete: true, winner: "home" };
  if (awayWins) return { complete: true, winner: "away" };
  return { complete: false, winner: null };
}

function ScoreBox({
  value,
  onIncrement,
  onDecrement,
  locked,
  disabled,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  locked: boolean;
  disabled: boolean;
}) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (locked) return;
    didLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      console.log('[ScoreBox] Long press fired - decrement');
      didLongPress.current = true;
      onDecrement();
      longPressTimer.current = null;
    }, 600); // Long press para decrementar
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (disabled || didLongPress.current) return;
    if (!locked) {
      onIncrement();
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "relative w-10 h-10 rounded-lg text-lg font-bold",
        "flex items-center justify-center",
        "active:scale-95 transition-all select-none touch-manipulation",
        disabled && "opacity-30 cursor-not-allowed",
        locked
          ? "bg-muted text-muted-foreground opacity-50"
          : "bg-primary text-primary-foreground"
      )}
    >
      {value}
      {locked && (
        <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>
      )}
    </button>
  );
}

export function Scoreboard({
  match,
  homeTeamName,
  awayTeamName,
  sets,
  onUpdateScore,
  onSetLocked,
  onMatchComplete,
  onAdvanceSet,
  currentSet,
}: ScoreboardProps) {
  const [lockedSets, setLockedSets] = useState<Set<number>>(new Set());
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  // Calculate match state whenever locked sets or sets change
  useEffect(() => {
    const state = calculateMatchState(match, sets, lockedSets);
    setMatchState(state);

    if (state.isMatchComplete && onMatchComplete) {
      onMatchComplete(state);
    }
  }, [lockedSets, sets, match, onMatchComplete]);

  // Determine if a set is enabled (editable)
  const isSetEnabled = (setNumber: number) => {
    if (!matchState) return setNumber === 1;
    return matchState.enabledSets.has(setNumber) && !matchState.isMatchComplete;
  };

  // Handle center button click: validate score + lock set + advance
  const handleCenterClick = (setNumber: number) => {
    const setData = sets.find(s => s.set_number === setNumber);
    if (!setData) return;

    const { complete, winner } = isSetComplete(
      setData.points_home,
      setData.points_away,
      setNumber,
      match.format
    );

    if (!complete) {
      // TODO: Show toast "Set no completado: necesitan 25 pts con 2 de diferencia (15 en tiebreak)"
      console.log('[Scoreboard] Set not complete:', { setNumber, home: setData.points_home, away: setData.points_away, format: match.format });
      return;
    }

    // Lock the set
    setLockedSets(prev => {
      const newLocked = new Set(prev);
      newLocked.add(setNumber);
      return newLocked;
    });

    // Sync to Supabase
    if (onSetLocked) {
      onSetLocked(setNumber);
    }

    // Advance to next set if available
    const maxSets = match.format === "best_of_5" ? 5 : 3;
    if (setNumber < maxSets && onAdvanceSet) {
      onAdvanceSet(setNumber);
    }
  };

  // Check if center button should show advance (set locked + next available)
  const showAdvance = (setNumber: number) => {
    if (!matchState || !currentSet || matchState.isMatchComplete) return false;
    return lockedSets.has(setNumber) && matchState.enabledSets.has(setNumber + 1);
  };

  // Handle back click: unlock current set and go to previous
  const handleBackClick = useCallback((setNumber: number) => {
    if (setNumber <= 1) return; // Can't go back from set 1

    const prevSet = setNumber - 1;

    // Unlock current set
    setLockedSets((prev) => {
      const newLocked = new Set(prev);
      newLocked.delete(setNumber);
      return newLocked;
    });

    // Go back to previous set
    if (onAdvanceSet) {
      onAdvanceSet(prevSet);
    }
  }, [onAdvanceSet]);

  // Center button component with long press for back
  function CenterSetButton({
    currentSet,
    locked,
    canAdvance,
    onAdvance,
    onBack,
  }: {
    currentSet: number;
    locked: boolean;
    canAdvance: boolean;
    onAdvance: () => void;
    onBack: () => void;
  }) {
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);

    const handleTouchStart = () => {
      if (!locked) return; // Only allow long press when locked
      didLongPress.current = false;

      longPressTimer.current = setTimeout(() => {
        console.log('[CenterButton] Long press fired - going back');
        didLongPress.current = true;
        onBack();
        longPressTimer.current = null;
      }, 600);
    };

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const handleClick = () => {
      if (didLongPress.current) return;
      if (locked && canAdvance) {
        onAdvance();
      }
    };

    return (
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "w-[42px] h-[42px] rounded-lg font-bold transition-all select-none touch-manipulation flex items-center justify-center",
          locked
            ? canAdvance
              ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 cursor-pointer"
              : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            : "bg-muted text-foreground cursor-default"
        )}
        aria-label={locked ? (canAdvance ? `Avanzar al set ${currentSet + 1}` : "Set completado") : "Set actual"}
      >
        {locked && canAdvance ? (
          <span className="text-2xl">››</span>
        ) : (
          <span className="text-3xl">{currentSet}</span>
        )}
        {locked && !canAdvance && (
          <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>
        )}
      </button>
    );
  }

  // Find current set data
  const currentSetData = sets.find((s) => s.set_number === currentSet);

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Home team scores */}
      <div className="flex flex-col items-end gap-1 flex-1">
        <span className="text-xs text-muted-foreground text-right w-full">{homeTeamName}</span>
        <div className="flex gap-1">
          {sets.map((set) => (
            <ScoreBox
              key={set.id}
              value={set.points_home}
              locked={lockedSets.has(set.set_number)}
              disabled={!isSetEnabled(set.set_number)}
              onIncrement={() => onUpdateScore(set.set_number, true, 1)}
              onDecrement={() => onUpdateScore(set.set_number, true, -1)}
            />
          ))}
        </div>
      </div>

      {/* Center: Current set indicator / validate & advance button */}
      <div className="flex flex-col items-center gap-1 px-4">
        {currentSetData && (
          <CenterSetButton
            currentSet={currentSet!}
            locked={lockedSets.has(currentSet!)}
            canAdvance={showAdvance(currentSet!)}
            onAdvance={() => handleCenterClick(currentSet!)}
            onBack={() => handleBackClick(currentSet!)}
          />
        )}
      </div>

      {/* Away team scores */}
      <div className="flex flex-col items-start gap-1 flex-1">
        <span className="text-xs text-muted-foreground w-full">{awayTeamName}</span>
        <div className="flex gap-1">
          {sets.map((set) => (
            <ScoreBox
              key={set.id}
              value={set.points_away}
              locked={lockedSets.has(set.set_number)}
              disabled={!isSetEnabled(set.set_number)}
              onIncrement={() => onUpdateScore(set.set_number, false, 1)}
              onDecrement={() => onUpdateScore(set.set_number, false, -1)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
