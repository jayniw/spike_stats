"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Player = {
  id: string;
  full_name: string;
  number: number;
  position: string;
  active?: boolean;
};

type PlayerSelectorProps = {
  players: Player[];
  selectedId: string | null;
  onSelect: (player: Player) => void;
  disabled?: boolean;
  className?: string;
};

const POSITION_LABELS: Record<string, string> = {
  setter: "Colocador",
  opposite: "Opuesto",
  middle: "Central",
  receiver: "Receptor",
  libero: "Líbero",
};

export function PlayerSelector({
  players,
  selectedId,
  onSelect,
  disabled = false,
  className,
}: PlayerSelectorProps) {
  const activePlayers = players.filter((p) => p.active ?? true);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">Seleccionar jugador</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {activePlayers.map((player) => {
          const isSelected = player.id === selectedId;
          return (
            <Button
              key={player.id}
              variant={isSelected ? "default" : "outline"}
              size="lg"
              disabled={disabled}
              onClick={() => onSelect(player)}
              className={cn(
                "flex h-auto min-h-14 flex-col items-center gap-0.5 p-2",
                isSelected && "ring-2 ring-primary ring-offset-2",
              )}
            >
              <span className="text-xl font-bold">{player.number}</span>
              <span className="truncate text-xs leading-tight">{player.full_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {POSITION_LABELS[player.position] ?? player.position}
              </span>
            </Button>
          );
        })}
      </div>
      {activePlayers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay jugadores activos en este equipo.
        </p>
      )}
    </div>
  );
}

export type { Player, PlayerSelectorProps };
