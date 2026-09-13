"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { Fundamental } from "@/src/types/volleyball";

interface EventButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fundamental: Fundamental;
  quality: string;
  label: string;
  loading?: boolean;
}

const fundamentalStyles: Record<Fundamental, string> = {
  serve: "bg-blue-500 hover:bg-blue-600 text-white",
  reception: "bg-green-500 hover:bg-green-600 text-white",
  attack: "bg-red-500 hover:bg-red-600 text-white",
  block: "bg-purple-500 hover:bg-purple-600 text-white",
  set: "bg-orange-500 hover:bg-orange-600 text-white",
  defense: "bg-teal-500 hover:bg-teal-600 text-white",
};

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

const EventButton = forwardRef<HTMLButtonElement, EventButtonProps>(
  ({ className, fundamental, quality, label, loading, disabled, ...props }, ref) => {
    const displayLabel = label || qualityLabels[quality] || quality;

    return (
      <button
        ref={ref}
        className={cn(
          "min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg font-medium text-sm transition-all",
          "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          fundamentalStyles[fundamental],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? "..." : displayLabel}
      </button>
    );
  }
);

EventButton.displayName = "EventButton";

export { EventButton };
export type { EventButtonProps };
