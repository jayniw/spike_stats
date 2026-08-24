"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/db/client";

type ModoAcceso = "password" | "magic";

const modos: { value: ModoAcceso; label: string }[] = [
  { value: "password", label: "Contraseña" },
  { value: "magic", label: "Enlace mágico" },
];

export default function EntrarPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [modo, setModo] = React.useState<ModoAcceso>("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [cargando, setCargando] = React.useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCargando(true);
    setEnlaceEnviado(false);

    const supabase = createBrowserClient();

    if (modo === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setCargando(false);
      if (error) {
        toast({
          title: "Credenciales inválidas",
          description: "Verifica tu correo y contraseña.",
          variant: "destructive",
        });
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/entrar` },
    });
    setCargando(false);
    if (error) {
      toast({
        title: "No pudimos enviar el enlace",
        description: "Inténtalo de nuevo en unos momentos.",
        variant: "destructive",
      });
      return;
    }
    setPassword("");
    setEnlaceEnviado(true);
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Entrar</CardTitle>
          <CardDescription>
            Accede con tu cuenta para registrar partidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            role="tablist"
            aria-label="Método de acceso"
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          >
            {modos.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={modo === item.value}
                onClick={() => {
                  setModo(item.value);
                  setEnlaceEnviado(false);
                }}
                className={cn(
                  "min-h-12 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  modo === item.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12"
              />
            </div>

            {modo === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12"
                />
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={cargando || email.trim() === ""}
              className="w-full min-h-12"
            >
              {cargando
                ? "Procesando…"
                : modo === "password"
                  ? "Entrar"
                  : "Enviar enlace"}
            </Button>
          </form>

          {enlaceEnviado ? (
            <p
              role="status"
              className="rounded-md border border-success/60 bg-success/10 px-4 py-3 text-sm text-success"
            >
              Revisa tu correo para continuar
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
