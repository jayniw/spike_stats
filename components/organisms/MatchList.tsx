"use client";

import Link from "next/link";
import { MatchStatusBadge } from "@/components/molecules/MatchStatusBadge";
import type { MatchRow } from "@/src/types/volleyball";

interface MatchListProps {
  matches: (MatchRow & {
    home_team?: { name: string } | null;
    away_team?: { name: string } | null;
  })[];
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay partidos</p>
        <Link
          href="/matches/new"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Crear primer partido
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <Link
          key={match.id}
          href={`/match/${match.id}`}
          className="block border rounded-lg p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">
                {match.home_team?.name} vs {match.away_team?.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(match.match_date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {match.tournament && ` • ${match.tournament}`}
              </div>
            </div>
            <div className="text-right space-y-1">
              <MatchStatusBadge status={match.status} />
              <div className="text-sm text-muted-foreground">
                Set {match.current_set}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
