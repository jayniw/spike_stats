// Tipos TypeScript generados desde el esquema de Supabase
// GENERADO AUTOMÁTICAMENTE - NO EDITAR MANUALMENTE
// Ejecutar: pnpm run types:generate

// ============================================
// ENUMS
// ============================================

export type Enums = {
    organization_role: 'owner' | 'admin' | 'coach' | 'parent' | 'viewer';
    match_status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
    match_format: 'best_of_3' | 'best_of_5';
    fundamental: 'serve' | 'reception' | 'attack' | 'block' | 'set' | 'defense';
    serve_quality: 'ace' | 'in_play' | 'error';
    reception_quality: 'excellent' | 'positive' | 'negative' | 'error';
    attack_quality: 'kill' | 'in_play' | 'blocked' | 'out' | 'net';
    block_quality: 'kill' | 'touch' | 'assisted' | 'error';
    set_quality: 'assist' | 'error';
    defense_quality: 'dig' | 'error';
    set_status: 'pending' | 'in_progress' | 'completed';
    serving_team: 'home' | 'away';
    court_zone: number; // 1-18
};

// ============================================
// COMPOSITE TYPES (vacío por ahora)
// ============================================

export type CompositeTypes = {
    [key: string]: never;
};

// ============================================
// TABLES
// ============================================

