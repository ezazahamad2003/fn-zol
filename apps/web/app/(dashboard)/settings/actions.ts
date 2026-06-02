"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { adapters } from "@/lib/adapters";
import { voiceForPreset } from "@/lib/voice-presets";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Update the agent's brain + voice, then push the change live to VAPI.
export async function updateAgent(form: {
  systemPrompt: string;
  firstMessage: string;
  voicePreset: string;
  model: string;
}): Promise<ActionResult> {
  const tenant = await getActiveTenant();
  if (!tenant) return { ok: false, error: "No active business." };

  const voice = voiceForPreset(form.voicePreset);
  const supabase = supabaseServer();

  // RLS: only owners/admins may update the tenant row.
  const { error } = await supabase
    .from("tenants")
    .update({
      system_prompt: form.systemPrompt,
      first_message: form.firstMessage,
      model: form.model,
      voice_config: { preset: form.voicePreset, ...voice },
    })
    .eq("id", tenant.id);
  if (error) return { ok: false, error: error.message };

  // Push to VAPI (no-op in stub mode). Send a full config so model + prompt +
  // tools + voice stay consistent on the assistant.
  if (tenant.vapi_assistant_id) {
    try {
      await adapters.vapi.updateAssistant(tenant.vapi_assistant_id, {
        name: tenant.name,
        model: form.model,
        systemPrompt: form.systemPrompt,
        firstMessage: form.firstMessage,
        voice,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Saved locally, but pushing to VAPI failed: ${message}` };
    }
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function upsertStaff(form: {
  id?: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  googleCalendarId: string;
}): Promise<ActionResult> {
  const tenant = await getActiveTenant();
  if (!tenant) return { ok: false, error: "No active business." };
  if (!form.name.trim() || !form.role.trim()) return { ok: false, error: "Name and role are required." };

  const supabase = supabaseServer();
  const row = {
    tenant_id: tenant.id,
    name: form.name.trim(),
    role: form.role.trim(),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    google_calendar_id: form.googleCalendarId.trim() || null,
  };

  const { error } = form.id
    ? await supabase.from("staff").update(row).eq("id", form.id).eq("tenant_id", tenant.id)
    : await supabase.from("staff").insert(row);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function setStaffActive(id: string, isActive: boolean): Promise<ActionResult> {
  const tenant = await getActiveTenant();
  if (!tenant) return { ok: false, error: "No active business." };

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("staff").update({ is_active: isActive }).eq("id", id).eq("tenant_id", tenant.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}
