import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { ACTIVE_TENANT_COOKIE } from "@/lib/constants";
import type { Tenant } from "@/lib/db/types";

export { ACTIVE_TENANT_COOKIE };

export type TenantMembership = { tenant: Tenant; role: string };

// All tenants the current user belongs to (RLS scopes this to auth.uid()).
export async function getMemberships(): Promise<TenantMembership[]> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? [])
    .map((row) => ({ role: row.role as string, tenant: row.tenant as unknown as Tenant }))
    .filter((m) => Boolean(m.tenant));
}

// The tenant the user is currently acting as: the one named by the
// `active_tenant` cookie if they're still a member, otherwise their first.
export async function getActiveTenant(): Promise<Tenant | null> {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;

  const preferred = cookies().get(ACTIVE_TENANT_COOKIE)?.value;
  const match = preferred && memberships.find((m) => m.tenant.id === preferred);
  return (match ? match.tenant : memberships[0].tenant) ?? null;
}
