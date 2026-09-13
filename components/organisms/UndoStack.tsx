"use client";

import { useState } from "react";
import { Undo2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlayEventWithQuality } from "@/src/types/volleyball";

interface UndoStackProps {
  events: PlayEventWithQuality[];
  onUndo: () => void;
  canUndo?: boolean;
}

const fundamentalLabels: Record<string, string> = {
  serve: "Saque",
  reception: "Recepción",
  attack: "Ataque",
  block: "Bloqueo",
  set: "Colocación",
  defense: "Defensa",
};

export function UndoStack({ events, onUndo, canUndo = true }: UndoStackProps) {
  const [expanded, setExpanded] = useState(false);
  const recentEvents = events.slice(-5).reverse();

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo || events.length === 0}
            className="gap-2"
          >
            <Undo2 className="size-4" />
            <span>Undo</span>
            {events.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">
                {events.length}
              </span>
            )}
          </Button>
        </div>

        {events.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            <span className="text-xs text-muted-foreground">Historial</span>
            {expanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </Button>
        )}
      </div>

      {expanded && recentEvents.length > 0 && (
        <div className="space-y-1 border-t pt-2">
          <div className="text-xs font-medium text-muted-foreground">
            Últimos {recentEvents.length} eventos
          </div>
          {recentEvents.map((event, idx) => (
            <div
              key={event.id}
              className={cn(
                "flex items-center justify-between text-xs p-1.5 rounded",
                idx === 0 && "bg-muted"
              )}
            >
              <span>
                {fundamentalLabels[event.fundamental]} → {event.quality}
              </span>
              <span className="text-muted-foreground">
                {new Date(event.created_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
