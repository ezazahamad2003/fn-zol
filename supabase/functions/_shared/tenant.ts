import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Resolve a tenant from a VAPI payload. VAPI sends assistant id and/or
// phoneNumberId on every event — both live on the `tenants` row.
export async function resolveTenant(
  supabase: SupabaseClient,
  hints: { assistantId?: string | null; phoneId?: string | null; phoneNumber?: string | null },
): Promise<{ id: string; name: string } | null> {
  const { assistantId, phoneId, phoneNumber } = hints;

  if (assistantId) {
    const { data } = await supabase
      .from("tenants").select("id, name").eq("vapi_assistant_id", assistantId).maybeSingle();
    if (data) return data;
  }
  if (phoneId) {
    const { data } = await supabase
      .from("tenants").select("id, name").eq("vapi_phone_id", phoneId).maybeSingle();
    if (data) return data;
  }
  if (phoneNumber) {
    const { data } = await supabase
      .from("tenants").select("id, name").eq("vapi_phone_number", phoneNumber).maybeSingle();
    if (data) return data;
  }
  return null;
}

// Ensure a call row exists for a given vapi_call_id; create one if not.
export async function upsertCall(
  supabase: SupabaseClient,
  args: { tenantId: string; vapiCallId: string; callerNumber?: string | null },
): Promise<{ id: string; status: string }> {
  const { data: existing } = await supabase
    .from("calls").select("id, status").eq("vapi_call_id", args.vapiCallId).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("calls")
    .insert({
      tenant_id:     args.tenantId,
      vapi_call_id:  args.vapiCallId,
      caller_number: args.callerNumber ?? null,
      status:        "in_progress",
    })
    .select("id, status")
    .single();
  if (error) throw error;
  return data;
}
