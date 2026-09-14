"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/matches" className="font-bold text-lg">
          🏐 Spike Stats
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/matches"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/matches" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Partidos
          </Link>
          <Link
            href="/matches/new"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/matches/new" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Nuevo
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </nav>
      </div>
    </header>
  );
}
