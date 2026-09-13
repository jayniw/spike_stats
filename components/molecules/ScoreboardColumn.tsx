"use client";

import { cn } from "@/lib/utils";
import type { MatchSetWithScore } from "@/src/types/volleyball";

interface ScoreboardColumnProps {
  teamName: string;
  sets: MatchSetWithScore[];
  currentSet: number;
  isHome: boolean;
}

export function ScoreboardColumn({
  teamName,
  sets,
  currentSet,
  isHome,
}: ScoreboardColumnProps) {
  const totalSets = sets.filter((s) => s.winner_team_id && s.is_completed).length;

  return (
    <div className={cn("flex flex-col items-center gap-2", !isHome && "order-last")}>
      <div className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">
        {teamName}
      </div>

      <div className="flex gap-1">
        {sets.map((set) => (
          <div
            key={set.id}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded text-sm font-bold",
              set.set_number === currentSet && "bg-primary text-primary-foreground",
              set.is_completed &&
                set.winner_team_id &&
                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
              !set.is_completed &&
                set.set_number !== currentSet &&
                "bg-muted text-muted-foreground"
            )}
          >
            {set.is_completed
              ? isHome
                ? set.points_home
                : set.points_away
              : set.set_number === currentSet
              ? isHome
                ? set.points_home
                : set.points_away
              : "-"}
          </div>
        ))}
      </div>

      <div className="text-3xl font-bold tabular-nums">
        {sets[currentSet - 1]
          ? isHome
            ? sets[currentSet - 1].points_home
            : sets[currentSet - 1].points_away
          : 0}
      </div>
    </div>
  );
}
