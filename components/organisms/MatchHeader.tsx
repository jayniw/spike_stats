"use client";

import { useEffect, useState } from "react";
import { RotationDisplay } from "@/components/molecules/RotationDisplay";
import type { MatchRow, ServingTeam } from "@/src/types/volleyball";

interface MatchHeaderProps {
  match: MatchRow;
  homeTeamName: string;
  awayTeamName: string;
  currentRotation?: number;
  servingTeam?: ServingTeam | null;
  serverJerseyNumber?: number;
  serverName?: string;
  onStart?: () => void;
}

export function MatchHeader({
  match,
  homeTeamName,
  awayTeamName,
  currentRotation = 1,
  servingTeam,
  serverJerseyNumber,
  serverName,
  onStart,
}: MatchHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (match.status !== "in_progress" || !match.started_at) return;

    const startTime = new Date(match.started_at).getTime();
    
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [match.status, match.started_at]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="border-b bg-background sticky top-14 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h1 className="font-bold text-lg truncate">
            {homeTeamName} vs {awayTeamName}
          </h1>

          {match.status === "in_progress" && (
            <div className="text-sm font-mono text-muted-foreground shrink-0">
              {formatTime(elapsed)}
            </div>
          )}
        </div>

        {match.status === "in_progress" && (
          <RotationDisplay
            rotation={currentRotation}
            servingTeam={servingTeam ?? null}
            serverJerseyNumber={serverJerseyNumber}
            serverName={serverName}
            className="mt-2"
          />
        )}

        {match.status === "scheduled" && onStart && (
          <button
            onClick={onStart}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/80"
          >
            Iniciar Partido
          </button>
        )}
      </div>
    </div>
  );
}
