"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTeamAction, archiveTeamAction } from "./actions";

type PlayerRow = {
  id: string;
  full_name: string;
  number: number;
  position: string;
  active: boolean;
};

type TeamRow = {
  id: string;
  name: string;
  category: string;
  archived_at: string | null;
  players: PlayerRow[];
};

type Props = {
  teams: TeamRow[];
  orgId: string;
  canManage: boolean;
};

const POSITION_LABELS: Record<string, string> = {
  setter: "Colocador",
  opposite: "Opuesto",
  middle: "Central",
  receiver: "Receptor",
  libero: "Líbero",
};

export function TeamsList({ teams, orgId, canManage }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError(null);
    const result = await createTeamAction(orgId, formData);
    setCreating(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setShowForm(false);
    formRef.current?.reset();
    router.refresh();
  }

  async function handleArchive(teamId: string) {
    if (!confirm("¿Archivar este equipo? Los jugadores no se eliminan.")) return;
    const result = await archiveTeamAction(orgId, teamId);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  if (teams.length === 0 && !showForm) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No hay equipos creados.</p>
        {canManage && (
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            Crear primer equipo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>Nuevo equipo</Button>
          ) : (
            <Button variant="outline" onClick={() => { setShowForm(false); setError(null); }}>
              Cancelar
            </Button>
          )}
        </div>
      )}

      {showForm && (
        <form
          ref={formRef}
          action={handleCreate}
          className="rounded-lg border p-4 space-y-4"
        >
          <h3 className="font-semibold">Nuevo equipo</h3>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Ej: Primera" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" name="category" placeholder="Ej: Sub-16" required />
            </div>
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "Creando..." : "Crear equipo"}
          </Button>
        </form>
      )}

      {teams.length > 0 && (
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/teams/${team.id}?org=${orgId}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {team.name}
                  </Link>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {team.category}
                  </span>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Link href={`/teams/${team.id}?org=${orgId}`}>
                      <Button variant="outline" size="sm">
                        Gestionar roster
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(team.id)}
                    >
                      Archivar
                    </Button>
                  </div>
                )}
              </div>

              {team.players.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Dorsal</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Posición</TableHead>
                      <TableHead className="w-20">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-mono font-bold">
                          {player.number}
                        </TableCell>
                        <TableCell>{player.full_name}</TableCell>
                        <TableCell>
                          {POSITION_LABELS[player.position] ?? player.position}
                        </TableCell>
                        <TableCell>
                          {player.active ? (
                            <span className="text-xs text-green-600">Activo</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Archivado
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin jugadores registrados.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
