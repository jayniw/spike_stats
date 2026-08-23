"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "destructive";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastOptions {
  id: number;
  variant: ToastVariant;
  leaving: boolean;
}

const TOAST_DURATION_MS = 5000;
const TOAST_EXIT_MS = 200;

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toastVariants: Record<ToastVariant, { card: string; title: string }> = {
  default: {
    card: "border-border bg-card text-card-foreground",
    title: "text-foreground",
  },
  success: {
    card: "border-success/60 bg-success/10",
    title: "text-success",
  },
  destructive: {
    card: "border-destructive/60 bg-destructive/10",
    title: "text-destructive",
  },
};

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timersRef = React.useRef(new Map<number, Set<ReturnType<typeof setTimeout>>>());
  const idCounter = React.useRef(0);

  const clearTimers = React.useCallback((id: number) => {
    const timers = timersRef.current.get(id);
    if (timers) {
      for (const timer of timers) clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const startExit = React.useCallback(
    (id: number, delay: number) => {
      clearTimers(id);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
        const removeTimer = setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
          clearTimers(id);
        }, TOAST_EXIT_MS);
        timersRef.current.set(id, new Set([removeTimer]));
      }, delay);
      timersRef.current.set(id, new Set([timer]));
    },
    [clearTimers]
  );

  const dismiss = React.useCallback(
    (id: number) => {
      startExit(id, 0);
    },
    [startExit]
  );

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: ToastOptions) => {
      const id = ++idCounter.current;
      setToasts((prev) => [...prev, { id, title, description, variant, leaving: false }]);
      startExit(id, TOAST_DURATION_MS);
    },
    [startExit]
  );

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        for (const t of timer) clearTimeout(t);
      }
      timers.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96">
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.variant === "destructive" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-200 ease-out sm:w-96",
              toastVariants[item.variant].card,
              item.leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className={cn("text-sm font-semibold", toastVariants[item.variant].title)}>
                {item.title}
              </p>
              {item.description ? (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Cerrar"
              className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un <ToastProvider>");
  }
  return context;
}

export { ToastProvider, useToast };
export type { ToastOptions };
