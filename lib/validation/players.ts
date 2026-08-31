import { z } from "zod";

export const positionSchema = z.enum(
  ["setter", "opposite", "middle", "receiver", "libero"],
  { message: "Posición inválida" },
);

export const dorsalSchema = z
  .number()
  .int("El dorsal debe ser un número entero")
  .min(1, "El dorsal debe ser entre 1 y 99")
  .max(99, "El dorsal debe ser entre 1 y 99");

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre de la jugador es obligatorio")
  .max(120, "El nombre es demasiado largo");

export const createPlayerSchema = z.object({
  team_id: z.uuid({ message: "Identificador de equipo inválido" }),
  full_name: playerNameSchema,
  number: dorsalSchema,
  position: positionSchema,
});

export const updatePlayerSchema = z.object({
  full_name: playerNameSchema.optional(),
  number: dorsalSchema.optional(),
  position: positionSchema.optional(),
  active: z.boolean().optional(),
});

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del equipo es obligatorio")
    .max(80, "El nombre es demasiado largo"),
  category: z
    .string()
    .trim()
    .min(1, "La categoría es obligatoria")
    .max(40, "La categoría es demasiado larga"),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del equipo es obligatorio")
    .max(80, "El nombre es demasiado largo")
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, "La categoría es obligatoria")
    .max(40, "La categoría es demasiado larga")
    .optional(),
});

export type Position = z.output<typeof positionSchema>;
export type Dorsal = z.output<typeof dorsalSchema>;
export type PlayerName = z.output<typeof playerNameSchema>;
export type CreatePlayerInput = z.output<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.output<typeof updatePlayerSchema>;
export type CreateTeamInput = z.output<typeof createTeamSchema>;
export type UpdateTeamInput = z.output<typeof updateTeamSchema>;
