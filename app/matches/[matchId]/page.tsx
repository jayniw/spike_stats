"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useMatch, useMatchSets, useMatchEvents } from "@/hooks/useMatch";
import { useInsertEvent, useUndoEvent, useStartMatch, useCompleteMatch, useAbandonMatch, useSyncSetScore } from "@/hooks/useMatchActions";
import { useMatchStore } from "@/stores/matchStore";
import { useOrganization } from "@/hooks/useOrganization";
import { createClient } from "@/lib/supabase/client";
import { MatchHeader } from "@/components/organisms/MatchHeader";
import { Scoreboard } from "@/components/organisms/Scoreboard";
import { EventGrid } from "@/components/organisms/EventGrid";
import { UndoStack } from "@/components/organisms/UndoStack";
import { PlayerSelector } from "@/components/molecules/PlayerSelector";
import type { Fundamental } from "@/src/types/volleyball";
import type { MatchState } from "@/lib/matchStateMachine";

interface Player {
  id: string;
  jersey_number: number;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

interface RosterEntry {
  player_id: string;
  jersey_number: number;
  player: {
    id: string;
    first_name: string;
    last_name: string;
  }[];
}

export default function LiveMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const supabase = createClient();
  const { data: org } = useOrganization();

  const { data: match, isLoading: loadingMatch } = useMatch(matchId);
  const { data: sets, isLoading: loadingSets } = useMatchSets(matchId);
  const { data: events, isLoading: loadingEvents } = useMatchEvents(
    matchId,
    match?.current_set || 1
  );

  const [players, setPlayers] = useState<Player[]>([]);
  const [showPlayerError, setShowPlayerError] = useState(false);

  const {
    sets: storeSets,
    events: storeEvents,
    currentRotation,
    servingTeam,
    selectedPlayerId,
    setMatchId,
    setSets,
    setEvents,
    setCurrentSet,
    setSelectedPlayerId,
  } = useMatchStore();

  const insertEvent = useInsertEvent(matchId, match?.current_set || 1);
  const undoEvent = useUndoEvent(matchId, match?.current_set || 1);
  const startMatch = useStartMatch(matchId);
  const completeMatch = useCompleteMatch(matchId);
  const abandonMatch = useAbandonMatch(matchId);
  const syncSetScore = useSyncSetScore(matchId);

  // Load players from roster when match loads
  useEffect(() => {
    if (!match?.home_team_id) return;

    const loadPlayers = async () => {
      const { data: roster, error } = await supabase
        .from("team_rosters")
        .select("player_id, jersey_number, player:players(id, first_name, last_name)")
        .eq("team_id", match.home_team_id)
        .order("jersey_number");

      if (error || !roster) return;

      const formattedPlayers: Player[] = (roster as RosterEntry[])
        .filter((r) => [1, 2, 3, 4, 5, 6, 14].includes(r.jersey_number))
        .map((r) => ({
          id: r.player[0]?.id || r.player_id,
          jersey_number: r.jersey_number,
          first_name: r.player[0]?.first_name || "",
          last_name: r.player[0]?.last_name || "",
        }))
        .sort((a, b) => a.jersey_number - b.jersey_number);

      setPlayers(formattedPlayers);

      // Auto-select player #14 if exists
      const player14 = formattedPlayers.find((p) => p.jersey_number === 14);
      if (player14) {
        setSelectedPlayerId(player14.id);
      }
    };

    loadPlayers();
  }, [match?.home_team_id, supabase, setSelectedPlayerId]);

  useEffect(() => {
    if (match) {
      setMatchId(matchId);
      setCurrentSet(match.current_set);
    }
  }, [match, matchId, setMatchId, setCurrentSet]);

  useEffect(() => {
    if (sets) {
      // Only load from Supabase if local store is empty for this match
      const localStore = useMatchStore.getState();
      if (localStore.matchId === matchId && localStore.sets.length > 0) {
        // Local data exists, keep it (local-first)
        return;
      }
      setSets(sets as any);
    }
  }, [sets, setSets, matchId]);

  useEffect(() => {
    if (events) {
      setEvents(events as any);
    }
  }, [events, setEvents]);

  const handleSetLocked = useCallback((setNumber: number) => {
    // Sync set scores to Supabase when a set is locked
    const currentSets = useMatchStore.getState().sets;
    const setsToSync = currentSets
      .filter((s) => s.id)
      .map((s) => ({
        id: s.id,
        points_home: s.points_home,
        points_away: s.points_away,
      }));

    if (setsToSync.length > 0) {
      syncSetScore.mutate(setsToSync);
    }
  }, [syncSetScore]);

