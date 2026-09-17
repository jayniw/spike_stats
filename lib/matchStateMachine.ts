import type { MatchSetWithScore, MatchRow } from "@/src/types/volleyball";

export interface MatchState {
  lockedSets: Set<number>;
  completedSets: Set<number>;
  setWinners: Map<number, "home" | "away">;
  setsWon: { home: number; away: number };
  isMatchComplete: boolean;
  currentSet: number;
  enabledSets: Set<number>;
}

function determineSetWinner(
  pointsHome: number,
  pointsAway: number,
  targetPoints: number,
  minDiff: number
): "home" | "away" | null {
  const diff = Math.abs(pointsHome - pointsAway);

  if (pointsHome >= targetPoints && pointsHome - pointsAway >= minDiff) {
    return "home";
  }
  if (pointsAway >= targetPoints && pointsAway - pointsHome >= minDiff) {
    return "away";
  }

  return null;
}

function countSetsWonByTeam(
  setWinners: Map<number, "home" | "away">
): { home: number; away: number } {
  let home = 0;
  let away = 0;

  setWinners.forEach((winner) => {
    if (winner === "home") home++;
    else away++;
  });

  return { home, away };
}

function determineEnabledSets(
  match: MatchRow,
  lockedSets: Set<number>,
  setWinners: Map<number, "home" | "away">
): Set<number> {
  const enabledSets = new Set<number>();
  const isBestOf5 = match.format === "best_of_5";
  const maxSets = isBestOf5 ? 5 : 3;
  const setsToWin = isBestOf5 ? 3 : 2;

  // Set 1 is always enabled initially
  if (!lockedSets.has(1)) {
    enabledSets.add(1);
  }

  const { home: homeWins, away: awayWins } = countSetsWonByTeam(setWinners);

  // Check if match is complete
  if (homeWins >= setsToWin || awayWins >= setsToWin) {
    // Match is complete, only enable locked sets
    for (const setNum of lockedSets) {
      enabledSets.add(setNum);
    }
    return enabledSets;
  }

  // Enable sets based on progression
  for (let i = 2; i <= maxSets; i++) {
    const prevSet = i - 1;

    // Previous set must be locked (completed) to enable this set
    if (!lockedSets.has(prevSet)) {
      break;
    }

    // Check if this set is needed based on set winners
    const setsNeededToWin = setsToWin;
    const remainingSets = maxSets - i + 1;

    // If one team already won enough sets, no need for more
    if (homeWins >= setsToWin || awayWins >= setsToWin) {
      break;
    }

    // If remaining sets can't change the outcome, stop
    if (homeWins + remainingSets < setsToWin && awayWins + remainingSets < setsToWin) {
      break;
    }

    enabledSets.add(i);
  }

  return enabledSets;
}

export function calculateMatchState(
  match: MatchRow,
  sets: MatchSetWithScore[],
  lockedSets: Set<number>
): MatchState {
  const setWinners = new Map<number, "home" | "away">();
  const completedSets = new Set<number>();

  // Determine winners for locked sets
  lockedSets.forEach((setNum) => {
    const set = sets.find((s) => s.set_number === setNum);
    if (set) {
      const winner = determineSetWinner(
        set.points_home,
        set.points_away,
        set.target_points,
        set.min_diff
      );
      if (winner) {
        setWinners.set(setNum, winner);
        completedSets.add(setNum);
      }
    }
  });

  const { home: homeWins, away: awayWins } = countSetsWonByTeam(setWinners);
  const isBestOf5 = match.format === "best_of_5";
  const setsToWin = isBestOf5 ? 3 : 2;
  const isMatchComplete = homeWins >= setsToWin || awayWins >= setsToWin;

  const enabledSets = determineEnabledSets(match, lockedSets, setWinners);

  // Find current set (first enabled set that isn't locked)
  let currentSet = 1;
  for (const setNum of Array.from(enabledSets).sort((a, b) => a - b)) {
    if (!lockedSets.has(setNum)) {
      currentSet = setNum;
      break;
    }
  }

  return {
    lockedSets,
    completedSets,
    setWinners,
    setsWon: { home: homeWins, away: awayWins },
    isMatchComplete,
    currentSet,
    enabledSets,
  };
}
