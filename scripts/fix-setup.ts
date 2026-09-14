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

async function fixSetup() {
  console.log("🏐 Fixing club setup...\n");

  // Step 1: Get existing user
  console.log("1️⃣ Getting existing user...");
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error("❌ Error listing users:", usersError);
    return;
  }

  const user = users.users.find(u => u.email === "jalir.duran.nogales@gmail.com");
  if (!user) {
    console.error("❌ User not found!");
    return;
  }
  console.log("✅ User found:", user.email, "(", user.id, ")\n");

  // Step 2: Check if organization exists
  console.log("2️⃣ Checking organization...");
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "olympic")
    .maybeSingle();

  let orgId: string;

  if (existingOrg) {
    console.log("✅ Organization already exists:", existingOrg.id, "\n");
    orgId = existingOrg.id;
  } else {
    // Create organization
    console.log("Creating organization...");
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: "Club Olympic",
        slug: "olympic",
        owner_id: user.id,
      })
      .select()
      .single();

    if (orgError) {
      console.error("❌ Error creating organization:", orgError);
      return;
    }
    console.log("✅ Organization created:", org.name, "(", org.id, ")\n");
    orgId = org.id;
  }

  // Step 3: Check if user is member
  console.log("3️⃣ Checking membership...");
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    console.log("✅ User is already a member\n");
  } else {
    // Add membership
    console.log("Adding user as member...");
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: orgId,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("❌ Error adding member:", memberError);
      return;
    }
    console.log("✅ User added as owner\n");
  }

  // Step 4: Check if team exists
  console.log("4️⃣ Checking team...");
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("organization_id", orgId)
    .eq("name", "Olympic")
    .maybeSingle();

  let teamId: string;

  if (existingTeam) {
    console.log("✅ Team already exists:", existingTeam.id, "\n");
    teamId = existingTeam.id;
  } else {
    // Create team
    console.log("Creating team...");
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: "Olympic",
        category: "U15",
        gender: "male",
        season: "2026",
        organization_id: orgId,
      })
      .select()
      .single();

    if (teamError) {
      console.error("❌ Error creating team:", teamError);
      return;
    }
    console.log("✅ Team created:", team.name, "(", team.id, ")\n");
    teamId = team.id;
  }

  // Step 5: Check if players exist
  console.log("5️⃣ Checking players...");
  const { data: existingPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1);

  if (existingPlayers && existingPlayers.length > 0) {
    console.log("✅ Players already exist\n");
  } else {
    // Players data
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

    console.log("Creating players...");
    const playersForOrg = U15_PLAYERS.map((player) => ({
      first_name: player.first_name,
      last_name: player.last_name,
      dominant_hand: player.dominant_hand,
      organization_id: orgId,
    }));

    const { data: players, error: playersError } = await supabase
      .from("players")
      .insert(playersForOrg)
      .select();

    if (playersError) {
      console.error("❌ Error creating players:", playersError);
      return;
    }
    console.log("✅ Players created:", players.length, "\n");

    // Step 6: Create roster entries
    console.log("6️⃣ Creating roster entries...");
    const rosterEntries = players.map((player, index) => ({
      team_id: teamId,
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
  console.log("   Organization: Club Olympic (", orgId, ")");
  console.log("   Team: Olympic (", teamId, ")");
  console.log("   Admin Email: jalir.duran.nogales@gmail.com");
  console.log("\n🔑 You can now log in with these credentials!");
}

fixSetup().catch(console.error);
