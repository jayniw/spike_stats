"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClub } from "@/components/club-provider";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/teams", label: "Equipos" },
  { href: "/matches", label: "Partidos" },
  { href: "/dashboards", label: "Tableros" },
  {
    href: "/settings/members",
    label: "Miembros",
    roles: ["club_admin"],
  },
  {
    href: "/settings/invitations",
    label: "Invitaciones",
    roles: ["club_admin", "coach"],
  },
];

export function ClubNav() {
  const { role, organizationId } = useClub();
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav className="flex gap-1 overflow-x-auto py-2">
      {visibleItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const href = `${item.href}?org=${organizationId}`;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
