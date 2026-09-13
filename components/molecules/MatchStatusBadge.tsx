"use client";

import { Badge } from "@/components/atoms/Badge";
import type { MatchStatus } from "@/src/types/volleyball";

interface MatchStatusBadgeProps {
  status: MatchStatus;
}

const statusLabels: Record<MatchStatus, string> = {
  scheduled: "Programado",
  in_progress: "EN VIVO",
  completed: "Finalizado",
  abandoned: "Abandonado",
};

export function MatchStatusBadge({ status }: MatchStatusBadgeProps) {
  return <Badge status={status}>{statusLabels[status]}</Badge>;
}
