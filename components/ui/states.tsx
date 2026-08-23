import * as React from "react";
import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateIcon = React.ComponentType<{ className?: string }>;

const SKELETON_WIDTHS = [
  "w-full",
  "w-11/12",
  "w-10/12",
  "w-9/12",
  "w-8/12",
] as const;

interface StateEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  descripcion?: string;
  icon?: StateIcon | null;
}

function StateEmpty({
  title = "No hay datos todavía",
  descripcion,
  icon: Icon = Inbox,
  className,
  ...props
}: StateEmptyProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {Icon ? (
        <Icon className="size-10 shrink-0 text-muted-foreground/50" />
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {descripcion ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {descripcion}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface StateErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  descripcion?: string;
  onRetry?: () => void;
}

function StateError({
  title,
  descripcion,
  onRetry,
  className,
  ...props
}: StateErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      <CircleAlert className="size-10 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-destructive">{title}</p>
        {descripcion ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {descripcion}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

interface StateLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

function StateLoading({ lines = 3, className, ...props }: StateLoadingProps) {
  const rows = Array.from({ length: Math.max(0, lines) }, (_, index) => index);

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "space-y-3 rounded-lg border bg-card p-6",
        className
      )}
      {...props}
    >
      <span className="sr-only">Cargando…</span>
      <LoaderCircle
        aria-hidden="true"
        className="size-5 animate-spin text-muted-foreground"
      />
      <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row}
            className={cn(
              "h-4 animate-pulse rounded bg-muted",
              SKELETON_WIDTHS[row % SKELETON_WIDTHS.length]
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface StateInlineProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

function StateInline({ label = "Cargando…", className, ...props }: StateInlineProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-4 shrink-0 animate-spin"
      />
      <span>{label}</span>
    </span>
  );
}

export { StateEmpty, StateError, StateInline, StateLoading };
