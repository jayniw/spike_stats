"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { useToast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createInviteAction, cancelInviteAction } from "./actions";
import type { Role } from "@/lib/validation/core";

type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
  created_at: string;
  expires_at: string;
};

const ROLES: { value: Role; label: string }[] = [
  { value: "club_admin", label: "Administrador" },
  { value: "coach", label: "Entrenador" },
  { value: "analyst", label: "Analista" },
  { value: "player", label: "Jugadora" },
  { value: "spectator", label: "Espectador" },
];

export function InvitationsManager({
  organizationId,
  userRole,
}: {
  organizationId: string;
  userRole: string;
}) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("spectator");
  const [loading, setLoading] = React.useState(false);
  const [invites] = React.useState<Invite[]>([]);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  // Filter available roles based on user role
  const availableRoles = userRole === "coach"
    ? ROLES.filter((r) => ["analyst", "player", "spectator"].includes(r.value))
    : ROLES;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createInviteAction(organizationId, email, role);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invitación enviada",
        description: `Se envió una invitación a ${email}.`,
        variant: "success",
      });
      setEmail("");
      setRole("spectator");
      // In a real app, we'd refresh the list here
    }
  }

  async function handleCancel(inviteId: string) {
    if (!confirm("¿Cancelar esta invitación?")) return;

    const result = await cancelInviteAction(organizationId, inviteId);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invitación cancelada",
        variant: "success",
      });
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/accept/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nueva invitación</CardTitle>
          <CardDescription>
            Invita a una persona a unirse a tu club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Correo electrónico</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12"
              />
            </div>
            <div className="w-full space-y-2 sm:w-48">
              <Label htmlFor="invite-role">Rol</Label>
              <SelectNative
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="min-h-12"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="min-h-12 w-full sm:w-auto">
                {loading ? "Enviando…" : "Invitar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {invites.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>
                    {ROLES.find((r) => r.value === invite.role)?.label ?? invite.role}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(invite.expires_at).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invite.token)}
                      >
                        {copiedToken === invite.token ? "Copiado" : "Copiar enlace"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleCancel(invite.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
