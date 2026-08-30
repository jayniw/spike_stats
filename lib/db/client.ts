import {
  createServerClient as ssrCreateServerClient,
} from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import type { Database } from "./types";

// Clientes Supabase para uso en Server Components, Route Handlers y Middleware.
// El cliente browser vive en client-browser.ts para no arrastrar "next/headers".

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !anonKey) {
    throw new Error("Faltan variables de entorno de Supabase");
  }
  return { url, anonKey };
}

export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return ssrCreateServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: se ignora. La sesión se
          // refresca en Server Actions / Route Handlers.
        }
      },
    },
  });
}

export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseEnv();
  return ssrCreateServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
}
