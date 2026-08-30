# SpikeStats — Control y estadísticas de voleibol

Aplicación web para registrar partidos de voleibol **en vivo** y analizar el
rendimiento de equipos y jugadores mediante dashboards con promedios,
eficiencias y tendencias.

## Objetivo

Que un entrenador o analista pueda anotar sus partidos mientras se juegan y
responder preguntas como: ¿cómo viene rindiendo el equipo?, ¿qué jugador tiene
mejor eficiencia de ataque?, ¿dónde perdemos más puntos?

## Funcionalidades núcleo (MVP)

1. **Gestión de equipos y jugadores**: roster, posiciones (colocador, opuesto,
   centrales, receptores, líbero), dorsales.
2. **Registro de partidos**: rival, fecha, competencia, resultado por sets.
3. **Anotación en vivo** ⭐ funcionalidad central:
   - **Mobile-first**: el dispositivo primario de anotación es el **teléfono**
     del entrenador — todos tienen uno, nadie debería depender de conseguir una
     tablet o laptop en la cancha. Interfaz tipo "tap" operable con una mano,
     botones grandes y tolerantes al pulso, sin perder jugadas.
   - Registro por acción en tiempo real: saque, recepción, ataque, bloqueo,
     defensa y colocación; cada acción con resultado (punto / error / continuidad).
   - Sincronización en tiempo real con Supabase (Realtime): lo anotado en la
     cancha se ve al instante en el dashboard.
   - Tolerante a cortes de red: si se cae la conexión durante el partido, la
     anotación local no se pierde y se sincroniza al reconectar.
   - Marcador en vivo compartible (link público de solo lectura del partido en curso).
4. **Dashboard de equipo**: resultados históricos, % de victorias, sets
   ganados/perdidos, eficiencias agregadas del equipo, evolución por temporada.
5. **Dashboard por jugador**: promedios por partido, eficiencia de ataque,
   % de acierto en saque (aces/errores), calidad de recepción, comparativas
   entre jugadores y tendencia temporal.

## Multi-tenant desde el día uno

El producto está pensado para servir a múltiples clubes/instituciones en una
sola instancia:

- Modelo de datos con `organizations` (clubes) y aislamiento de todos los
  recursos bajo su organización.
- **Row Level Security (RLS)** en todas las tablas de Supabase como mecanismo
  primario de aislamiento.
- Roles por organización (admin del club, entrenador, analista, jugador,
  espectador) con permisos diferenciados para anotar, editar y ver.
- Onboarding que permita crear un club nuevo e invitar usuarios.
- Ninguna consulta ni endpoint puede cruzar datos entre organizaciones.

## Métricas clave

- Puntos por set (PPS)
- Eficiencia de ataque: `(kills - errores) / intentos`
- Kill %: `kills / intentos`
- Ace % y errores de saque por set
- Recepción: `% perfectas` / errores de recepción
- Bloqueos por set (puntos de bloqueo)

## Stack tentativo

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript** | **Mobile-first**: la anotación en vivo se diseña primero para teléfono; dashboards adaptables a escritorio. PWA instalable en pantalla de inicio |
| UI | **shadcn/ui + Tailwind CSS** | Componentes accesibles y rápidos de iterar |
| Backend/Datos | **Supabase** | Postgres + Auth + Row Level Security + Realtime (anotación en vivo); respetar límites del free tier |
| Despliegue | **Vercel** | Free tier, previews por PR |
| Gráficos | Recharts | Dashboards de equipo y jugador |

Consideraciones de free tier: presupuesto de queries e índices pensado para
los límites de Supabase gratis (~500 MB de BD, proyecto se pausa por inactividad),
y evitar funciones serverless de larga duración.

## Fuera de alcance (por ahora)

- Apps móviles nativas (la PWA mobile-first cubre la anotación en cancha)
- Análisis de video
- Facturación/suscripciones (el modelo multi-tenant se diseña ya, pero sin cobros)

## SpikeStats MVP

Plataforma multi-tenant de estadísticas en vivo para voleibol: permite a los
clubes gestionar equipos y jugadores, anotar partidos desde el teléfono con un
toque por jugada (tolerante a cortes de red), compartir un marcador público en
tiempo real y analizar el rendimiento mediante dashboards de equipo y jugador.
La especificación completa del MVP está en
[specs/001-spikestats-mvp/spec.md](specs/001-spikestats-mvp/spec.md).

### Requisitos

- Node.js 20 LTS o superior + npm
- Un proyecto **Supabase hosteado** (free tier) creado en
  [supabase.com/dashboard](https://supabase.com/dashboard)
  — no se requiere Docker ni stack local

> Free tier: un proyecto inactivo ~1 semana se pausa (se restaura desde el
> dashboard con un clic; los datos persisten). El CLI de Supabase solo se usa
> para aplicar migraciones (`db push`) — no necesita Docker.

### Configuración

1. Instala dependencias:

   ```powershell
   npm ci        # o: npm install
   ```

2. Variables de entorno: copia `.env.local.example` a `.env.local` y completa
   los valores desde Dashboard → Project Settings → API.

   ```powershell
   Copy-Item .env.local.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave "anon public" / "publishable"
   - `SUPABASE_SERVICE_ROLE_KEY`: solo para scripts de servidor (seed/tests);
     nunca la expongas al navegador ni la subas a git.

3. Aplica las migraciones al proyecto hosteado:

   ```powershell
   npx supabase db push    # aplica supabase/migrations (schema + RLS)
   ```

   Alternativa sin CLI: copia cada archivo de `supabase/migrations/` en el
   SQL Editor del dashboard (en orden).

4. Carga datos demo (club, usuarios por rol y temporada con partidos):

   ```powershell
   npm run seed:demo
   ```

5. Arranca en desarrollo:

   ```powershell
   npm run dev         # http://localhost:3000
   ```

### Cuentas de prueba (fixture)

El seed crea usuarios por rol en el club demo: `admin@demo.club`,
`coach@demo.club`, `analyst@demo.club`, `player@demo.club`. Las contraseñas se
imprimen al ejecutar el seed.

### Quality gates

```powershell
npm run lint && npm run typecheck && npm run test && npm run test:e2e
```

Todos deben pasar en verde antes de cualquier merge.
