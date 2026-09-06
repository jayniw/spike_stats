# Migraciones Supabase - Spike Stats

## Orden de Aplicación

Las migraciones deben aplicarse en orden numérico:

```
001_core_schema.sql      → Enums, tablas core, índices básicos
002_rls_policies.sql     → RLS, policies, current_org(), triggers org_id
003_triggers_rpcs_indexes.sql → Triggers validación/marcador/auditoría, RPCs, índices compuestos
```

## Detalle por Migración

### 001_core_schema.sql - Esquema Base

**Propósito**: Crear toda la estructura de datos fundamental.

**Contenido**:
- **13 Enums/Domains**: `organization_role`, `match_status`, `match_format`, `fundamental`, 6 calidades por fundamental, `court_zone` (domain 1-18), `set_status`, `serving_team`
- **9 Tablas**: `organizations`, `organization_members`, `teams`, `players`, `team_rosters`, `matches`, `match_sets`, `play_events`, `play_event_audit`
- **Índices básicos**: FKs y columnas de consulta frecuente
- **Trigger `updated_at`**: En `organizations` y `matches`

**Dependencias**: Ninguna (migración inicial)

**Rollback**: `DROP TABLE ... CASCADE` en orden inverso + `DROP TYPE` para enums

---

### 002_rls_policies.sql - Seguridad y Multitenancy

**Propósito**: Habilitar Row Level Security y crear policies de aislamiento por organización.

**Contenido**:
- **Función `current_org()`**: Lee `auth.jwt() ->> 'org_id'` con fallback null
- **Columnas `organization_id`**: Añadidas a `match_sets` y `play_events` (denormalizadas)
- **RLS habilitado**: En todas las 9 tablas
- **Policies CRUD**: Por tabla según roles:
  - `organizations`: owner full, miembros select
  - `organization_members`: admin/coach gestionan, miembros ven
  - `teams/players/rosters`: coach+ gestionan, todos ven
  - `matches`: coach+ gestionan, todos ven
  - `match_sets/play_events`: coach+ gestionan (insert con validación de rol), todos ven
  - `play_event_audit`: solo select (append-only via trigger)
- **Trigger `set_organization_id_on_insert`**: Pobla `organization_id` en `play_events` y `match_sets` desde `matches`
- **Índices RLS**: En `organization_id` de tablas denormalizadas
- **Grants**: SELECT para anon/authenticated/service_role en todas las tablas

**Dependencias**: 001_core_schema (tablas y enums deben existir)

**Rollback**: `DROP POLICY`, `DROP TRIGGER`, `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`, `DROP COLUMN organization_id`, `DROP FUNCTION current_org`

---

### 003_triggers_rpcs_indexes.sql - Lógica de Negocio y Performance

**Propósito**: Triggers de validación, recálculo automático de marcador, auditoría, RPCs para stats, índices compuestos.

**Contenido**:
- **Trigger `validate_fundamental_quality`** (BEFORE INSERT en play_events):
  - Valida combinaciones fundamental+quality via CASE statement
  - Lanza excepción `check_violation` si inválida
- **Trigger `recalculate_set_score`** (AFTER INSERT OR DELETE en play_events):
  - Cuenta eventos de punto (ace, kill, block_kill, opponent_error)
  - Actualiza `points_home`/`points_away` en `match_sets`
  - Solo recalcula el set afectado (performance)
- **Trigger `audit_play_event_delete`** (AFTER DELETE en play_events):
  - Inserta en `play_event_audit` con action='DELETE', old_data, user_id
- **RPC `get_player_match_stats`**: Stats completas jugador/partido (recepción, ataque, bloqueo, colocación, defensa)
- **RPC `get_team_match_stats`**: Agregado por equipo (fundamental + quality + count)
- **RPC `get_player_season_stats`**: Dashboard temporada (join lateral por partido)
- **6 Índices compuestos**: Optimizados para Realtime, stats, reportes
- **Grants EXECUTE**: En todas las RPCs para anon/authenticated/service_role

**Dependencias**: 001_core_schema, 002_rls_policies (tablas, RLS, organization_id)

**Rollback**: `DROP TRIGGER`, `DROP FUNCTION` para RPCs y triggers, `DROP INDEX`

---

## Comandos Útiles

```bash
# Ver migraciones pendientes
pnpm supabase migration list

# Aplicar todas (local con Docker)
pnpm supabase db reset

# Aplicar a proyecto cloud
pnpm supabase db push --project-ref zssttxbjnmoqwoermlld

# Revertir última migración
pnpm supabase migration down

# Ver diff con remoto
pnpm supabase db diff --schema public --project-ref zssttxbjnmoqwoermlld

# Generar tipos TypeScript
pnpm run types:generate
```

## CI/CD (GitHub Actions)

El workflow `.github/workflows/supabase.yml` ejecuta en cada push a main:
1. `pnpm supabase db push` → Aplica migraciones a staging
2. `pnpm run types:generate` → Genera types actualizados
3. `pnpm tsc --noEmit` → Valida tipos
4. Commit automático de `src/types/database.ts` si cambió

Requiere secret `SUPABASE_ACCESS_TOKEN` en GitHub.

## Testing Local

```bash
# Con Docker local
pnpm supabase db reset
psql -f supabase/seed.sql

# Solo cloud (seed manual)
# Pegar supabase/seed.sql en Supabase SQL Editor
```

## Notas Importantes

1. **Migraciones son reversibles**: Cada una tiene up/down implícito
2. **Orden estricto**: 001 → 002 → 003 (dependencias FK, RLS, triggers)
3. **Cloud-first**: Desarrollo contra proyecto cloud, no local Docker
4. **Tipos sincronizados**: `types:generate` en CI mantiene `database.ts` al día
5. **RLS desde día 1**: No hay datos sin organización, policies en todas las tablas