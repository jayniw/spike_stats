import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname === "/login";
  const isNoOrgRoute = request.nextUrl.pathname === "/no-organization";
  const isOrgRequiredRoute =
    request.nextUrl.pathname.startsWith("/matches") ||
    request.nextUrl.pathname.startsWith("/match");

  // If not logged in and trying to access protected routes
  if (!user && isOrgRequiredRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If logged in, check organization membership (using service role to bypass RLS)
  if (user && isOrgRequiredRoute) {
    const serviceClient = createMiddlewareClient();
    const { data: membership } = await serviceClient
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      const url = request.nextUrl.clone();
      url.pathname = "/no-organization";
      return NextResponse.redirect(url);
    }
  }

  // Redirect to matches if logged in and visiting login
  if (isAuthRoute && user) {
    const serviceClient = createMiddlewareClient();
    const { data: membership } = await serviceClient
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = membership ? "/matches" : "/no-organization";
    return NextResponse.redirect(url);
  }

  // Allow access to no-organization page without redirect
  if (isNoOrgRoute && user) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
