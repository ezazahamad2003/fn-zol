"use server";

import { cookies } from "next/headers";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { adapters } from "@/lib/adapters";
import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant-context";
import { voiceForPreset, DEFAULT_VOICE_PRESET_ID, DEFAULT_MODEL } from "@/lib/voice-presets";
import { composeSystemPrompt } from "@/lib/agent-prompt";
import type { Tenant } from "@/lib/db/types";

export type OnboardResult =
  | { ok: true; tenantId: string; phoneNumber: string | null }
  | { ok: false; error: string };

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "business";
}

// Short random suffix so slugs don't collide. Crypto-based (no Math.random).
function randomSuffix(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createBusiness(form: {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  voicePreset: string;
  model: string;
}): Promise<OnboardResult> {
  const name = form.name.trim();
  if (!name) return { ok: false, error: "Business name is required." };

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const presetId = form.voicePreset || DEFAULT_VOICE_PRESET_ID;
  const voice = voiceForPreset(presetId);
  const model = form.model || DEFAULT_MODEL;
  const slug = `${slugify(name)}-${randomSuffix()}`;

  // 1. Create tenant + owner membership atomically (SECURITY DEFINER RPC).
  const { data: created, error: rpcErr } = await supabase.rpc("create_tenant_for_current_user", {
    p_name: name,
    p_slug: slug,
    p_model: model,
    p_system_prompt: form.systemPrompt,
    p_first_message: form.firstMessage,
    p_voice_config: { preset: presetId, ...voice },
  });
  if (rpcErr) return { ok: false, error: `Could not create business: ${rpcErr.message}` };
  const tenant = created as unknown as Tenant;

  // 2. Provision the voice agent + phone number (stub or real per USE_STUBS).
  let provisioned;
  try {
    provisioned = await adapters.vapi.provisionTenant({
      name,
      model,
      // Compose base personality + default booking hours (no routing rules yet).
      systemPrompt: composeSystemPrompt({
        systemPrompt: form.systemPrompt,
        bookingConfig: {},
        routingRules: [],
      }),
      firstMessage: form.firstMessage,
      voice,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Tenant exists but provisioning failed — surface it; the user can retry
    // provisioning from settings. Don't leave them stranded with no business.
    return { ok: false, error: `Business created, but provisioning the phone number failed: ${message}` };
  }

  // 3. Persist VAPI ids onto the tenant row (service role; trusted server code).
  const admin = supabaseAdmin();
  const { error: updErr } = await admin
    .from("tenants")
    .update({
      vapi_assistant_id: provisioned.vapi_assistant_id,
      vapi_phone_number: provisioned.vapi_phone_number,
      vapi_phone_id: provisioned.vapi_phone_id,
    })
    .eq("id", tenant.id);
  if (updErr) return { ok: false, error: `Provisioned, but saving the number failed: ${updErr.message}` };

  // 4. Make this the active business for the dashboard.
  cookies().set(ACTIVE_TENANT_COOKIE, tenant.id, {
    path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
  });

  return { ok: true, tenantId: tenant.id, phoneNumber: provisioned.vapi_phone_number };
}
