import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";

export default async function Home() {
  const client = await createServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Find user's active memberships
  const { data: memberships } = await client
    .from("memberships" as never)
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(10);

  if (!memberships || (memberships as unknown[]).length === 0) {
    redirect("/onboarding/new-club");
  }

  const rows = memberships as Array<{
    organization_id: string;
    role: string;
    organizations: { name: string } | null;
  }>;

  // If only one club, go directly there
  if (rows.length === 1) {
    const firstRow = rows[0];
    if (firstRow) {
      redirect(`/teams?org=${firstRow.organization_id}`);
    }
  }

  // Multiple clubs: redirect to selector
  redirect("/select-club");
}
