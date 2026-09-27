"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mapa de errores de Supabase a mensajes amigables en español
const ERROR_MAP: Record<string, string> = {
  "Failed to fetch": "El servicio de autenticación no está disponible. Por favor, intente más tarde o contacte al administrador.",
  "Invalid login credentials": "Email o contraseña incorrectos. Verifique sus credenciales.",
  "Email not confirmed": "Su cuenta no ha sido confirmada. Revise su email para el enlace de confirmación.",
  "Too many requests": "Demasiados intentos fallidos. Espere unos minutos antes de volver a intentar.",
  "User not found": "No existe una cuenta con este email.",
  "Invalid email": "El formato del email no es válido.",
};

function getFriendlyError(error: Error): string {
  // Log técnico para debugging
  console.error("[Auth Error]", error.message, error);
  
  // Buscar mensaje mapeado
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (error.message.includes(key)) {
      return friendly;
    }
  }
  
  // Fallback genérico
  return "Error de conexión. Verifique su internet e intente nuevamente.";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/matches";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(getFriendlyError(authError));
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}
