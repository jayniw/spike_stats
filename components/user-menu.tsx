"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setSelectedOrg } from "@/app/select-club/actions";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/db/client-browser";

type ClubOption = {
  organizationId: string;
  clubName: string;
  role: string;
  roleLabel: string;
  isCurrent: boolean;
};

export function UserMenu({
  clubs,
  userEmail,
}: {
  clubs: ClubOption[];
  userEmail: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitchClub(organizationId: string) {
    await setSelectedOrg(organizationId);
    setOpen(false);
    router.push(`/teams?org=${organizationId}`);
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const currentClub = clubs.find((c) => c.isCurrent);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        <span className="hidden sm:inline">{currentClub?.clubName}</span>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {currentClub?.roleLabel}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border bg-card shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="text-sm font-medium">{userEmail}</p>
          </div>

          {clubs.length > 1 ? (
            <div className="border-b px-2 py-2">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                Cambiar club
              </p>
              {clubs.map((club) => (
                <button
                  key={club.organizationId}
                  onClick={() => handleSwitchClub(club.organizationId)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    club.isCurrent
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="truncate">{club.clubName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {club.roleLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="px-2 py-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
