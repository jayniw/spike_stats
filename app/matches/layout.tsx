import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function MatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/matches" className="font-bold text-lg">
            Spike Stats
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/matches"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Partidos
            </Link>
            <Link
              href="/matches/new"
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md"
            >
              Nuevo
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
