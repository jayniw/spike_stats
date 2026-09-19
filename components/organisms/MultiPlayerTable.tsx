"use client";

import { useState } from "react";
import type { PlayerMatchStats, PlayerSeasonStats } from "@/src/types/volleyball";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number?: number;
}

interface MultiPlayerTableProps {
  players: PlayerRow[];
  statsMap: Map<string, PlayerMatchStats | PlayerSeasonStats[] | null>;
  isLoading?: boolean;
}

type SortKey = "reception_rating" | "receptions_total" | "attacks_total" | "attack_efficiency" | "blocks_total" | "attacks_kills" | "blocks_kills";
type SortDir = "asc" | "desc";

function getAggregateStats(stats: PlayerMatchStats | PlayerSeasonStats[] | null) {
  if (!stats) {
    return {
      receptions_total: 0,
      reception_rating: 0,
      attacks_total: 0,
      attacks_kills: 0,
      attack_efficiency: 0,
      blocks_total: 0,
      blocks_kills: 0,
    };
  }

  if (Array.isArray(stats)) {
    // Season stats: aggregate across matches
    if (stats.length === 0) {
      return {
        receptions_total: 0,
        reception_rating: 0,
        attacks_total: 0,
        attacks_kills: 0,
        attack_efficiency: 0,
        blocks_total: 0,
        blocks_kills: 0,
      };
    }
    const total = stats.reduce(
      (acc, s) => ({
        receptions_total: acc.receptions_total + s.receptions_total,
        receptions_excellent: acc.receptions_excellent + s.receptions_excellent,
        receptions_positive: acc.receptions_positive + s.receptions_positive,
        receptions_negative: acc.receptions_negative + s.receptions_negative,
        attacks_total: acc.attacks_total + s.attacks_total,
        attacks_kills: acc.attacks_kills + s.attacks_kills,
        attacks_errors: acc.attacks_errors + s.attacks_errors,
        blocks_total: acc.blocks_total + s.blocks_total,
        blocks_kills: acc.blocks_kills + s.blocks_kills,
      }),
      {
        receptions_total: 0,
        receptions_excellent: 0,
        receptions_positive: 0,
        receptions_negative: 0,
        attacks_total: 0,
        attacks_kills: 0,
        attacks_errors: 0,
        blocks_total: 0,
        blocks_kills: 0,
      }
    );
    const reception_rating =
      total.receptions_total === 0
        ? 0
        : Math.round(
            ((total.receptions_excellent * 3 +
              total.receptions_positive * 2 +
              total.receptions_negative * 1) /
              total.receptions_total) *
              100
          ) / 100;
    const attack_efficiency =
      total.attacks_total === 0
        ? 0
        : Math.round(
            ((total.attacks_kills - total.attacks_errors) /
              total.attacks_total) *
              1000
          ) / 1000;

    return {
      receptions_total: total.receptions_total,
      reception_rating,
      attacks_total: total.attacks_total,
      attacks_kills: total.attacks_kills,
      attack_efficiency,
      blocks_total: total.blocks_total,
      blocks_kills: total.blocks_kills,
    };
  }

  // Single match stats
  return {
    receptions_total: stats.receptions_total,
    reception_rating: stats.reception_rating,
    attacks_total: stats.attacks_total,
    attacks_kills: stats.attacks_kills,
    attack_efficiency: stats.attack_efficiency,
    blocks_total: stats.blocks_total,
    blocks_kills: stats.blocks_kills,
  };
}

const integerFormatter = new Intl.NumberFormat("es-ES");
const decimalFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function MultiPlayerTable({
  players,
  statsMap,
  isLoading,
}: MultiPlayerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("reception_rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const playersWithStats = players
    .map((player) => ({
      player,
      stats: getAggregateStats(statsMap.get(player.id) ?? null),
    }))
    .sort((a, b) => {
      const aVal = a.stats[sortKey];
      const bVal = b.stats[sortKey];
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (playersWithStats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay jugadores con estadísticas
      </div>
    );
  }

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return (
      <span className="ml-1 text-xs">
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const columns: { key: SortKey; label: string; help: string }[] = [
    { key: "reception_rating", label: "Rec. Rating", help: "Rating de recepción: promedio ponderado (3=excelente, 2=positiva, 1=negativa)" },
    { key: "receptions_total", label: "Rec. Total", help: "Total de recepciones realizadas" },
    { key: "attack_efficiency", label: "Atq. Ef.", help: "Eficiencia de ataque: (kills - errores) / total ataques" },
    { key: "attacks_total", label: "Atq. Total", help: "Total de ataques realizados" },
    { key: "attacks_kills", label: "Atq. Kills", help: "Ataques que terminaron en punto (kills)" },
    { key: "blocks_total", label: "Bloq. Total", help: "Total de bloqueos realizados" },
    { key: "blocks_kills", label: "Bloq. Kills", help: "Bloqueos que terminaron en punto" },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b">
            <th className="text-center py-2 px-2 sticky left-0 bg-background z-10 w-10">
              #
            </th>
            <th className="text-left py-2 px-3 sticky left-10 bg-background z-10">
              Jugador
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-right py-2 px-2 cursor-pointer select-none"
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{col.label}</span>
                  <Popover>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="size-3.5 text-muted-foreground hover:text-foreground shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent side="top" align="center" className="w-56 text-xs">
                      {col.help}
                    </PopoverContent>
                  </Popover>
                  <SortIndicator columnKey={col.key} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {playersWithStats.map(({ player, stats }) => (
            <tr key={player.id} className="border-b hover:bg-muted/50">
              <td className="text-center py-2 px-2 sticky left-0 bg-background z-10 font-mono text-muted-foreground">
                {player.jersey_number ?? "-"}
              </td>
              <td className="py-2 px-3 sticky left-10 bg-background z-10 font-medium whitespace-nowrap">
                {player.first_name} {player.last_name}
              </td>
              <td className="text-right py-2 px-2">
                {decimalFormatter.format(stats.reception_rating)}
              </td>
              <td className="text-right py-2 px-2">
                {integerFormatter.format(stats.receptions_total)}
              </td>
              <td className="text-right py-2 px-2">
                {decimalFormatter.format(stats.attack_efficiency)}
              </td>
              <td className="text-right py-2 px-2">
                {integerFormatter.format(stats.attacks_total)}
              </td>
              <td className="text-right py-2 px-2">
                {integerFormatter.format(stats.attacks_kills)}
              </td>
              <td className="text-right py-2 px-2">
                {integerFormatter.format(stats.blocks_total)}
              </td>
              <td className="text-right py-2 px-2">
                {integerFormatter.format(stats.blocks_kills)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
