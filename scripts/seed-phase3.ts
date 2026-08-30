/**
 * Seed para Fase 3 — Usuarios, perfiles y membresías.
 * Ejecutar después de aplicar migraciones 0001 y 0002.
 *
 * Uso: pnpm seed:phase3
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./lib/load-env";

loadEnvFile([".env.local", ".env"]);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error("Faltan variables de entorno en .env.local");
  process.exit(1);
}

const db = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "demo1234!";

type Role = "club_admin" | "coach" | "analyst" | "player" | "spectator";

const CLUBS = [
  {
    name: "Club Demo",
    users: [
      { email: "admin@demo.club", role: "club_admin" as Role, name: "Carlos Ruiz", phone: "+525512345678" },
      { email: "coach@demo.club", role: "coach" as Role, name: "María López", phone: "+525512345679" },
      { email: "analyst@demo.club", role: "analyst" as Role, name: "Ana García", phone: "+525512345680" },
      { email: "player@demo.club", role: "player" as Role, name: "Laura Hernández", phone: "+525512345681" },
      { email: "spectator@demo.club", role: "spectator" as Role, name: "Pedro Martínez", phone: "+525512345682" },
    ],
  },
  {
    name: "Club Atlético Río",
    users: [
      { email: "admin@rio.club", role: "club_admin" as Role, name: "Roberto Díaz", phone: "+525598765432" },
    ],
  },
];

async function ensureUser(email: string): Promise<string> {
  const { data: list } = await db.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`  ✓ ${email} ya existe`);
    return existing.id;
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`No se pudo crear ${email}: ${error.message}`);
  const id = data.user?.id;
  if (!id) throw new Error(`Usuario ${email} creado sin id`);
  console.log(`  + ${email} creado`);
  return id;
}

async function ensureProfile(userId: string, name: string, phone: string): Promise<void> {
  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (existing) {
    // Update if empty
    await db
      .from("profiles")
      .update({ full_name: name, phone, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .eq("full_name", "");
    return;
  }

  const { error } = await db.from("profiles").insert({
    id: userId,
    full_name: name,
    phone,
  });
  if (error) {
    console.warn(`  ⚠ No se pudo crear perfil: ${error.message}`);
  }
}

async function ensureOrg(name: string): Promise<string> {
  const { data: existing } = await db
    .from("organizations")
    .select("id")
    .eq("name", name)
    .single();

  if (existing) {
    console.log(`  ✓ "${name}" ya existe`);
    return (existing as { id: string }).id;
  }

  const { data, error } = await db
    .from("organizations")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear "${name}": ${error.message}`);
  console.log(`  + "${name}" creado`);
  return (data as { id: string }).id;
}

async function ensureMembership(
  orgId: string,
  userId: string,
  role: Role,
  invitedById: string,
): Promise<void> {
  const { data: existing } = await db
    .from("memberships")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .single();

  if (existing) return;

  const { error } = await db.from("memberships").insert({
    organization_id: orgId,
    user_id: userId,
    role,
    status: "active",
    invited_by: invitedById,
  });
  if (error) {
    console.warn(`  ⚠ No se pudo crear membresía ${role}: ${error.message}`);
  }
}

async function main() {
  console.log("\n🏐 Seed Fase 3 — Usuarios, perfiles y membresías\n");

  try {
    const resp = await fetch(`${URL}/rest/v1/`, { signal: AbortSignal.timeout(5000) });
    if (resp.status >= 500) throw new Error("Server error");
  } catch {
    console.error(`❌ Supabase no responde en ${URL}`);
    process.exit(1);
  }

  const credentials: string[][] = [];

  for (const club of CLUBS) {
    console.log(`\n📋 ${club.name}`);
    const orgId = await ensureOrg(club.name);
    let adminId = "";

    for (const { email, role, name, phone } of club.users) {
      const userId = await ensureUser(email);
      if (role === "club_admin") adminId = userId;
      await ensureProfile(userId, name, phone);
      await ensureMembership(orgId, userId, role, adminId || userId);
      credentials.push([club.name, role, email, name, PASSWORD]);
    }
  }

  console.log("\n\n┌─────────────────────────┬───────────────┬─────────────────────┬──────────────────┬───────────────┐");
  console.log("│ CLUB                    │ ROL           │ EMAIL               │ NOMBRE           │ CONTRASEÑA     │");
  console.log("├─────────────────────────┼───────────────┼─────────────────────┼──────────────────┼───────────────┤");
  for (const row of credentials) {
    const club = (row[0] ?? "").padEnd(23);
    const role = (row[1] ?? "").padEnd(13);
    const email = (row[2] ?? "").padEnd(19);
    const name = (row[3] ?? "").padEnd(16);
    const pass = (row[4] ?? "").padEnd(13);
    console.log(`│ ${club} │ ${role} │ ${email} │ ${name} │ ${pass} │`);
  }
  console.log("└─────────────────────────┴───────────────┴─────────────────────┴──────────────────┴───────────────┘");

  console.log("\n✅ Seed completado. Arranca con: pnpm dev\n");
}

main().catch((err) => {
  console.error("\n❌ Seed falló:", err.message);
  process.exit(1);
});