export type Tables = {
    organizations: {
        Row: {
            id: string;
            name: string;
            slug: string;
            owner_id: string;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            name: string;
            slug: string;
            owner_id: string;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            id?: string;
            name?: string;
            slug?: string;
            owner_id?: string;
            created_at?: string;
            updated_at?: string;
        };
    };
    organization_members: {
        Row: {
            id: string;
            organization_id: string;
            user_id: string;
            role: Enums['organization_role'];
            joined_at: string;
        };
        Insert: {
            id?: string;
            organization_id: string;
            user_id: string;
            role?: Enums['organization_role'];
            joined_at?: string;
        };
        Update: {
            id?: string;
            organization_id?: string;
            user_id?: string;
            role?: Enums['organization_role'];
            joined_at?: string;
        };
    };
    teams: {
        Row: {
            id: string;
            organization_id: string;
            name: string;
            category: string;
            gender: 'male' | 'female' | 'mixed';
            season: string;
            created_at: string;
        };
        Insert: {
            id?: string;
            organization_id: string;
            name: string;
            category: string;
            gender: 'male' | 'female' | 'mixed';
            season: string;
            created_at?: string;
        };
        Update: {
            id?: string;
            organization_id?: string;
            name?: string;
            category?: string;
            gender?: 'male' | 'female' | 'mixed';
            season?: string;
            created_at?: string;
        };
    };
    players: {
        Row: {
            id: string;
            organization_id: string;
            first_name: string;
            last_name: string;
            birth_date: string | null;
            dominant_hand: 'right' | 'left' | 'ambidextrous' | null;
            height_cm: number | null;
            photo_url: string | null;
            created_at: string;
        };
        Insert: {
            id?: string;
            organization_id: string;
            first_name: string;
            last_name: string;
            birth_date?: string | null;
            dominant_hand?: 'right' | 'left' | 'ambidextrous' | null;
            height_cm?: number | null;
            photo_url?: string | null;
            created_at?: string;
        };
        Update: {
            id?: string;
            organization_id?: string;
            first_name?: string;
            last_name?: string;
            birth_date?: string | null;
            dominant_hand?: 'right' | 'left' | 'ambidextrous' | null;
            height_cm?: number | null;
            photo_url?: string | null;
            created_at?: string;
        };
    };
    team_rosters: {
        Row: {
            id: string;
            team_id: string;
            player_id: string;
            jersey_number: number;
            position: 'setter' | 'outside_hitter' | 'middle_blocker' | 'opposite' | 'libero' | 'defensive_specialist';
            start_date: string;
            end_date: string | null;
        };
        Insert: {
            id?: string;
            team_id: string;
            player_id: string;
            jersey_number: number;
            position: 'setter' | 'outside_hitter' | 'middle_blocker' | 'opposite' | 'libero' | 'defensive_specialist';
            start_date?: string;
            end_date?: string | null;
        };
        Update: {
            id?: string;
            team_id?: string;
            player_id?: string;
            jersey_number?: number;
            position?: 'setter' | 'outside_hitter' | 'middle_blocker' | 'opposite' | 'libero' | 'defensive_specialist';
            start_date?: string;
            end_date?: string | null;
        };
    };
    matches: {
        Row: {
            id: string;
            organization_id: string;
            home_team_id: string;
            away_team_id: string | null;
            opponent_name: string | null;
            match_date: string;
            venue: string | null;
            tournament: string | null;
            phase: string | null;
            format: Enums['match_format'];
            points_per_set: number;
            min_point_diff: number;
            status: Enums['match_status'];
            current_set: number;
            started_at: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            organization_id: string;
            home_team_id: string;
            away_team_id?: string | null;
            opponent_name?: string | null;
            match_date: string;
            venue?: string | null;
            tournament?: string | null;
            phase?: string | null;
            format?: Enums['match_format'];
            points_per_set?: number;
            min_point_diff?: number;
            status?: Enums['match_status'];
            current_set?: number;
            started_at?: string | null;
            created_at?: string;
            updated_at?: string;
        };
        Update: {
            id?: string;
            organization_id?: string;
            home_team_id?: string;
            away_team_id?: string | null;
            opponent_name?: string | null;
            match_date?: string;
            venue?: string | null;
            tournament?: string | null;
            phase?: string | null;
            format?: Enums['match_format'];
            points_per_set?: number;
            min_point_diff?: number;
            status?: Enums['match_status'];
            current_set?: number;
            created_at?: string;
            updated_at?: string;
        };
    };
    match_sets: {
        Row: {
            id: string;
            match_id: string;
            set_number: number;
            points_home: number;
            points_away: number;
            target_points: number;
            min_diff: number;
            winner_team_id: string | null;
            status: Enums['set_status'];
            current_rotation: number | null;
            serving_team: Enums['serving_team'] | null;
            server_position: number | null;
            started_at: string | null;
            completed_at: string | null;
            organization_id: string;
        };
        Insert: {
            id?: string;
            match_id: string;
            set_number: number;
            points_home?: number;
            points_away?: number;
            target_points?: number;
            min_diff?: number;
            winner_team_id?: string | null;
            status?: Enums['set_status'];
            current_rotation?: number | null;
            serving_team?: Enums['serving_team'] | null;
            server_position?: number | null;
            started_at?: string | null;
            completed_at?: string | null;
            organization_id?: string;
        };
        Update: {
            id?: string;
            match_id?: string;
            set_number?: number;
            points_home?: number;
            points_away?: number;
            target_points?: number;
            min_diff?: number;
            winner_team_id?: string | null;
            status?: Enums['set_status'];
            current_rotation?: number | null;
            serving_team?: Enums['serving_team'] | null;
            server_position?: number | null;
            started_at?: string | null;
            completed_at?: string | null;
            organization_id?: string;
        };
    };
    play_events: {
        Row: {
            id: string;
            match_id: string;
            set_number: number;
            team_id: string;
            player_id: string;
            fundamental: Enums['fundamental'];
            quality: string;
            rotation: number | null;
            court_zone_start: number | null;
            court_zone_end: number | null;
            block_touches: number | null;
            target_player_id: string | null;
            attack_type: 'spike' | 'tip' | 'roll_shot' | 'setter_dump' | null;
            difficulty: number | null;
            metadata: Record<string, unknown>;
            created_at: string;
            organization_id: string;
        };
        Insert: {
            id?: string;
            match_id: string;
            set_number: number;
            team_id: string;
            player_id: string;
            fundamental: Enums['fundamental'];
            quality: string;
            rotation?: number | null;
            court_zone_start?: number | null;
            court_zone_end?: number | null;
            block_touches?: number | null;
            target_player_id?: string | null;
            attack_type?: 'spike' | 'tip' | 'roll_shot' | 'setter_dump' | null;
            difficulty?: number | null;
            metadata?: Record<string, unknown>;
            created_at?: string;
            organization_id?: string;
        };
        Update: {
            id?: string;
            match_id?: string;
            set_number?: number;
            team_id?: string;
            player_id?: string;
            fundamental?: Enums['fundamental'];
            quality?: string;
            rotation?: number | null;
            court_zone_start?: number | null;
            court_zone_end?: number | null;
            block_touches?: number | null;
            target_player_id?: string | null;
            attack_type?: 'spike' | 'tip' | 'roll_shot' | 'setter_dump' | null;
            difficulty?: number | null;
            metadata?: Record<string, unknown>;
            created_at?: string;
            organization_id?: string;
        };
    };
    play_event_audit: {
        Row: {
            id: string;
            play_event_id: string;
            organization_id: string;
            action: 'INSERT' | 'UPDATE' | 'DELETE';
            old_data: Record<string, unknown> | null;
            new_data: Record<string, unknown> | null;
            user_id: string | null;
            created_at: string;
        };
        Insert: {
            id?: string;
            play_event_id: string;
            organization_id: string;
            action: 'INSERT' | 'UPDATE' | 'DELETE';
            old_data?: Record<string, unknown> | null;
            new_data?: Record<string, unknown> | null;
            user_id?: string | null;
            created_at?: string;
        };
        Update: {
            id?: string;
            play_event_id?: string;
            organization_id?: string;
            action?: 'INSERT' | 'UPDATE' | 'DELETE';
            old_data?: Record<string, unknown> | null;
            new_data?: Record<string, unknown> | null;
            user_id?: string | null;
            created_at?: string;
        };
    };
};

