import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Routes that require an authenticated session. The dashboard route-group
// segments don't appear in the URL, so we list their real paths plus onboarding.
const PROTECTED = ["/dashboard", "/calls", "/tasks", "/messages", "/settings", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  // Response we can write refreshed auth cookies onto.
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
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
    },
  );

  // Refreshes the session and keeps cookies fresh on every request.
  const { data: { user } } = await supabase.auth.getUser();

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