  const handleMatchComplete = useCallback((matchState: MatchState) => {
    if (matchState.isMatchComplete) {
      // Sync all set scores first, then complete
      const currentSets = useMatchStore.getState().sets;
      const setsToSync = currentSets
        .filter((s) => s.id)
        .map((s) => ({
          id: s.id,
          points_home: s.points_home,
          points_away: s.points_away,
        }));

      if (setsToSync.length > 0) {
        syncSetScore.mutate(setsToSync, {
          onSuccess: () => completeMatch.mutate(),
        });
      } else {
        completeMatch.mutate();
      }
    }
  }, [completeMatch, syncSetScore]);

  if (loadingMatch || loadingSets) {
    return <div className="text-center py-8">Cargando partido...</div>;
  }

  if (!match) {
    return <div className="text-center py-8">Partido no encontrado</div>;
  }

  const isInProgress = match.status === "in_progress";
  const isScheduled = match.status === "scheduled";

  const handleEvent = (fundamental: Fundamental, quality: string) => {
    if (!match || !isInProgress) return;

    // Validate player selection
    if (!selectedPlayerId) {
      setShowPlayerError(true);
      setTimeout(() => setShowPlayerError(false), 2000);
      return;
    }

    insertEvent.mutate({
      match_id: matchId,
      set_number: match.current_set,
      team_id: match.home_team_id,
      player_id: selectedPlayerId,
      fundamental,
      quality,
      rotation: null,
      organization_id: match.organization_id,
    });
  };

  const handleUndo = () => {
    const lastEvent = storeEvents[storeEvents.length - 1];
    if (lastEvent) {
      undoEvent.mutate(lastEvent.id);
    }
  };

  const handleStart = () => {
    startMatch.mutate({ format: match.format });
  };

  const handleFinishManual = () => {
    if (confirm("¿Finalizar partido?")) {
      completeMatch.mutate();
    }
  };

  const handleAbandon = () => {
    if (confirm("¿Abandonar partido?")) {
      abandonMatch.mutate();
    }
  };

  const handleUpdateScore = (setNumber: number, isHome: boolean, delta: number) => {
    const newSets = storeSets.map((set) => {
      if (set.set_number !== setNumber) return set;
      
      if (isHome) {
        const newPoints = Math.max(0, set.points_home + delta);
        return { ...set, points_home: newPoints };
      } else {
        const newPoints = Math.max(0, set.points_away + delta);
        return { ...set, points_away: newPoints };
      }
    });
    setSets(newSets);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* <MatchHeader
        match={match}
        homeTeamName={match.home_team?.name || "Local"}
        awayTeamName={match.opponent_name || match.away_team?.name || "Visitante"}
        currentRotation={currentRotation}
        servingTeam={servingTeam}
        onStart={isScheduled ? handleStart : undefined}
      /> */}

      <div className="flex-1 flex flex-col">
        <Scoreboard
          match={match}
          homeTeamName={match.home_team?.name || "Local"}
          awayTeamName={match.opponent_name || match.away_team?.name || "Visitante"}
          sets={storeSets}
          onUpdateScore={handleUpdateScore}
          onSetLocked={handleSetLocked}
          onMatchComplete={handleMatchComplete}
        />

        {isInProgress && (
          <div className="flex gap-2 px-4 pb-2">
            <button
              onClick={handleFinishManual}
              disabled={completeMatch.isPending}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {completeMatch.isPending ? "Finalizando..." : "Finalizar Partido"}
            </button>
            <button
              onClick={handleAbandon}
              disabled={abandonMatch.isPending}
              className="px-3 py-1.5 bg-destructive/10 text-destructive text-sm rounded-lg hover:bg-destructive/20 disabled:opacity-50"
            >
              {abandonMatch.isPending ? "Abandonando..." : "Abandonar"}
            </button>
          </div>
        )}

        {match.status === "completed" && (
          <div className="px-4 pb-2">
            <div className="text-sm text-green-600 font-medium">
              Partido finalizado
            </div>
          </div>
        )}

        {isInProgress && (
          <>
            <PlayerSelector
              players={players}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
            />

            {showPlayerError && (
              <div className="bg-destructive/10 text-destructive text-sm text-center py-2">
                Selecciona un jugador primero
              </div>
            )}

            <div className="flex-1 overflow-auto pb-48">
              <EventGrid
                onEvent={handleEvent}
                disabled={!isInProgress}
                loading={insertEvent.isPending}
              />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-[env(safe-area-inset-bottom)]">
              <div className="container mx-auto">
                <UndoStack
                  events={storeEvents}
                  onUndo={handleUndo}
                  canUndo={storeEvents.length > 0 && !undoEvent.isPending}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
