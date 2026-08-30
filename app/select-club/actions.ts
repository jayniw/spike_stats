"use server";

import { cookies } from "next/headers";

export async function setSelectedOrg(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("selected_org", orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });
}

export async function clearSelectedOrg(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("selected_org");
}
