"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { adapters } from "@/lib/adapters";
import { voiceForPreset } from "@/lib/voice-presets";
import { composeSystemPrompt, normalizeRoutingRules, type RoutingRule } from "@/lib/agent-prompt";
import { normalizeBookingConfig, type BookingConfig } from "@/lib/booking";
import type { Tenant } from "@/lib/db/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Push the full assistant config to VAPI with a freshly-composed prompt
// (base personality + routing rules + booking hours). No-op in stub mode.
async function pushToVapi(tenant: Tenant, overrides: Partial<{
  systemPromptBase: string; bookingConfig: unknown; routingRules: unknown; model: string; firstMessage: string;
}>): Promise<string | null> {
  if (!tenant.vapi_assistant_id) return null;
  const voice = voiceForPreset((tenant.voice_config?.preset as string | undefined) ?? null);
  try {
    await adapters.vapi.updateAssistant(tenant.vapi_assistant_id, {
      name: tenant.name,
      model: overrides.model ?? tenant.model,
      firstMessage: overrides.firstMessage ?? tenant.first_message ?? undefined,
      voice,
      systemPrompt: composeSystemPrompt({
        systemPrompt: overrides.systemPromptBase ?? tenant.system_prompt,
        bookingConfig: overrides.bookingConfig ?? tenant.booking_config,
        routingRules: overrides.routingRules ?? tenant.routing_rules,
      }),
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

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

  const pushErr = await pushToVapi(tenant, {
    systemPromptBase: form.systemPrompt, model: form.model, firstMessage: form.firstMessage,
  });
  if (pushErr) return { ok: false, error: `Saved locally, but pushing to VAPI failed: ${pushErr}` };

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateBookingConfig(config: BookingConfig): Promise<ActionResult> {
  const tenant = await getActiveTenant();
  if (!tenant) return { ok: false, error: "No active business." };

  const clean = normalizeBookingConfig(config);
  const supabase = supabaseServer();
  const { error } = await supabase.from("tenants").update({ booking_config: clean }).eq("id", tenant.id);
  if (error) return { ok: false, error: error.message };

  // Hours appear in the prompt too, so re-push so the agent quotes them right.
  const pushErr = await pushToVapi(tenant, { bookingConfig: clean });
  if (pushErr) return { ok: false, error: `Saved, but pushing to VAPI failed: ${pushErr}` };

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateRoutingRules(rules: RoutingRule[]): Promise<ActionResult> {
  const tenant = await getActiveTenant();
  if (!tenant) return { ok: false, error: "No active business." };

  const clean = normalizeRoutingRules(rules);
  const supabase = supabaseServer();
  const { error } = await supabase.from("tenants").update({ routing_rules: clean }).eq("id", tenant.id);
  if (error) return { ok: false, error: error.message };

  const pushErr = await pushToVapi(tenant, { routingRules: clean });
  if (pushErr) return { ok: false, error: `Saved, but pushing to VAPI failed: ${pushErr}` };

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
  isBookable: boolean;
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
    is_bookable: form.isBookable,
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
