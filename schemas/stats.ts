import { z } from "zod";

export const statsFiltersSchema = z.object({
  season: z.string().min(1, "Temporada requerida"),
  matchId: z.string().uuid().nullable().optional(),
  playerId: z.string().uuid().nullable().optional(),
  setNumber: z.number().int().min(1).max(5).nullable().optional(),
});

export type StatsFilters = z.infer<typeof statsFiltersSchema>;
