"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/molecules/DateTimePicker";
import { TeamSelect } from "@/components/molecules/TeamSelect";
import { matchKeys } from "@/hooks/useMatches";
import { useOrganization, useUserTeams } from "@/hooks/useOrganization";

// Lista de equipos rivales conocidos (U15 ORO)
const KNOWN_OPPONENTS = [
  "Albert Einstein AZ",
  "Albert Einstein",
  "Nimbles JR",
  "Nimbles B",
  "Vipers",
  "San Martin",
  "Rojo y Negro",
];

export default function NewMatchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [homeTeamId, setHomeTeamId] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [customOpponent, setCustomOpponent] = useState("");
  const [matchDate, setMatchDate] = useState<Date | undefined>(new Date());
  const [venue, setVenue] = useState("");
  const [tournament, setTournament] = useState("U15 ORO 2026");
  const [format, setFormat] = useState<"best_of_3" | "best_of_5">("best_of_3");
  const [error, setError] = useState<string | null>(null);

  const { data: org } = useOrganization();
  const { data: teams, isLoading: loadingTeams } = useUserTeams();

  const createMatch = useMutation({
    mutationFn: async () => {
      if (!homeTeamId) {
        throw new Error("Selecciona tu equipo");
      }

      const finalOpponent = opponentName === "custom" ? customOpponent : opponentName;
      if (!finalOpponent) {
        throw new Error("Selecciona o escribe el nombre del rival");
      }

      if (!org) {
        throw new Error("No se encontró la organización");
      }

      const { data, error } = await supabase
        .from("matches")
        .insert({
          organization_id: org.id,
          home_team_id: homeTeamId,
          opponent_name: finalOpponent,
          match_date: matchDate?.toISOString() || new Date().toISOString(),
          venue: venue || null,
          tournament: tournament || null,
          format,
          status: "scheduled",
          current_set: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
      router.push(`/matches/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMatch.mutate();
  };

  if (loadingTeams) {
    return <div className="text-center py-8">Cargando equipos...</div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Partido</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nuestro Equipo</Label>
          <TeamSelect
            teams={teams || []}
            value={homeTeamId}
            onValueChange={setHomeTeamId}
            placeholder="Seleccionar nuestro equipo"
          />
        </div>

        <div className="space-y-2">
          <Label>Rival</Label>
          <Select value={opponentName} onValueChange={setOpponentName}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rival" />
            </SelectTrigger>
            <SelectContent>
              {KNOWN_OPPONENTS.map((opp) => (
                <SelectItem key={opp} value={opp}>
                  {opp}
                </SelectItem>
              ))}
              <SelectItem value="custom">Otro equipo...</SelectItem>
            </SelectContent>
          </Select>
          {opponentName === "custom" && (
            <Input
              placeholder="Nombre del rival"
              value={customOpponent}
              onChange={(e) => setCustomOpponent(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Fecha y Hora</Label>
          <DateTimePicker
            value={matchDate}
            onChange={setMatchDate}
          />
        </div>

        <div className="space-y-2">
          <Label>Lugar (opcional)</Label>
          <Input
            placeholder="Ej: Gimnasio Municipal"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Torneo</Label>
          <Input
            placeholder="Ej: U15 ORO 2026"
            value={tournament}
            onChange={(e) => setTournament(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Formato</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as "best_of_3" | "best_of_5")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_of_3">Mejor de 3</SelectItem>
              <SelectItem value="best_of_5">Mejor de 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={createMatch.isPending}
          >
            {createMatch.isPending ? "Creando..." : "Crear Partido"}
          </Button>
        </div>
      </form>
    </div>
  );
}
