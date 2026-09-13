import { createClient } from "@supabase/supabase-js";

// Cliente con service role para queries en middleware (bypass RLS)
// Solo usar en server-side (middleware, server components, API routes)
export function createMiddlewareClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
