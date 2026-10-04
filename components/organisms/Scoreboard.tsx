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

function ScoreBox({
  value,
  onIncrement,
  onDecrement,
  locked,
  disabled,
  onToggleLock,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  locked: boolean;
  disabled: boolean;
  onToggleLock: () => void;
}) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const [swipeHint, setSwipeHint] = useState<"down" | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Allow touch on unlocked sets (locked = completed, shouldn't modify)
    if (locked) return;
    didLongPress.current = false;
    touchStartY.current = e.touches[0].clientY;

    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onToggleLock();
      longPressTimer.current = null;
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Allow swipe on unlocked sets (locked = completed, shouldn't decrement)
    // Use locked instead of disabled to avoid timing issues with matchState
    if (locked || touchStartY.current === null) return;

    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    // Reduced threshold from 20 to 15 for easier swipe on mobile
    if (deltaY > 15) {
      setSwipeHint("down");
    } else {
      setSwipeHint(null);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    console.log('[ScoreBox] handleTouchEnd', { swipeHint, value, locked, hintActive: swipeHint === "down" });

    if (swipeHint === "down" && value > 0 && !locked) {
      console.log('[ScoreBox] Decrementing score');
      onDecrement();
    }

    touchStartY.current = null;
    setSwipeHint(null);
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
      onTouchMove={handleTouchMove}
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
      {swipeHint === "down" && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-destructive whitespace-nowrap bg-destructive/90 text-destructive-foreground px-1.5 py-0.5 rounded">
          ↓ -1
        </span>
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

  const handleToggleLock = useCallback(
    (setNumber: number) => {
      setLockedSets((prev) => {
        const newLocked = new Set(prev);
        if (newLocked.has(setNumber)) {
          newLocked.delete(setNumber);
        } else {
          newLocked.add(setNumber);

          // Notify when a set is locked
          if (onSetLocked) {
            onSetLocked(setNumber);
          }
        }
        return newLocked;
      });
    },
    [onSetLocked]
  );

  // Determine if a set is enabled (editable)
  const isSetEnabled = (setNumber: number) => {
    if (!matchState) return setNumber === 1;
    return matchState.enabledSets.has(setNumber) && !matchState.isMatchComplete;
  };

  // Check if current set is locked and can advance
  const canAdvanceSet = () => {
    if (!matchState || !currentSet || matchState.isMatchComplete) return false;
    return lockedSets.has(currentSet) && matchState.enabledSets.has(currentSet + 1);
  };

  const handleAdvanceClick = () => {
    if (canAdvanceSet() && onAdvanceSet && currentSet) {
      onAdvanceSet(currentSet);
    }
  };

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
              onToggleLock={() => handleToggleLock(set.set_number)}
            />
          ))}
        </div>
      </div>

      {/* Center: Current set indicator / advance button */}
      <div className="flex flex-col items-center gap-1 px-4">
        {currentSetData && (
          <button
            onClick={handleAdvanceClick}
            disabled={!canAdvanceSet() || !onAdvanceSet}
            className={cn(
              "w-[42px] h-[42px] rounded-lg font-bold transition-all select-none touch-manipulation flex items-center justify-center",
              canAdvanceSet()
                ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 cursor-pointer"
                : lockedSets.has(currentSet ?? 0)
                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                : "bg-muted text-foreground cursor-default"
            )}
            aria-label={canAdvanceSet() && currentSet ? `Avanzar al set ${currentSet + 1}` : "Set actual"}
          >
            {canAdvanceSet() ? (
              <span className="text-2xl">››</span>
            ) : (
              <span className="text-3xl">{currentSet}</span>
            )}
            {lockedSets.has(currentSet ?? 0) && !canAdvanceSet() && (
              <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>
            )}
          </button>
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
              onToggleLock={() => handleToggleLock(set.set_number)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
