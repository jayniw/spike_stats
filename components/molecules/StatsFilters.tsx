"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStatsStore } from "@/stores/statsStore";
import { useSeasons } from "@/hooks/useSeasons";
import { useTeamsBySeason } from "@/hooks/useTeamsBySeason";
import { usePlayersByTeam } from "@/hooks/usePlayersBySeason";
import { useMatchesByTeam } from "@/hooks/useMatchesBySeason";

export function StatsFilters() {
  const {
    season,
    teamId,
    matchId,
    playerId,
    setNumber,
    setSeason,
    setTeamId,
    setMatchId,
    setPlayerId,
    setSetNumber,
  } = useStatsStore();

  const { data: seasons, isLoading: loadingSeasons } = useSeasons();
  const { data: teams, isLoading: loadingTeams } = useTeamsBySeason(season);
  const { data: players, isLoading: loadingPlayers } = usePlayersByTeam(teamId);
  const { data: matches, isLoading: loadingMatches } = useMatchesByTeam(teamId);

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Temporada */}
      <div className="space-y-1.5">
        <Label htmlFor="season">Temporada</Label>
        <Select
          value={season || ""}
          onValueChange={(value) => setSeason(value || null)}
          disabled={loadingSeasons}
        >
          <SelectTrigger className="w-[180px]" id="season">
            <SelectValue placeholder="Seleccionar temporada" />
          </SelectTrigger>
          <SelectContent>
            {seasons?.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Equipo */}
      <div className="space-y-1.5">
        <Label htmlFor="team">Equipo</Label>
        <Select
          value={teamId || ""}
          onValueChange={(value) => setTeamId(value || null)}
          disabled={!season || loadingTeams}
        >
          <SelectTrigger className="w-[180px]" id="team">
            <SelectValue placeholder="Seleccionar equipo" />
          </SelectTrigger>
          <SelectContent>
            {teams?.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jugador */}
      <div className="space-y-1.5">
        <Label htmlFor="player">Jugador</Label>
        <Select
          value={playerId || "__all__"}
          onValueChange={(value) =>
            setPlayerId(value === "__all__" ? null : value)
          }
          disabled={!teamId || loadingPlayers}
        >
          <SelectTrigger className="w-[180px]" id="player">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {players?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.jersey_number ? `#${p.jersey_number} ` : ""}
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Partido */}
      <div className="space-y-1.5">
        <Label htmlFor="match">Partido</Label>
        <Select
          value={matchId || "__all__"}
          onValueChange={(value) =>
            setMatchId(value === "__all__" ? null : value)
          }
          disabled={!teamId || loadingMatches}
        >
          <SelectTrigger className="w-[220px]" id="match">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {matches?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                vs {m.opponent_name_resolved}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Set */}
      <div className="space-y-1.5">
        <Label htmlFor="set">Set</Label>
        <Select
          value={setNumber?.toString() || "__all__"}
          onValueChange={(value) =>
            setSetNumber(value === "__all__" ? null : Number(value))
          }
          disabled={!matchId}
        >
          <SelectTrigger className="w-[120px]" id="set">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="1">Set 1</SelectItem>
            <SelectItem value="2">Set 2</SelectItem>
            <SelectItem value="3">Set 3</SelectItem>
            <SelectItem value="4">Set 4</SelectItem>
            <SelectItem value="5">Set 5</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
