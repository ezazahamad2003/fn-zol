import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Routes that require an authenticated session. The dashboard route-group
// segments don't appear in the URL, so we list their real paths plus onboarding.
const PROTECTED = ["/dashboard", "/calls", "/tasks", "/messages", "/settings", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/" && req.nextUrl.searchParams.has("code")) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.searchParams.set("next", safeRedirectPath(url.searchParams.get("next"), "/onboarding"));
    return NextResponse.redirect(url);
  }

  // Response we can write refreshed auth cookies onto.
  let res = NextResponse.next({ request: { headers: req.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // If Supabase isn't configured yet (e.g. env not set on a fresh deploy), don't
  // crash the whole site — just serve pages without auth gating.
  if (!url || !anonKey) return res;

  let user = null;
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    });
    // Refreshes the session and keeps cookies fresh on every request.
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    // Bad config / transient auth error — fail open rather than 500.
    return res;
  }

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Run on everything except static assets and the Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
