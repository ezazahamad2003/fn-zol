import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Per-request server client tied to the user's auth cookies. Use this in
// server components / route handlers where RLS should apply.
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // server components can't write cookies; middleware handles refresh
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // ignored
        }
      },
    },
  });
}

// Service-role client. Bypasses RLS. Use ONLY in server-side trusted code
// (route handlers, edge functions, scripts). Never expose to the browser.
export function supabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
