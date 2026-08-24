import * as React from "react";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";

export default async function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await createServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-12 w-full max-w-5xl items-center px-4">
          <span className="text-base font-semibold tracking-tight">
            SpikeStats
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
