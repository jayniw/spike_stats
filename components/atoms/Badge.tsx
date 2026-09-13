"use client";

import { Badge as UIBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/src/types/volleyball";

interface BadgeProps extends React.ComponentProps<typeof UIBadge> {
  status?: MatchStatus;
}

const statusToVariant: Record<MatchStatus, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "default",
  in_progress: "default",
  completed: "secondary",
  abandoned: "destructive",
};

const statusClasses: Record<MatchStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  abandoned: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300",
};

export function Badge({ className, status, children, ...props }: BadgeProps) {
  const variant = status ? statusToVariant[status] : "default";
  const statusClass = status ? statusClasses[status] : "";

  return (
    <UIBadge
      variant={variant}
      className={cn(statusClass, className)}
      {...props}
    >
      {children}
    </UIBadge>
  );
}

export type { BadgeProps };
