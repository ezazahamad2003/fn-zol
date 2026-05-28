import { supabaseAdmin } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/db/types";

// For the stub-mode dashboard we don't have real auth wired yet, so we default
// to the first tenant in the DB (FNS in the seed). Once Supabase Auth is in
// front of every page this should become: "active tenant for the current user".
export async function getActiveTenant(): Promise<Tenant | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("tenants").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return (data as Tenant) ?? null;
}
