"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SelectNative } from "@/components/ui/select-native";
import { useToast } from "@/components/ui/toast";
import { changeRoleAction, revokeMembershipAction } from "./actions";
import type { Role } from "@/lib/validation/core";

type Member = {
  id: string;
  role: string;
  status: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
};

const ROLES: { value: Role; label: string }[] = [
  { value: "club_admin", label: "Administrador" },
  { value: "coach", label: "Entrenador" },
  { value: "analyst", label: "Analista" },
  { value: "player", label: "Jugadora" },
  { value: "spectator", label: "Espectador" },
];

export function MembersTable({
  members,
  organizationId,
  currentUserId,
}: {
  members: Member[];
  organizationId: string;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState<string | null>(null);

  async function handleRoleChange(memberId: string, newRole: string) {
    setLoading(memberId);
    const result = await changeRoleAction(
      organizationId,
      memberId,
      newRole as Role,
    );
    setLoading(null);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rol actualizado",
        description: "El rol del miembro se actualizó correctamente.",
        variant: "success",
      });
    }
  }

  async function handleRevoke(memberId: string) {
    if (!confirm("¿Estás seguro de que quieres revocar esta membresía?")) {
      return;
    }

    setLoading(memberId);
    const result = await revokeMembershipAction(organizationId, memberId);
    setLoading(null);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Membresía revocada",
        description: "El miembro fue removido del club.",
        variant: "success",
      });
    }
  }

  function getDisplayName(member: Member): string {
    if (member.user_name) return member.user_name;
    if (member.user_email) {
      const parts = member.user_email.split("@");
      return parts[0] ?? member.user_email;
    }
    return member.user_id.slice(0, 8) + "...";
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Miembro</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{getDisplayName(member)}</p>
                  {member.user_email ? (
                    <p className="text-xs text-muted-foreground">
                      {member.user_email}
                    </p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {member.user_phone ? (
                  <span className="text-sm">{member.user_phone}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <SelectNative
                  value={member.role}
                  disabled={loading === member.id || member.user_id === currentUserId}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="w-40"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </SelectNative>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    member.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {member.status === "active" ? "Activo" : "Revocado"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {member.user_id !== currentUserId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === member.id}
                    onClick={() => handleRevoke(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Revocar
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
