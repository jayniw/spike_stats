// Tipos refinados para voleibol - Unión discriminada por fundamental
// Estos tipos complementan los generados automáticamente en database.ts

import type { Tables, Enums, Functions } from './database';

// ============================================
// ENUMS (re-exportados para conveniencia)
// ============================================

export type OrganizationRole = Enums['organization_role'];
export type MatchStatus = Enums['match_status'];
export type MatchFormat = Enums['match_format'];
export type Fundamental = Enums['fundamental'];
export type ServeQuality = Enums['serve_quality'];
export type ReceptionQuality = Enums['reception_quality'];
export type AttackQuality = Enums['attack_quality'];
export type BlockQuality = Enums['block_quality'];
export type SetQuality = Enums['set_quality'];
export type DefenseQuality = Enums['defense_quality'];
export type SetStatus = Enums['set_status'];
export type ServingTeam = Enums['serving_team'];
export type CourtZone = Enums['court_zone'];

// ============================================
// TABLAS BASE (desde database.ts generado)
// ============================================

export type OrganizationRow = Tables['organizations']['Row'];
export type OrganizationMemberRow = Tables['organization_members']['Row'];
export type TeamRow = Tables['teams']['Row'];
export type PlayerRow = Tables['players']['Row'];
export type TeamRosterRow = Tables['team_rosters']['Row'];
export type MatchRow = Tables['matches']['Row'];
export type MatchSetRow = Tables['match_sets']['Row'];
export type PlayEventRow = Tables['play_events']['Row'];
export type PlayEventAuditRow = Tables['play_event_audit']['Row'];

// ============================================
// INSERT/UPDATE TYPES
// ============================================

export type OrganizationInsert = Tables['organizations']['Insert'];
export type OrganizationUpdate = Tables['organizations']['Update'];

export type TeamInsert = Tables['teams']['Insert'];
export type TeamUpdate = Tables['teams']['Update'];

export type PlayerInsert = Tables['players']['Insert'];
export type PlayerUpdate = Tables['players']['Update'];

export type TeamRosterInsert = Tables['team_rosters']['Insert'];
export type TeamRosterUpdate = Tables['team_rosters']['Update'];

export type MatchInsert = Tables['matches']['Insert'];
export type MatchUpdate = Tables['matches']['Update'];

export type MatchSetInsert = Tables['match_sets']['Insert'];
export type MatchSetUpdate = Tables['match_sets']['Update'];

export type PlayEventInsert = Tables['play_events']['Insert'];
export type PlayEventUpdate = Tables['play_events']['Update'];

// ============================================
// UNIÓN DISCRIMINADA: PlayEventWithQuality
// El quality depende del fundamental
// ============================================

export type PlayEventServe = PlayEventRow & {
    fundamental: 'serve';
    quality: ServeQuality;
};

export type PlayEventReception = PlayEventRow & {
    fundamental: 'reception';
    quality: ReceptionQuality;
};

export type PlayEventAttack = PlayEventRow & {
    fundamental: 'attack';
    quality: AttackQuality;
};

export type PlayEventBlock = PlayEventRow & {
    fundamental: 'block';
    quality: BlockQuality;
};

export type PlayEventSet = PlayEventRow & {
    fundamental: 'set';
    quality: SetQuality;
};

export type PlayEventDefense = PlayEventRow & {
    fundamental: 'defense';
    quality: DefenseQuality;
};

export type PlayEventWithQuality =
    | PlayEventServe
    | PlayEventReception
    | PlayEventAttack
    | PlayEventBlock
    | PlayEventSet
    | PlayEventDefense;

// Type guard para discriminar por fundamental
export function isPlayEventServe(event: PlayEventWithQuality): event is PlayEventServe {
    return event.fundamental === 'serve';
}

export function isPlayEventReception(event: PlayEventWithQuality): event is PlayEventReception {
    return event.fundamental === 'reception';
}

export function isPlayEventAttack(event: PlayEventWithQuality): event is PlayEventAttack {
    return event.fundamental === 'attack';
}

export function isPlayEventBlock(event: PlayEventWithQuality): event is PlayEventBlock {
    return event.fundamental === 'block';
}

export function isPlayEventSet(event: PlayEventWithQuality): event is PlayEventSet {
    return event.fundamental === 'set';
}

export function isPlayEventDefense(event: PlayEventWithQuality): event is PlayEventDefense {
    return event.fundamental === 'defense';
}

// ============================================
// TIPOS COMPUESTOS PARA UI
// ============================================

// Partido con sus sets
export type MatchWithSets = MatchRow & {
    sets: MatchSetRow[];
};

// Equipo con roster completo
export type TeamWithRoster = TeamRow & {
    roster: (TeamRosterRow & { player: PlayerRow })[];
};

