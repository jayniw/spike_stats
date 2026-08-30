"use server";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";

type CreateClubResult = {
  error?: string;
};

export async function createClubAction(
  _prev: CreateClubResult,
  formData: FormData,
): Promise<CreateClubResult> {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "El nombre del club es obligatorio." };
  }
  if (name.trim().length > 80) {
    return { error: "El nombre del club no puede tener más de 80 caracteres." };
  }

  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has an active membership
  const { data: existingMemberships } = await client
    .from("memberships" as never)
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (existingMemberships && existingMemberships.length > 0) {
    return { error: "Ya perteneces a un club. Un usuario solo puede crear un club nuevo." };
  }

  // Create organization + admin membership atomically via RPC or sequential inserts
  // Step 1: Create the organization
  const { data: org, error: orgError } = await client
    .from("organizations" as never)
    .insert({ name: name.trim() } as never)
    .select("id")
    .single();

  if (orgError) {
    return { error: `No se pudo crear el club: ${orgError.message}` };
  }

  const orgId = (org as { id: string }).id;

  // Step 2: Create admin membership for the creator
  const { error: memError } = await client.from("memberships" as never).insert({
    organization_id: orgId,
    user_id: user.id,
    role: "club_admin",
    status: "active",
  } as never);

  if (memError) {
    return { error: `No se pudo crear la membresía: ${memError.message}` };
  }

  redirect(`/teams`);
}
