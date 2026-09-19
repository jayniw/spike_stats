"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart2, LogOut, Trophy } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading || !user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/matches" className="font-bold text-lg">
          🏐 Spike Stats
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/matches"
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-accent flex items-center gap-1.5 ${
              pathname === "/matches" ? "text-primary bg-accent" : "text-muted-foreground"
            }`}
          >
            <Trophy className="size-4" />
            Partidos
          </Link>
          <Link
            href="/stats"
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-accent flex items-center gap-1.5 ${
              pathname === "/stats" ? "text-primary bg-accent" : "text-muted-foreground"
            }`}
          >
            <BarChart2 className="size-4" />
            Stats
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="ml-2 text-muted-foreground hover:text-destructive"
            title="Salir"
          >
            <LogOut className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
