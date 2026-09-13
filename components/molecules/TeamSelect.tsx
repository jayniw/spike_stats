"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamRow } from "@/src/types/volleyball";

interface TeamSelectProps {
  teams: TeamRow[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TeamSelect({
  teams,
  value,
  onValueChange,
  placeholder = "Seleccionar equipo",
  disabled,
}: TeamSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name} ({team.season})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
