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
  const touchStartY = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || locked) return;
    touchStartY.current = e.touches[0].clientY;
    didLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onToggleLock();
      longPressTimer.current = null;
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (touchStartY.current === null || disabled || locked) return;
    
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // If swiping down significantly, prevent page refresh and decrease score
    if (deltaY > 30 && value > 0) {
      e.preventDefault();
      onDecrement();
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartY.current = null;
  };

  const handleClick = () => {
    if (!locked && !disabled && !didLongPress.current) {
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
        "active:scale-95 transition-all select-none",
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

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Home team */}
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-muted-foreground">{homeTeamName}</span>
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

      {/* Away team */}
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-muted-foreground">{awayTeamName}</span>
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
