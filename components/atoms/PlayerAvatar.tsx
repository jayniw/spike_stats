"use client";

import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  jerseyNumber: number;
  photoUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PlayerAvatar({
  jerseyNumber,
  photoUrl,
  isSelected = false,
  onClick,
}: PlayerAvatarProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold",
        "active:scale-95 transition-all select-none",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`#${jerseyNumber}`}
          className="w-full h-full rounded-lg object-cover"
        />
      ) : (
        jerseyNumber
      )}
    </button>
  );
}
