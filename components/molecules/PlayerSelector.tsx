"use client";

import { PlayerAvatar } from "@/components/atoms/PlayerAvatar";

interface Player {
  id: string;
  jersey_number: number;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}

export function PlayerSelector({
  players,
  selectedPlayerId,
  onSelectPlayer,
}: PlayerSelectorProps) {
  if (players.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-4 py-2">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {players
            .sort((a, b) => a.jersey_number - b.jersey_number)
            .map((player) => (
              <PlayerAvatar
                key={player.id}
                jerseyNumber={player.jersey_number}
                photoUrl={player.photo_url}
                isSelected={selectedPlayerId === player.id}
                onClick={() => onSelectPlayer(player.id)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
