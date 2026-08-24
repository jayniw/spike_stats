"use server";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";

export async function signOutAction(): Promise<void> {
  const client = await createServerClient();
  await client.auth.signOut();
  redirect("/entrar");
}
