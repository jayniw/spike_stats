"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function createMatch(data: {
  organization_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue?: string | null;
  tournament?: string | null;
  format: "best_of_3" | "best_of_5";
}) {
  console.log("[ServerAction] Creating match:", data);

  const { data: match, error } = await supabaseAdmin
    .from("matches")
    .insert({
      ...data,
      status: "scheduled",
      current_set: 1,
    })
    .select()
    .single();

  console.log("[ServerAction] Create match result:", { match, error });

  if (error) {
    return { match: null, error: error.message };
  }

  return { match, error: null };
}

export async function updateMatch(
  matchId: string,
  data: {
    status?: "scheduled" | "in_progress" | "completed" | "abandoned";
    current_set?: number;
    winner_team_id?: string | null;
  }
) {
  console.log("[ServerAction] Updating match:", matchId, data);

  const { data: match, error } = await supabaseAdmin
    .from("matches")
    .update(data)
    .eq("id", matchId)
    .select()
    .single();

  console.log("[ServerAction] Update match result:", { match, error });

  if (error) {
    return { match: null, error: error.message };
  }

  return { match, error: null };
}

export async function deleteMatch(matchId: string) {
  console.log("[ServerAction] Deleting match:", matchId);

  const { error } = await supabaseAdmin
    .from("matches")
    .delete()
    .eq("id", matchId);

  console.log("[ServerAction] Delete match result:", { error });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getMatch(matchId: string) {
  console.log("[ServerAction] Getting match:", matchId);

  const { data: match, error } = await supabaseAdmin
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
    .eq("id", matchId)
    .single();

  console.log("[ServerAction] Get match result:", { match, error });

  if (error) {
    return { match: null, error: error.message };
  }

  return { match, error: null };
}

export async function getMatchSets(matchId: string) {
  console.log("[ServerAction] Getting match sets:", matchId);

  const { data: sets, error } = await supabaseAdmin
    .from("match_sets")
    .select("*")
    .eq("match_id", matchId)
    .order("set_number");

  console.log("[ServerAction] Get match sets result:", { sets, error });

  if (error) {
    return { sets: [], error: error.message };
  }

  return { sets, error: null };
}

export async function getMatchEvents(matchId: string, setNumber?: number) {
  console.log("[ServerAction] Getting match events:", matchId, "set:", setNumber);

  let query = supabaseAdmin
    .from("match_events")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (setNumber !== undefined) {
    query = query.eq("set_number", setNumber);
  }

  const { data: events, error } = await query;

  console.log("[ServerAction] Get match events result:", { count: events?.length, error });

  if (error) {
    return { events: [], error: error.message };
  }

  return { events, error: null };
}

export async function insertMatchEvent(event: {
  match_id: string;
  set_number: number;
  event_type: string;
  fundamental?: string | null;
  quality?: string | null;
  player_number?: number | null;
  player_name?: string | null;
  team_id: string;
  is_point: boolean;
}) {
  console.log("[ServerAction] Inserting match event:", event);

  const { data: newEvent, error } = await supabaseAdmin
    .from("match_events")
    .insert(event)
    .select()
    .single();

  console.log("[ServerAction] Insert event result:", { newEvent, error });

  if (error) {
    return { event: null, error: error.message };
  }

  return { event: newEvent, error: null };
}

export async function undoLastEvent(matchId: string, setNumber: number) {
  console.log("[ServerAction] Undoing last event for match:", matchId, "set:", setNumber);

  // Get the last event
  const { data: lastEvent, error: fetchError } = await supabaseAdmin
    .from("match_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("set_number", setNumber)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !lastEvent) {
    return { undone: false, error: fetchError?.message || "No event to undo" };
  }

  // Delete it
  const { error: deleteError } = await supabaseAdmin
    .from("match_events")
    .delete()
    .eq("id", lastEvent.id);

  if (deleteError) {
    return { undone: false, error: deleteError.message };
  }

  return { undone: true, event: lastEvent, error: null };
}
