"use client";

import { cn } from "@/lib/utils";
import type { ServingTeam } from "@/src/types/volleyball";

interface RotationDisplayProps {
  rotation: number;
  servingTeam: ServingTeam | null;
  serverJerseyNumber?: number;
  serverName?: string;
  className?: string;
}

export function RotationDisplay({
  rotation,
  servingTeam,
  serverJerseyNumber,
  serverName,
  className,
}: RotationDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      <span className="font-medium">Rot {rotation}</span>
      <span>|</span>
      <span>
        Sirve:{" "}
        <span className="font-medium text-foreground">
          {servingTeam === "home" ? "Local" : "Visitante"}
        </span>
      </span>
      {serverJerseyNumber && (
        <>
          <span>|</span>
          <span>
            Servidor:{" "}
            <span className="font-medium text-foreground">
              #{serverJerseyNumber} {serverName}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
