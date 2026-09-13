"use client";

import Link from "next/link";
import { useMatches } from "@/hooks/useMatches";
import { Button } from "@/components/ui/button";

type Match = {
  id: string;
  organization_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue: string | null;
  tournament: string | null;
  format: "best_of_3" | "best_of_5";
  status: "scheduled" | "in_progress" | "completed";
  current_set: number;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

export default function MatchesPage() {
  const { data: matches, isLoading, error } = useMatches();

  if (isLoading) {
    return <div className="text-center py-8">Cargando partidos...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error al cargar partidos
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <Link href="/matches/new">
          <Button>Nuevo Partido</Button>
        </Link>
      </div>

      {!matches || matches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay partidos todavía</p>
          <Link href="/matches/new" className="mt-4 inline-block">
            <Button variant="outline">Crear primer partido</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match: Match) => (
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
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      match.status === "in_progress"
                        ? "bg-green-100 text-green-700"
                        : match.status === "completed"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {match.status === "in_progress"
                      ? "EN VIVO"
                      : match.status === "completed"
                      ? "Finalizado"
                      : "Programado"}
                  </span>
                  <div className="text-sm text-muted-foreground mt-1">
                    Set {match.current_set}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
