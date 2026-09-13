"use client";

import { cn } from "@/lib/utils";

interface SetScoreProps {
  setNumber: number;
  pointsHome: number;
  pointsAway: number;
  targetPoints: number;
  minDiff: number;
  isCurrentSet: boolean;
  isCompleted: boolean;
  winnerTeamId?: string | null;
  homeTeamId?: string;
  className?: string;
}

export function SetScore({
  setNumber,
  pointsHome,
  pointsAway,
  targetPoints,
  minDiff,
  isCurrentSet,
  isCompleted,
  winnerTeamId,
  homeTeamId,
  className,
}: SetScoreProps) {
  const homeWon = winnerTeamId === homeTeamId;
  const diff = Math.abs(pointsHome - pointsAway);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg",
        isCurrentSet && "bg-primary/10 border border-primary",
        isCompleted && "bg-muted",
        !isCurrentSet && !isCompleted && "bg-background border",
        className
      )}
    >
      <div className="text-xs text-muted-foreground">Set {setNumber}</div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xl font-bold tabular-nums",
            isCompleted && homeWon && "text-green-600"
          )}
        >
          {pointsHome}
        </span>
        <span className="text-muted-foreground">-</span>
        <span
          className={cn(
            "text-xl font-bold tabular-nums",
            isCompleted && !homeWon && "text-green-600"
          )}
        >
          {pointsAway}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {targetPoints} pts • +{minDiff}
      </div>
    </div>
  );
}
