"use client";

import { StatCard } from "@/components/molecules/StatCard";
import { Badge } from "@/components/ui/badge";
import type { PlayerMatchStats, PlayerSeasonStats } from "@/src/types/volleyball";

interface PlayerDetailCardsProps {
  stats: PlayerMatchStats | PlayerSeasonStats[] | null;
  isLoading?: boolean;
}

function aggregateSeasonStats(stats: PlayerSeasonStats[]) {
  if (stats.length === 0) {
    return {
      receptions_total: 0,
      receptions_excellent: 0,
      receptions_positive: 0,
      receptions_negative: 0,
      receptions_error: 0,
      reception_rating: 0,
      attacks_total: 0,
      attacks_kills: 0,
      attacks_blocked: 0,
      attacks_out: 0,
      attacks_net: 0,
      attacks_errors: 0,
      attacks_in_play: 0,
      attack_efficiency: 0,
      blocks_total: 0,
      blocks_kills: 0,
      blocks_touches: 0,
      blocks_assisted: 0,
      blocks_errors: 0,
      sets_total: 0,
      sets_assists: 0,
      sets_errors: 0,
      defenses_total: 0,
      defenses_digs: 0,
      defenses_errors: 0,
    };
  }

  const total = stats.reduce(
    (acc, s) => ({
      receptions_total: acc.receptions_total + s.receptions_total,
      receptions_excellent: acc.receptions_excellent + s.receptions_excellent,
      receptions_positive: acc.receptions_positive + s.receptions_positive,
      receptions_negative: acc.receptions_negative + s.receptions_negative,
      receptions_error: acc.receptions_error + s.receptions_error,
      attacks_total: acc.attacks_total + s.attacks_total,
      attacks_kills: acc.attacks_kills + s.attacks_kills,
      attacks_blocked: acc.attacks_blocked + s.attacks_blocked,
      attacks_out: acc.attacks_out + s.attacks_out,
      attacks_net: acc.attacks_net + s.attacks_net,
      attacks_errors: acc.attacks_errors + s.attacks_errors,
      attacks_in_play: acc.attacks_in_play + s.attacks_in_play,
      blocks_total: acc.blocks_total + s.blocks_total,
      blocks_kills: acc.blocks_kills + s.blocks_kills,
      blocks_touches: acc.blocks_touches + s.blocks_touches,
      blocks_assisted: acc.blocks_assisted + s.blocks_assisted,
      blocks_errors: acc.blocks_errors + s.blocks_errors,
      sets_total: acc.sets_total + s.sets_total,
      sets_assists: acc.sets_assists + s.sets_assists,
      sets_errors: acc.sets_errors + s.sets_errors,
      defenses_total: acc.defenses_total + s.defenses_total,
      defenses_digs: acc.defenses_digs + s.defenses_digs,
      defenses_errors: acc.defenses_errors + s.defenses_errors,
    }),
    {
      receptions_total: 0,
      receptions_excellent: 0,
      receptions_positive: 0,
      receptions_negative: 0,
      receptions_error: 0,
      attacks_total: 0,
      attacks_kills: 0,
      attacks_blocked: 0,
      attacks_out: 0,
      attacks_net: 0,
      attacks_errors: 0,
      attacks_in_play: 0,
      blocks_total: 0,
      blocks_kills: 0,
      blocks_touches: 0,
      blocks_assisted: 0,
      blocks_errors: 0,
      sets_total: 0,
      sets_assists: 0,
      sets_errors: 0,
      defenses_total: 0,
      defenses_digs: 0,
      defenses_errors: 0,
    }
  );

  return {
    ...total,
    reception_rating:
      total.receptions_total === 0
        ? 0
        : Math.round(
            ((total.receptions_excellent * 3 +
              total.receptions_positive * 2 +
              total.receptions_negative * 1) /
              total.receptions_total) *
              100
          ) / 100,
    attack_efficiency:
      total.attacks_total === 0
        ? 0
        : Math.round(
            ((total.attacks_kills - total.attacks_errors) /
              total.attacks_total) *
              1000
          ) / 1000,
  };
}

function getStatsDetail(
  stats: PlayerMatchStats | PlayerSeasonStats[] | null
) {
  if (!stats) return null;
  if (Array.isArray(stats)) return aggregateSeasonStats(stats);
  return stats;
}

function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export function PlayerDetailCards({ stats, isLoading }: PlayerDetailCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const detail = getStatsDetail(stats);

  if (!detail) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay estadísticas disponibles
      </div>
    );
  }

  const receptionMetrics = [
    { label: "Total", value: detail.receptions_total },
    { label: "Excelente", value: detail.receptions_excellent, percentage: pct(detail.receptions_excellent, detail.receptions_total) },
    { label: "Positivo", value: detail.receptions_positive, percentage: pct(detail.receptions_positive, detail.receptions_total) },
    { label: "Negativo", value: detail.receptions_negative, percentage: pct(detail.receptions_negative, detail.receptions_total) },
    { label: "Error", value: detail.receptions_error, percentage: pct(detail.receptions_error, detail.receptions_total) },
    { label: "Rating", value: detail.reception_rating },
  ];

  const attackMetrics = [
    { label: "Total", value: detail.attacks_total },
    { label: "Puntos", value: detail.attacks_kills, percentage: pct(detail.attacks_kills, detail.attacks_total) },
    { label: "Bloqueados", value: detail.attacks_blocked ?? 0, percentage: pct(detail.attacks_blocked ?? 0, detail.attacks_total) },
    { label: "Fuera", value: detail.attacks_out ?? 0, percentage: pct(detail.attacks_out ?? 0, detail.attacks_total) },
    { label: "Red", value: detail.attacks_net ?? 0, percentage: pct(detail.attacks_net ?? 0, detail.attacks_total) },
    { label: "En Juego", value: detail.attacks_in_play, percentage: pct(detail.attacks_in_play, detail.attacks_total) },
    { label: "Eficiencia", value: detail.attack_efficiency },
  ];

  const blockMetrics = [
    { label: "Total", value: detail.blocks_total },
    { label: "Puntos", value: detail.blocks_kills, percentage: pct(detail.blocks_kills, detail.blocks_total) },
    { label: "Toques", value: detail.blocks_touches, percentage: pct(detail.blocks_touches, detail.blocks_total) },
    { label: "Asistidos", value: detail.blocks_assisted, percentage: pct(detail.blocks_assisted, detail.blocks_total) },
    { label: "Errores", value: detail.blocks_errors, percentage: pct(detail.blocks_errors, detail.blocks_total) },
  ];

  const serveMetrics = [
    { label: "Total", value: detail.sets_total },
    { label: "Asistencias", value: detail.sets_assists, percentage: pct(detail.sets_assists, detail.sets_total) },
    { label: "Errores", value: detail.sets_errors, percentage: pct(detail.sets_errors, detail.sets_total) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium">Recepción</h3>
          <Badge variant="secondary">
            Rating: {detail.reception_rating.toFixed(2)}
          </Badge>
        </div>
        <StatCard title="Recepción" metrics={receptionMetrics} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium">Ataque</h3>
          <Badge variant="secondary">
            Eff: {detail.attack_efficiency.toFixed(3)}
          </Badge>
        </div>
        <StatCard title="Ataque" metrics={attackMetrics} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium">Bloqueo</h3>
        </div>
        <StatCard title="Bloqueo" metrics={blockMetrics} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium">Saque / Colocación</h3>
        </div>
        <StatCard title="Saque / Colocación" metrics={serveMetrics} />
      </div>
    </div>
  );
}
