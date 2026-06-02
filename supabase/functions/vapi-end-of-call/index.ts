// =============================================================================
// POST /vapi/end-of-call
// VAPI fires this once a call wraps. We persist transcript/summary/recording
// onto the call row, then run a lightweight extraction to spin up follow-up
// tasks. Extraction uses the modelStub in stub mode; swap to real GPT-4o by
// setting USE_STUBS=false and implementing the model real adapter.
// =============================================================================

import { handlePreflight, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { resolveTenant, upsertCall } from "../_shared/tenant.ts";
import { extractTasks } from "../_shared/model.ts";
import { verifyVapiSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  if (!verifyVapiSecret(req)) return json({ error: "unauthorized" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const message = (payload.message ?? payload) as Record<string, unknown>;
  const call         = message.call         as { id?: string; customer?: { number?: string } } | undefined;
  const assistant    = message.assistant    as { id?: string } | undefined;
  const phoneNumber  = message.phoneNumber  as { id?: string; number?: string } | undefined;
  const transcript   = (message.transcript   as string | undefined) ?? null;
  const summary      = (message.summary      as string | undefined) ?? null;
  const recordingUrl = (message.recordingUrl as string | undefined) ?? null;
  const startedAt    = message.startedAt as string | undefined;
  const endedAt      = message.endedAt   as string | undefined;

  const supabase = supabaseAdmin();
  const tenant = await resolveTenant(supabase, {
    assistantId: assistant?.id ?? null,
    phoneId:     phoneNumber?.id ?? null,
    phoneNumber: phoneNumber?.number ?? null,
  });
  if (!tenant) return json({ error: "tenant_not_found" }, 404);
  if (!call?.id) return json({ error: "missing_call_id" }, 400);

  const callRow = await upsertCall(supabase, {
    tenantId:     tenant.id,
    vapiCallId:   call.id,
    callerNumber: call.customer?.number ?? null,
  });

  const update: Record<string, unknown> = {
    status:        "completed",
    transcript,
    summary,
    recording_url: recordingUrl,
    ended_at:      endedAt ?? new Date().toISOString(),
  };
  if (startedAt) update.started_at = startedAt;

  const { error: updErr } = await supabase.from("calls").update(update).eq("id", callRow.id);
  if (updErr) return json({ error: "update_failed", detail: updErr.message }, 500);

  // ----- task extraction (Claude, with a regex fallback) -----
  const tasks = await extractTasks(transcript ?? "", summary);
  if (tasks.length > 0) {
    await supabase.from("tasks").insert(tasks.map((t) => ({
      tenant_id:   tenant.id,
      call_id:     callRow.id,
      title:       t.title,
      description: t.description ?? null,
    })));
  }

  return json({ ok: true, call_id: callRow.id, tasks_created: tasks.length });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
