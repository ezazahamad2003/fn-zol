import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getMemberships } from "@/lib/tenant-context";
import { exchangeCode, storeCredential } from "@/lib/google/oauth";

// GET /api/google/callback — Google redirects here with ?code & ?state.
// We validate that the signed-in user is a member of the tenant in `state`,
// exchange the code, and store the refresh token. Then back to /settings.
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const settings = (msg: string) => NextResponse.redirect(new URL(`/settings?google=${msg}`, base));

  const code = req.nextUrl.searchParams.get("code");
  const tenantId = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  if (oauthError) return settings(`error`);
  if (!code || !tenantId) return settings("error");

  // Authorization check: caller must belong to the tenant named in state.
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", base));
  const memberships = await getMemberships();
  if (!memberships.some((m) => m.tenant.id === tenantId)) return settings("forbidden");

  try {
    const token = await exchangeCode(code);
    await storeCredential(tenantId, user.id, token);
  } catch {
    return settings("error");
  }
  return settings("connected");
}