// ============================================
// FUNCTIONS (RPCs)
// ============================================

export type Functions = {
    get_player_match_stats: {
        Args: { p_match_id: string; p_player_id: string };
        Returns: {
            receptions_total: number;
            receptions_excellent: number;
            receptions_positive: number;
            receptions_negative: number;
            receptions_error: number;
            reception_rating: number;
            attacks_total: number;
            attacks_kills: number;
            attacks_blocked: number;
            attacks_out: number;
            attacks_net: number;
            attacks_errors: number;
            attacks_in_play: number;
            attack_efficiency: number;
            blocks_total: number;
            blocks_kills: number;
            blocks_touches: number;
            blocks_assisted: number;
            blocks_errors: number;
            sets_total: number;
            sets_assists: number;
            sets_errors: number;
            defenses_total: number;
            defenses_digs: number;
            defenses_errors: number;
        }[];
    };
    get_team_match_stats: {
        Args: { p_match_id: string; p_team_id: string };
        Returns: {
            fundamental: string;
            quality: string;
            count: number;
        }[];
    };
    get_player_season_stats: {
        Args: { p_player_id: string; p_season: string };
        Returns: {
            match_id: string;
            match_date: string;
            opponent_team_name: string;
            is_home: boolean;
            receptions_total: number;
            receptions_excellent: number;
            receptions_positive: number;
            receptions_negative: number;
            receptions_error: number;
            reception_rating: number;
            attacks_total: number;
            attacks_kills: number;
            attacks_blocked: number;
            attacks_out: number;
            attacks_net: number;
            attacks_errors: number;
            attacks_in_play: number;
            attack_efficiency: number;
            blocks_total: number;
            blocks_kills: number;
            blocks_touches: number;
            blocks_assisted: number;
            blocks_errors: number;
            sets_total: number;
            sets_assists: number;
            sets_errors: number;
            defenses_total: number;
            defenses_digs: number;
            defenses_errors: number;
        }[];
    };
    recalculate_set_score: {
        Args: Record<string, never>;
        Returns: void;
    };
    current_org: {
        Args: Record<string, never>;
        Returns: string | null;
    };
    validate_fundamental_quality: {
        Args: Record<string, never>;
        Returns: unknown;
    };
    set_organization_id_on_insert: {
        Args: Record<string, never>;
        Returns: unknown;
    };
    audit_play_event_delete: {
        Args: Record<string, never>;
        Returns: unknown;
    };
    update_updated_at_column: {
        Args: Record<string, never>;
        Returns: unknown;
    };
};