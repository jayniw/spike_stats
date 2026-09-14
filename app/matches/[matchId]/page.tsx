"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useMatch, useMatchSets, useMatchEvents } from "@/hooks/useMatch";
import { useInsertEvent, useUndoEvent, useStartMatch } from "@/hooks/useMatchActions";
import { useMatchStore } from "@/stores/matchStore";
import { MatchHeader } from "@/components/organisms/MatchHeader";
import { Scoreboard } from "@/components/organisms/Scoreboard";
import { EventGrid } from "@/components/organisms/EventGrid";
import { UndoStack } from "@/components/organisms/UndoStack";
import type { Fundamental } from "@/src/types/volleyball";

export default function LiveMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);

  const { data: match, isLoading: loadingMatch } = useMatch(matchId);
  const { data: sets, isLoading: loadingSets } = useMatchSets(matchId);
  const { data: events, isLoading: loadingEvents } = useMatchEvents(
    matchId,
    match?.current_set || 1
  );

  const {
    sets: storeSets,
    events: storeEvents,
    currentRotation,
    servingTeam,
    setMatchId,
    setSets,
    setEvents,
    setCurrentSet,
  } = useMatchStore();

  const insertEvent = useInsertEvent(matchId, match?.current_set || 1);
  const undoEvent = useUndoEvent(matchId, match?.current_set || 1);
  const startMatch = useStartMatch(matchId);

  useEffect(() => {
    if (match) {
      setMatchId(matchId);
      setCurrentSet(match.current_set);
    }
  }, [match, matchId, setMatchId, setCurrentSet]);

  useEffect(() => {
    if (sets) {
      setSets(sets as any);
    }
  }, [sets, setSets]);

  useEffect(() => {
    if (events) {
      setEvents(events as any);
    }
  }, [events, setEvents]);

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

    insertEvent.mutate({
      match_id: matchId,
      set_number: match.current_set,
      team_id: servingTeam === "home" ? match.home_team_id : match.away_team_id,
      player_id: "",
      fundamental,
      quality,
      rotation: currentRotation,
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

  return (
    <div className="min-h-screen flex flex-col">
      <MatchHeader
        match={match}
        homeTeamName={match.home_team?.name || "Local"}
        awayTeamName={match.opponent_name || match.away_team?.name || "Visitante"}
        currentRotation={currentRotation}
        servingTeam={servingTeam}
        onStart={isScheduled ? handleStart : undefined}
      />

      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/matches"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver a partidos
          </Link>
        </div>

        <Scoreboard
          match={match}
          homeTeamName={match.home_team?.name || "Local"}
          awayTeamName={match.opponent_name || match.away_team?.name || "Visitante"}
          sets={storeSets}
        />

        {isInProgress && (
          <>
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

        {isScheduled && !isInProgress && (
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-muted-foreground">
              Este partido aún no ha comenzado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
