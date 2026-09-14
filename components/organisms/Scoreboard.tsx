"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { MatchSetWithScore, MatchRow } from "@/src/types/volleyball";

interface ScoreboardProps {
  match: MatchRow;
  homeTeamName: string;
  awayTeamName: string;
  sets: MatchSetWithScore[];
  onUpdateScore: (setNumber: number, isHome: boolean, delta: number) => void;
}

function ScoreBox({
  value,
  onIncrement,
  onDecrement,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const [locked, setLocked] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    
    longPressTimer.current = setTimeout(() => {
      setLocked((prev) => !prev);
      longPressTimer.current = null;
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    if (deltaY > 30 && !locked && value > 0) {
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
        "active:scale-95 transition-all select-none",
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
}: ScoreboardProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Home team */}
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-muted-foreground">
          {homeTeamName}
        </span>
        <div className="flex gap-1">
          {sets.map((set) => (
            <ScoreBox
              key={set.id}
              value={set.points_home}
              onIncrement={() => onUpdateScore(set.set_number, true, 1)}
              onDecrement={() => onUpdateScore(set.set_number, true, -1)}
            />
          ))}
        </div>
      </div>

      {/* Away team */}
      <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-muted-foreground">
            {awayTeamName}
          </span>
        <div className="flex gap-1">
          {sets.map((set) => (
            <ScoreBox
              key={set.id}
              value={set.points_away}
              onIncrement={() => onUpdateScore(set.set_number, false, 1)}
              onDecrement={() => onUpdateScore(set.set_number, false, -1)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
