"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface PointCounterProps {
  points: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  label?: string;
}

export function PointCounter({
  points,
  onIncrement,
  onDecrement,
  disabled = false,
  label = "Nuestros Puntos",
}: PointCounterProps) {
  const [swiping, setSwiping] = useState(false);
  const [swipeHint, setSwipeHint] = useState<"up" | "down" | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || touchStartY.current === null) return;
    
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    if (deltaY < -30) {
      setSwipeHint("up");
    } else if (deltaY > 30) {
      setSwipeHint("down");
    } else {
      setSwipeHint(null);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    
    if (swipeHint === "down" && points > 0) {
      onDecrement();
    }
    
    touchStartY.current = null;
    setSwiping(false);
    setSwipeHint(null);
  };

  const handleTap = () => {
    if (disabled) return;
    onIncrement();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      
      <button
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        className={cn(
          "relative w-24 h-24 rounded-2xl flex items-center justify-center",
          "text-4xl font-bold transition-all select-none",
          "active:scale-95 touch-manipulation",
          disabled
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
          swiping && "scale-95"
        )}
      >
        {points}
        
        {swipeHint === "down" && (
          <div className="absolute -bottom-8 text-xs text-destructive animate-bounce">
            ↓ Restar
          </div>
        )}
      </button>
      
      <span className="text-xs text-muted-foreground">
        Toca +1 · Swipe ↓ -1
      </span>
    </div>
  );
}
