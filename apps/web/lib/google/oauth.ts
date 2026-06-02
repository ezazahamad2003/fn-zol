import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchWithRetry } from "@/lib/http";

// Per-tenant Google OAuth. The business owner connects their Google account;
// we store the refresh token (service-role only) and mint access tokens on
// demand for Calendar freeBusy + event creation.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "openid",
  "email",
].join(" ");

export function googleConfigured(): boolean {
  const g = env.google();
  return Boolean(g.clientId && g.clientSecret && g.redirectUri);
}

// Consent screen URL. `state` carries the tenant id (and is validated on the
// way back). access_type=offline + prompt=consent guarantees a refresh token.
export function buildConsentUrl(state: string): string {
  const g = env.google();
  const params = new URLSearchParams({
    client_id: g.clientId,
    redirect_uri: g.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
};

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const g = env.google();
  const res = await fetchWithRetry(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: g.clientId,
      client_secret: g.clientSecret,
      redirect_uri: g.redirectUri,
      grant_type: "authorization_code",
    }),
  }, { timeoutMs: 15_000, retries: 1 });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json();
}

// Decode the email claim out of an id_token without verifying (we just got it
// from Google over TLS in the same request).
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json.email ?? null;
  } catch {
    return null;
  }
}

// Persist a freshly-exchanged credential for a tenant.
export async function storeCredential(tenantId: string, userId: string | null, token: TokenResponse): Promise<void> {
  if (!token.refresh_token) {
    throw new Error("Google did not return a refresh token. Re-connect with consent.");
  }
  const admin = supabaseAdmin();
  const { error } = await admin.from("google_credentials").upsert({
    tenant_id: tenantId,
    google_email: emailFromIdToken(token.id_token),
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_expiry: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    scope: token.scope ?? GOOGLE_SCOPES,
    connected_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getConnection(tenantId: string): Promise<{ google_email: string | null } | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("google_credentials").select("google_email").eq("tenant_id", tenantId).maybeSingle();
  return data ?? null;
}

// Return a valid access token for a tenant, refreshing if it's expired/near.
export async function getValidAccessToken(tenantId: string): Promise<string> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("google_credentials")
    .select("access_token, refresh_token, token_expiry")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Google Calendar is not connected for this business.");

  const expiry = data.token_expiry ? new Date(data.token_expiry).getTime() : 0;
  if (data.access_token && expiry - Date.now() > 60_000) return data.access_token;

  // Refresh.
  const g = env.google();
  const res = await fetchWithRetry(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: g.clientId,
      client_secret: g.clientSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  }, { timeoutMs: 15_000, retries: 1 });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  const refreshed: TokenResponse = await res.json();

  await admin.from("google_credentials").update({
    access_token: refreshed.access_token,
    token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("tenant_id", tenantId);

  return refreshed.access_token;
}
