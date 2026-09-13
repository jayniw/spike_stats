"use client";

import { EventButton } from "@/components/molecules/EventButton";
import type { Fundamental } from "@/src/types/volleyball";

interface EventGridProps {
  onEvent: (fundamental: Fundamental, quality: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

const fundamentals: { fundamental: Fundamental; label: string; qualities: string[] }[] = [
  {
    fundamental: "serve",
    label: "Saque",
    qualities: ["ace", "in_play", "error"],
  },
  {
    fundamental: "reception",
    label: "Recepción",
    qualities: ["excellent", "positive", "negative", "error"],
  },
  {
    fundamental: "attack",
    label: "Ataque",
    qualities: ["kill", "in_play", "error"],
  },
  {
    fundamental: "block",
    label: "Bloqueo",
    qualities: ["kill", "touch", "assisted", "error"],
  },
  {
    fundamental: "set",
    label: "Colocación",
    qualities: ["assist", "error"],
  },
  {
    fundamental: "defense",
    label: "Defensa",
    qualities: ["dig", "error"],
  },
];

const qualityLabels: Record<string, string> = {
  ace: "Ace",
  in_play: "En Juego",
  error: "Error",
  excellent: "Excelente",
  positive: "Positiva",
  negative: "Negativa",
  kill: "Punto",
  touch: "Toque",
  assisted: "Asistido",
  assist: "Asistencia",
  dig: "Salvada",
};

export function EventGrid({ onEvent, disabled, loading }: EventGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 p-2">
      {fundamentals.map(({ fundamental, label, qualities }) => (
        <div key={fundamental} className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground text-center">
            {label}
          </div>
          <div className="flex flex-col gap-1">
            {qualities.map((quality) => (
              <EventButton
                key={`${fundamental}-${quality}`}
                fundamental={fundamental}
                quality={quality}
                label={qualityLabels[quality]}
                onClick={() => onEvent(fundamental, quality)}
                disabled={disabled}
                loading={loading}
                className="w-full"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
