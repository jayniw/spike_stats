import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const envLines = envContent.split("\n");
    
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    console.error("Error loading .env.local:", error);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing environment variables!");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyClub() {
  console.log("🔍 Verifying club setup...\n");

  // Step 1: Check organization
  console.log("1️⃣ Checking organization...");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", "club-ejemplo")
    .single();

  if (orgError || !org) {
    console.error("❌ Organization not found:", orgError);
    return;
  }
  console.log("✅ Organization found:", org.name, "\n");

  // Step 2: Check teams
  console.log("2️⃣ Checking teams...");
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .eq("organization_id", org.id);

  if (teamsError) {
    console.error("❌ Error fetching teams:", teamsError);
    return;
  }
  console.log("✅ Teams found:", teams.length);
  teams.forEach((team) => {
    console.log("   -", team.name, "(", team.category, team.gender, ")");
  });
  console.log();

  // Step 3: Check players
  console.log("3️⃣ Checking players...");
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("organization_id", org.id);

  if (playersError) {
    console.error("❌ Error fetching players:", playersError);
    return;
  }
  console.log("✅ Players found:", players.length);
  teams.forEach((team) => {
    const teamPlayers = players.filter((p) => p.team_id === team.id);
    console.log("   -", team.name + ":", teamPlayers.length, "players");
  });
  console.log();

  // Step 4: Check admin user
  console.log("4️⃣ Checking admin user...");
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", org.id);

  if (membersError) {
    console.error("❌ Error fetching members:", membersError);
    return;
  }

  const owner = members.find((m) => m.role === "owner");
  if (!owner) {
    console.error("❌ No owner found for organization");
    return;
  }

  // Get user details from auth
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(owner.user_id);

  if (userError || !user) {
    console.error("❌ Error fetching user:", userError);
    return;
  }

  console.log("✅ Admin user found:", user.user.email, "\n");

  // Summary
  console.log("🎉 Verification complete!\n");
  console.log("📋 Summary:");
  console.log("   Organization:", org.name);
  console.log("   Teams:", teams.length);
  console.log("   Players:", players.length);
  console.log("   Admin Email:", user.user.email);
  console.log("\n✅ Everything looks good!");
}

verifyClub().catch(console.error);
