"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setSelectedOrg } from "./actions";

type Club = {
  organizationId: string;
  clubName: string;
  role: string;
  roleLabel: string;
};

export function ClubSelector({ clubs }: { clubs: Club[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSelect(organizationId: string) {
    setSelected(organizationId);
    setLoading(true);
    await setSelectedOrg(organizationId);
    router.push(`/teams?org=${organizationId}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {clubs.map((club) => (
        <button
          key={club.organizationId}
          onClick={() => handleSelect(club.organizationId)}
          disabled={loading}
          className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted disabled:opacity-50 ${
            selected === club.organizationId ? "border-primary bg-primary/5" : ""
          }`}
        >
          <div>
            <p className="font-medium">{club.clubName}</p>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {club.roleLabel}
            </span>
          </div>
          {loading && selected === club.organizationId ? (
            <svg className="h-5 w-5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
