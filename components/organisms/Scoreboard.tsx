"use client";

import { ScoreboardColumn } from "@/components/molecules/ScoreboardColumn";
import type { MatchSetWithScore, MatchRow } from "@/src/types/volleyball";

interface ScoreboardProps {
  match: MatchRow;
  homeTeamName: string;
  awayTeamName: string;
  sets: MatchSetWithScore[];
}

export function Scoreboard({
  match,
  homeTeamName,
  awayTeamName,
  sets,
}: ScoreboardProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <ScoreboardColumn
        teamName={homeTeamName}
        sets={sets}
        currentSet={match.current_set}
        isHome={true}
      />

      <div className="text-center">
        <div className="text-xs text-muted-foreground">Set {match.current_set}</div>
      </div>

      <ScoreboardColumn
        teamName={awayTeamName}
        sets={sets}
        currentSet={match.current_set}
        isHome={false}
      />
    </div>
  );
}
