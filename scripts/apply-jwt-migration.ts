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

async function applyMigration() {
  console.log("🔄 Applying JWT migration...\n");

  // Read the migration file
  const migrationPath = join(process.cwd(), "supabase", "migrations", "20260913000001_add_org_id_to_jwt.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  // Execute the migration
  const { data, error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

  if (error) {
    console.error("❌ Error applying migration:", error);
    console.log("\n💡 You may need to run this SQL manually in Supabase Dashboard:");
    console.log("   Go to: https://supabase.com/dashboard/project/zssttxbjnmoqwoermlld/sql/new");
    console.log("   Paste and run the SQL from: supabase/migrations/20260913000001_add_org_id_to_jwt.sql");
    return;
  }

  console.log("✅ Migration applied successfully!\n");

  // Verify by checking a user's metadata
  console.log("🔍 Verifying JWT claims...");
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id, organization_id")
    .limit(1);

  if (membersError || !members.length) {
    console.log("⚠️  Could not verify - no members found");
    return;
  }

  const member = members[0];
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(member.user_id);

  if (userError || !user) {
    console.log("⚠️  Could not verify - user not found");
    return;
  }

  const orgIdInMetadata = user.user.app_metadata?.org_id;
  console.log("   User:", user.user.email);
  console.log("   org_id in app_metadata:", orgIdInMetadata || "NOT SET");

  if (orgIdInMetadata) {
    console.log("\n✅ JWT claims updated! User will have org_id in their token on next login.");
  } else {
    console.log("\n⚠️  org_id not yet in metadata. May need to re-login.");
  }
}

applyMigration().catch(console.error);
