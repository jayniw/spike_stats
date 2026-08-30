"use client";

import * as React from "react";

import type { Role } from "@/lib/validation/core";

type ClubContext = {
  organizationId: string;
  membershipId: string;
  role: Role;
};

const ClubContext = React.createContext<ClubContext | null>(null);

export function useClub(): ClubContext {
  const ctx = React.useContext(ClubContext);
  if (!ctx) {
    throw new Error("useClub debe usarse dentro de ClubProvider");
  }
  return ctx;
}

export function ClubProvider({
  value,
  children,
}: {
  value: ClubContext;
  children: React.ReactNode;
}) {
  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}
