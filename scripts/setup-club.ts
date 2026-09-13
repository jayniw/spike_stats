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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Admin user data
const ADMIN_USER = {
  email: "jalir.duran.nogales@gmail.com",
  password: "Admin123!",
};

// Club data
const CLUB_DATA = {
  name: "Club Olympic",
  slug: "olympic",
};

// Teams data
const TEAMS_DATA = [
  {
    name: "Olympic",
    category: "U15",
    gender: "male",
    season: "2026",
  }
];

// Players data for U15
const U15_PLAYERS = [
  { dorsal: 1, first_name: "Carlos", last_name: "García", position: "setter", dominant_hand: "right" },
  { dorsal: 2, first_name: "Miguel", last_name: "López", position: "outside_hitter", dominant_hand: "right" },
  { dorsal: 3, first_name: "Antonio", last_name: "Martínez", position: "middle_blocker", dominant_hand: "left" },
  { dorsal: 4, first_name: "José", last_name: "Rodríguez", position: "middle_blocker", dominant_hand: "right" },
  { dorsal: 5, first_name: "Francisco", last_name: "Hernández", position: "libero", dominant_hand: "right" },
  { dorsal: 6, first_name: "David", last_name: "Moreno", position: "outside_hitter", dominant_hand: "right" },
  { dorsal: 7, first_name: "Juan", last_name: "Jiménez", position: "middle_blocker", dominant_hand: "right" },
  { dorsal: 8, first_name: "Pedro", last_name: "Ruiz", position: "setter", dominant_hand: "right" },
  { dorsal: 9, first_name: "Luis", last_name: "Díaz", position: "opposite", dominant_hand: "right" },
  { dorsal: 10, first_name: "Javier", last_name: "Fernández", position: "outside_hitter", dominant_hand: "left" },
  { dorsal: 11, first_name: "Carlos", last_name: "Sánchez", position: "middle_blocker", dominant_hand: "right" },
  { dorsal: 12, first_name: "Alejandro", last_name: "Torres", position: "libero", dominant_hand: "right" },
  { dorsal: 13, first_name: "Jorge", last_name: "Maldonado", position: "outside_hitter", dominant_hand: "right" },
  { dorsal: 14, first_name: "Sebastián", last_name: "Durán Tejerina", position: "opposite", dominant_hand: "left" },
];

async function setupClub() {
  console.log("🏐 Starting club setup...\n");

  // Step 1: Create admin user FIRST (needed for owner_id)
  console.log("1️⃣ Creating admin user...");
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_USER.email,
    password: ADMIN_USER.password,
    email_confirm: true,
  });

  if (authError) {
    console.error("❌ Error creating auth user:", authError);
    return;
  }
  console.log("✅ Auth user created:", authUser.user.email, "\n");

  // Step 2: Create organization with owner_id
  console.log("2️⃣ Creating organization...");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      ...CLUB_DATA,
      owner_id: authUser.user.id,
    })
    .select()
    .single();

  if (orgError) {
    console.error("❌ Error creating organization:", orgError);
    return;
  }
  console.log("✅ Organization created:", org.name, "(", org.id, ")\n");

  // Step 3: Add user to organization_members
  console.log("3️⃣ Adding user to organization...");
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: authUser.user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("❌ Error adding user to organization:", memberError);
    return;
  }
  console.log("✅ User added as owner\n");

  // Step 4: Create team
  console.log("4️⃣ Creating team...");
  const teamsWithOrg = TEAMS_DATA.map((team) => ({
    ...team,
    organization_id: org.id,
  }));

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .insert(teamsWithOrg)
    .select();

  if (teamsError) {
    console.error("❌ Error creating team:", teamsError);
    return;
  }
  console.log("✅ Team created:", teams[0]?.name, "\n");

  // Step 5: Create players
  console.log("5️⃣ Creating players...");
  const team = teams[0];
  if (team) {
    // Create players (without team_id - players are org-level)
    const playersForOrg = U15_PLAYERS.map((player) => ({
      first_name: player.first_name,
      last_name: player.last_name,
      dominant_hand: player.dominant_hand,
      organization_id: org.id,
    }));

    const { data: players, error: playersError } = await supabase
      .from("players")
      .insert(playersForOrg)
      .select();

    if (playersError) {
      console.error("❌ Error creating players:", playersError);
      return;
    }
    console.log("✅ Players created:", players.length);

    // Step 6: Create roster entries (link players to team with dorsal and position)
    console.log("6️⃣ Creating roster entries...");
    const rosterEntries = players.map((player, index) => ({
      team_id: team.id,
      player_id: player.id,
      jersey_number: U15_PLAYERS[index].dorsal,
      position: U15_PLAYERS[index].position,
    }));

    const { error: rosterError } = await supabase
      .from("team_rosters")
      .insert(rosterEntries);

    if (rosterError) {
      console.error("❌ Error creating roster:", rosterError);
      return;
    }
    console.log("✅ Roster entries created:", rosterEntries.length, "\n");
  }

  // Summary
  console.log("🎉 Club setup complete!\n");
  console.log("📋 Summary:");
  console.log("   Organization:", org.name);
  console.log("   Team:", teams[0]?.name);
  console.log("   Players:", U15_PLAYERS.length);
  console.log("   Admin Email:", ADMIN_USER.email);
  console.log("   Admin Password:", ADMIN_USER.password);
  console.log("\n🔑 You can now log in with these credentials!");
}

setupClub().catch(console.error);
