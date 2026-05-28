import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Service-role client for edge functions. Bypasses RLS — only use server-side.
export function supabaseAdmin(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Edge function missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
