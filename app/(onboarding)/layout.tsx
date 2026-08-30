import * as React from "react";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await createServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
