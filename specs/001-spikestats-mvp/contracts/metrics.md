# Contract: Metric Definitions

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
Canonical formulas implemented as PURE functions in `lib/metrics/` and
verified by golden-value Vitest suites (constitution IV). Dashboards MUST
produce identical values from these functions for identical inputs (FR-025,
SC-008). Terms: `skill ∈ {serve, reception, set_pass, attack, block, dig}`,
`outcome ∈ {point, error, rally_continues}`.

## Input conventions (derived counts)

| Count | Definition |
|---|---|
| `kills` | actions where skill=attack ∧ outcome=point |
| `attack_errors` | skill=attack ∧ outcome=error |
| `attack_attempts` | all skill=attack actions |
| `aces` | skill=serve ∧ outcome=point |
| `serve_errors` | skill=serve ∧ outcome=error |
| `receptions` | skill=reception actions with outcome ∈ {error, rally_continues} |
| `perfect_receptions` | skill=reception ∧ outcome=rally_continues |
| `block_points` | skill=block ∧ outcome=point |
| `sets_played` | closed sets in the selected scope (incl. result-only matches) |
| `points` | all outcome=point actions by the team in scope |

## Formulas

| Metric | Formula | Scope notes |
|---|---|---|
| PPS (puntos por set) | `points / sets_played` | action-scored matches only |
| Eficiencia de ataque | `(kills − attack_errors) / attack_attempts` | attempts > 0 else null |
| Kill % | `kills / attack_attempts` | attempts > 0 else null |
| Ace % (por set) | `aces / sets_played` | |
| Errores de saque por set | `serve_errors / sets_played` | |
| Recepción % perfectas | `perfect_receptions / receptions` | receptions > 0 else null |
| Errores de recepción | count of `reception ∧ error` | per set on dashboards |
| Bloqueos por set | `block_points / sets_played` | |
| % victorias | `wins / matches` | **includes result-only matches** (Clarification Q2) |
| Sets ganados/perdidos | sum over `set_scores` | includes result-only matches |

`null` is returned (and UI shows "—") when a denominator is zero.

## Aggregation rules

- Player dashboard = same formulas filtered to that player's attributed
  actions; averages "por partido" divide by matches where the player has ≥1
  action.
- Comparisons and temporal trends reuse the same functions — no alternate
  implementations anywhere in the codebase.
- Team history/win% include result-only matches; ALL action-derived metrics
  exclude them (they have no actions by definition).

## Golden fixture (excerpt used in tests)

Fixture match: 3 sets won 25-20/25-22/25-19. Actions:
attacks 40 → kills 18, errors 7 (15 continue); serves 45 → aces 5, errors 9;
receptions 30 → perfect 21, errors 4 (5 not rated¹); blocks 6 points.

| Metric | Expected value |
|---|---|
| PPS | 75/3 = **25.00** |
| Ataque eficiencia | (18−7)/40 = **0.275** |
| Kill % | 18/40 = **0.45** |
| Ace % por set | 5/3 ≈ **1.667** |
| Saque errores/set | 9/3 = **3.000** |
| Recepción % perfectas | 21/25 = **0.84** |
| Bloqueos por set | 6/3 = **2.000** |

¹ Reception outcomes are binary in v1 (`perfect`=rally_continues /
`error`); unrated receptions occur when outcome recorded as neither — kept
out of both numerator and denominator.

Rounding: percentages displayed to 1 decimal, efficiencies to 3; raw values
never rounded before aggregation.
