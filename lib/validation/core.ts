import { z } from "zod";

export const uuidSchema = z.uuid({ message: "Identificador inválido" });

export const roleSchema = z.enum(
  ["club_admin", "coach", "analyst", "player", "spectator"],
  { message: "Rol de membresía inválido" },
);

export const membershipStatusSchema = z.enum(["invited", "active", "revoked"], {
  message: "Estado de membresía inválido",
});

export const inviteEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ message: "Correo electrónico inválido" }));

export const inviteTokenSchema = z
  .string()
  .min(16, "Token de invitación inválido")
  .max(128, "Token de invitación inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "Token de invitación inválido");

export const membershipTransitionSchema = z.discriminatedUnion(
  "action",
  [
    z.strictObject({
      action: z.literal("activate"),
      membershipId: uuidSchema,
    }),
    z.strictObject({
      action: z.literal("revoke"),
      membershipId: uuidSchema,
    }),
    z.strictObject({
      action: z.literal("change_role"),
      membershipId: uuidSchema,
      role: roleSchema,
    }),
  ],
  { message: "Transición de membresía inválida" },
);

export type Uuid = z.output<typeof uuidSchema>;
export type Role = z.output<typeof roleSchema>;
export type MembershipStatus = z.output<typeof membershipStatusSchema>;
export type InviteEmail = z.output<typeof inviteEmailSchema>;
export type InviteToken = z.output<typeof inviteTokenSchema>;
export type MembershipTransition = z.output<typeof membershipTransitionSchema>;
export type MembershipTransitionAction = MembershipTransition["action"];
