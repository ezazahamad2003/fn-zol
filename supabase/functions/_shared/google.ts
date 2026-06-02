import { supabaseAdmin } from "./supabase.ts";

// Deno twin of apps/web/lib/google/oauth.ts (token side only). Reads the
// per-tenant refresh token and mints a valid access token, refreshing when
// expired.

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function getValidAccessToken(tenantId: string): Promise<string> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("google_credentials")
    .select("access_token, refresh_token, token_expiry")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Google Calendar is not connected for this business.");

  const expiry = data.token_expiry ? new Date(data.token_expiry).getTime() : 0;
  if (data.access_token && expiry - Date.now() > 60_000) return data.access_token as string;

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token as string,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  const refreshed = await res.json();

  await supabase.from("google_credentials").update({
    access_token: refreshed.access_token,
    token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("tenant_id", tenantId);

  return refreshed.access_token as string;
}
