"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addPlayerAction,
  updatePlayerAction,
  deactivatePlayerAction,
  reactivatePlayerAction,
} from "../actions";

type PlayerRow = {
  id: string;
  full_name: string;
  number: number;
  position: string;
  active: boolean;
};

type Props = {
  teamId: string;
  orgId: string;
  players: PlayerRow[];
  canManage: boolean;
};

const POSITIONS = [
  { value: "setter", label: "Colocador" },
  { value: "opposite", label: "Opuesto" },
  { value: "middle", label: "Central" },
  { value: "receiver", label: "Receptor" },
  { value: "libero", label: "Líbero" },
] as const;

const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.value, p.label]),
);

export function RosterEditor({ teamId, orgId, players, canManage }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const addFormRef = React.useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    setSaving(true);
    setError(null);
    const result = await addPlayerAction(orgId, teamId, formData);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setShowAddForm(false);
    addFormRef.current?.reset();
    router.refresh();
  }

  async function handleUpdate(playerId: string, formData: FormData) {
    setSaving(true);
    const result = await updatePlayerAction(orgId, playerId, formData);
    setSaving(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function handleDeactivate(playerId: string) {
    if (!confirm("¿Archivar este jugador? Sus estadísticas históricas se preservan.")) return;
    const result = await deactivatePlayerAction(orgId, playerId);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleReactivate(playerId: string) {
    const result = await reactivatePlayerAction(orgId, playerId);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  const activePlayers = players.filter((p) => p.active);
  const inactivePlayers = players.filter((p) => !p.active);

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)}>Agregar jugador</Button>
          ) : (
            <Button variant="outline" onClick={() => { setShowAddForm(false); setError(null); }}>
              Cancelar
            </Button>
          )}
        </div>
      )}

      {showAddForm && (
        <form
          ref={addFormRef}
          action={handleAdd}
          className="rounded-lg border p-4 space-y-4"
        >
          <h3 className="font-semibold">Nuevo jugador</h3>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" name="full_name" placeholder="Ej: Martina González" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Dorsal (1–99)</Label>
              <Input
                id="number"
                name="number"
                type="number"
                min={1}
                max={99}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posición</Label>
              <SelectNative id="position" name="position" required defaultValue="">
                <option value="" disabled>
                  Seleccionar...
                </option>
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Agregando..." : "Agregar"}
          </Button>
        </form>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">
          Roster activo ({activePlayers.length})
        </h2>
        {activePlayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay jugadores activos en este equipo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Dorsal</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Posición</TableHead>
                {canManage && <TableHead className="w-32">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activePlayers.map((player) => (
                <TableRow key={player.id}>
                  {editingId === player.id ? (
                    <EditRow
                      player={player}
                      orgId={orgId}
                      saving={saving}
                      onSave={(fd) => handleUpdate(player.id, fd)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <TableCell className="font-mono font-bold">
                        {player.number}
                      </TableCell>
                      <TableCell>{player.full_name}</TableCell>
                      <TableCell>
                        {POSITION_LABELS[player.position] ?? player.position}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(player.id)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(player.id)}
                            >
                              Archivar
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {inactivePlayers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            Archivados ({inactivePlayers.length})
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Dorsal</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Posición</TableHead>
                {canManage && <TableHead className="w-32">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {inactivePlayers.map((player) => (
                <TableRow key={player.id} className="opacity-60">
                  <TableCell className="font-mono font-bold">
                    {player.number}
                  </TableCell>
                  <TableCell>{player.full_name}</TableCell>
                  <TableCell>
                    {POSITION_LABELS[player.position] ?? player.position}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivate(player.id)}
                      >
                        Reactivar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline edit row
// ---------------------------------------------------------------------------

function EditRow({
  player,
  saving,
  onSave,
  onCancel,
}: {
  player: PlayerRow;
  orgId: string;
  saving: boolean;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <>
      <TableCell colSpan={4}>
        <form
          ref={formRef}
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(new FormData(formRef.current!));
          }}
        >
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input
              name="full_name"
              defaultValue={player.full_name}
              className="h-9 w-48"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Dorsal</Label>
            <Input
              name="number"
              type="number"
              min={1}
              max={99}
              defaultValue={player.number}
              className="h-9 w-20"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Posición</Label>
            <SelectNative
              name="position"
              defaultValue={player.position}
              className="h-9 w-40"
              required
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SelectNative>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </form>
      </TableCell>
    </>
  );
}
