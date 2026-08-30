import {
  createBrowserClient as ssrCreateBrowserClient,
} from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

// Cliente Supabase para uso en Client Components (browser).
// Importado desde aquí para no arrastrar "next/headers" (server-only)
// que rompería el bundle del cliente.

let browserClient: SupabaseClient<Database> | undefined;

export function createBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    if (!url || !anonKey) {
      throw new Error("Faltan variables de entorno de Supabase");
    }
    browserClient = ssrCreateBrowserClient<Database>(url, anonKey);
  }
  return browserClient;
}
