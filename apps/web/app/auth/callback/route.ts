import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

// GET /auth/callback?code=...&next=...
// Magic links and email confirmations land here with a PKCE code. We exchange
// it for a session (sets the auth cookies), then continue to `next`.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeRedirectPath(req.nextUrl.searchParams.get("next"));
  const base = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  if (code) {
    const supabase = supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, base));
}