// Jugador con sus equipos históricos
export type PlayerWithHistory = PlayerRow & {
    teams: (TeamRosterRow & { team: TeamRow })[];
};

// Partido con equipos poblados
export type MatchWithTeams = MatchRow & {
    home_team: TeamRow;
    away_team: TeamRow;
};

// Set con info de marcador y estado
export type MatchSetWithScore = MatchSetRow & {
    home_team_name?: string;
    away_team_name?: string;
    is_completed: boolean;
    point_diff: number;
};

// ============================================
// RPC RETURN TYPES
// ============================================

export type PlayerMatchStats = Functions['get_player_match_stats']['Returns']['0'];
export type TeamMatchStats = Functions['get_team_match_stats']['Returns']['0'];
export type PlayerSeasonStats = Functions['get_player_season_stats']['Returns']['0'];

// Tipos más específicos para PlayerMatchStats (desestructurado)
export interface PlayerMatchStatsDetail {
    // Recepción
    receptions_total: number;
    receptions_excellent: number;
    receptions_positive: number;
    receptions_negative: number;
    receptions_error: number;
    reception_rating: number;

    // Ataque
    attacks_total: number;
    attacks_kills: number;
    attacks_errors: number;
    attacks_in_play: number;
    attack_efficiency: number;

    // Bloqueo
    blocks_total: number;
    blocks_kills: number;
    blocks_touches: number;
    blocks_assisted: number;
    blocks_errors: number;

    // Colocación
    sets_total: number;
    sets_assists: number;
    sets_errors: number;

    // Defensa
    defenses_total: number;
    defenses_digs: number;
    defenses_errors: number;
}

export interface TeamMatchStatsDetail {
    fundamental: Fundamental;
    quality: string;
    count: number;
}

export interface PlayerSeasonStatsDetail {
    match_id: string;
    match_date: string;
    opponent_team_name: string;
    is_home: boolean;
    // Recepción
    receptions_total: number;
    receptions_excellent: number;
    receptions_positive: number;
    receptions_negative: number;
    receptions_error: number;
    reception_rating: number;
    // Ataque
    attacks_total: number;
    attacks_kills: number;
    attacks_errors: number;
    attacks_in_play: number;
    attack_efficiency: number;
    // Bloqueo
    blocks_total: number;
    blocks_kills: number;
    blocks_touches: number;
    blocks_assisted: number;
    blocks_errors: number;
    // Colocación
    sets_total: number;
    sets_assists: number;
    sets_errors: number;
    // Defensa
    defenses_total: number;
    defenses_digs: number;
    defenses_errors: number;
}

// ============================================
// HELPERS PARA CÁLCULOS
// ============================================

/** Calcula rating de recepción: (3*E + 2*P + 1*N) / Total */
export function calculateReceptionRating(
    excellent: number,
    positive: number,
    negative: number,
    total: number
): number {
    if (total === 0) return 0;
    return Math.round((excellent * 3 + positive * 2 + negative * 1) / total * 100) / 100;
}

/** Calcula eficiencia de ataque: (Kills - Errors) / Total */
export function calculateAttackEfficiency(kills: number, errors: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((kills - errors) / total * 1000) / 1000;
}

/** Verifica si una calidad genera punto */
export function isPointQuality(fundamental: Fundamental, quality: string): boolean {
    const pointQualities: Record<Fundamental, string[]> = {
        serve: ['ace'],
        reception: [],
        attack: ['kill'],
        block: ['kill'],
        set: [],
        defense: [],
    };
    return pointQualities[fundamental]?.includes(quality) ?? false;
}

/** Obtiene el team_id que anota el punto basado en el evento */
export function getScoringTeam(
    event: PlayEventWithQuality,
    homeTeamId: string,
    awayTeamId: string
): string | null {
    if (!isPointQuality(event.fundamental, event.quality)) return null;
    return event.team_id === homeTeamId ? homeTeamId : awayTeamId;
}

// ============================================
// FILTROS Y QUERIES COMUNES
// ============================================

export type PlayEventFilters = {
    match_id?: string;
    set_number?: number;
    team_id?: string;
    player_id?: string;
    fundamental?: Fundamental;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
};

export type MatchFilters = {
    organization_id?: string;
    team_id?: string;
    status?: MatchStatus;
    date_from?: string;
    date_to?: string;
    tournament?: string;
};

// ============================================
// REALTIME PAYLOADS
// ============================================

export type RealtimePlayEventInsert = {
    new: PlayEventRow;
    old: null;
};

export type RealtimePlayEventDelete = {
    new: null;
    old: PlayEventRow;
};

export type RealtimePlayEventUpdate = {
    new: PlayEventRow;
    old: PlayEventRow;
};

export type RealtimeMatchSetUpdate = {
    new: MatchSetRow;
    old: MatchSetRow;
};