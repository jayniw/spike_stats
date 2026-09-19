"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useMatchStore } from "@/stores/matchStore";
import { matchKeys } from "./useMatches";
import type { PlayEventInsert } from "@/src/types/volleyball";

export function useInsertEvent(matchId: string, setNumber: number) {
  const queryClient = useQueryClient();
  const { addEvent } = useMatchStore();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (newEvent: PlayEventInsert) => {
      const { data, error } = await supabase
        .from("play_events")
        .insert(newEvent)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({
        queryKey: matchKeys.events(matchId, setNumber),
      });

      const previousEvents = queryClient.getQueryData(
        matchKeys.events(matchId, setNumber)
      );

      // Optimistic update to Zustand
      addEvent(newEvent as any);

      // Optimistic update to React Query
      queryClient.setQueryData(matchKeys.events(matchId, setNumber), (old: any) => [
        ...(old || []),
        { ...newEvent, id: "temp-" + Date.now(), created_at: new Date().toISOString() },
      ]);

      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      queryClient.setQueryData(
        matchKeys.events(matchId, setNumber),
        context?.previousEvents
      );
      // Revert Zustand state
      useMatchStore.getState().undo();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.events(matchId, setNumber) });
    },
  });
}

export function useUndoEvent(matchId: string, setNumber: number) {
  const queryClient = useQueryClient();
  const { undo, events } = useMatchStore();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("play_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({
        queryKey: matchKeys.events(matchId, setNumber),
      });

      const previousEvents = queryClient.getQueryData(
        matchKeys.events(matchId, setNumber)
      );

      // Optimistic undo in Zustand
      undo();

      // Optimistic remove from React Query
      queryClient.setQueryData(matchKeys.events(matchId, setNumber), (old: any) =>
        old?.filter((e: any) => e.id !== eventId)
      );

      return { previousEvents };
    },
    onError: (err, eventId, context) => {
      queryClient.setQueryData(
        matchKeys.events(matchId, setNumber),
        context?.previousEvents
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.events(matchId, setNumber) });
    },
  });
}

export function useStartMatch(matchId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ format }: { format: "best_of_3" | "best_of_5" }) => {
      const numSets = format === "best_of_5" ? 5 : 3;
      const targetPoints = 25;

      // Get match to get organization_id
      const { data: match } = await supabase
        .from("matches")
        .select("organization_id")
        .eq("id", matchId)
        .single();

      const setsToCreate = Array.from({ length: numSets }, (_, i) => ({
        match_id: matchId,
        set_number: i + 1,
        points_home: 0,
        points_away: 0,
        target_points: i < numSets - 1 ? targetPoints : 15,
        min_diff: 2,
        status: i === 0 ? ("in_progress" as const) : ("pending" as const),
        organization_id: match?.organization_id || "",
      }));

      const { error: setsError } = await supabase
        .from("match_sets")
        .insert(setsToCreate);

      if (setsError) throw setsError;

      const { error: matchError } = await supabase
        .from("matches")
        .update({ 
          status: "in_progress", 
          current_set: 1,
          started_at: new Date().toISOString()
        })
        .eq("id", matchId);

      if (matchError) throw matchError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.sets(matchId) });
    },
  });
}

export function useCompleteMatch(matchId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("matches")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}

export function useSyncSetScore(matchId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (sets: { id: string; points_home: number; points_away: number }[]) => {
      // Sync each set's score to Supabase
      for (const set of sets) {
        const { error } = await supabase
          .from("match_sets")
          .update({
            points_home: set.points_home,
            points_away: set.points_away,
          })
          .eq("id", set.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.sets(matchId) });
    },
  });
}

export function useAbandonMatch(matchId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("matches")
        .update({
          status: "abandoned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}

export function useReopenMatch(matchId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("matches")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}
