"use client";

import { useStatsStore } from "@/stores/statsStore";
import { usePlayersByTeam } from "@/hooks/usePlayersBySeason";
import { useMultiPlayerStats } from "@/hooks/useMultiPlayerStats";
import { StatsFilters } from "@/components/molecules/StatsFilters";
import { MultiPlayerTable } from "@/components/organisms/MultiPlayerTable";
import { PlayerDetailCards } from "@/components/organisms/PlayerDetailCards";
import { BarChart2 } from "lucide-react";

export default function StatsPage() {
  const { season, teamId, matchId, playerId } = useStatsStore();

  const { data: players, isLoading: loadingPlayers } =
    usePlayersByTeam(teamId);

  const playerIds = players?.map((p) => p.id) || [];

  const { statsMap, isLoading: loadingStats } = useMultiPlayerStats({
    playerIds,
    matchId,
    season,
  });

  const showEmpty = !season || !teamId;
  const showTable = season && teamId && !playerId;
  const showCards = season && teamId && !!playerId;

  return (
    <div className="space-y-6 pb-safe">
      <div className="flex items-center gap-2">
        <BarChart2 className="size-5" />
        <h1 className="text-xl font-bold">Estadísticas</h1>
      </div>

      <StatsFilters />

      {showEmpty && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart2 className="size-12 mx-auto mb-4 opacity-50" />
          <p>
            {!season
              ? "Selecciona una temporada para ver estadísticas"
              : "Selecciona un equipo para ver estadísticas"}
          </p>
        </div>
      )}

      {showTable && (
        <MultiPlayerTable
          players={players || []}
          statsMap={statsMap}
          isLoading={loadingPlayers || loadingStats}
        />
      )}

      {showCards && (
        <PlayerDetailCards
          stats={statsMap.get(playerId) ?? null}
          isLoading={loadingStats}
        />
      )}
    </div>
  );
}
