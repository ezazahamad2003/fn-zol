// =============================================================================
// POST /vapi/tool
// VAPI calls this mid-call when the assistant invokes one of its tools.
// We MUST resolve fast (<1–2s) — caller is on the line.
//
// VAPI's tool-call webhook payload shape (simplified):
//   {
//     message: {
//       type: "tool-calls",
//       toolCalls: [
//         { id, function: { name, arguments: {...} } }
//       ],
//       call:      { id, customer: { number }, ... },
//       assistant: { id, ... },
//       phoneNumber: { id, number }
//     }
//   }
// Response shape expected by VAPI:
//   { results: [{ toolCallId, result | error }] }
// =============================================================================

import { handlePreflight, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { resolveTenant, upsertCall } from "../_shared/tenant.ts";
import { runTool } from "../_shared/tools.ts";
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
  const assistant   = message.assistant   as { id?: string } | undefined;
  const call        = message.call        as { id?: string; customer?: { number?: string } } | undefined;
  const phoneNumber = message.phoneNumber as { id?: string; number?: string } | undefined;
  const toolCalls   = (message.toolCalls ?? []) as Array<{
    id: string; function: { name: string; arguments: Record<string, unknown> | string };
  }>;

  const supabase = supabaseAdmin();
  const tenant = await resolveTenant(supabase, {
    assistantId: assistant?.id ?? null,
    phoneId:     phoneNumber?.id ?? null,
    phoneNumber: phoneNumber?.number ?? null,
  });
  if (!tenant) {
    return json({
      error: "tenant_not_found",
      hint:  "No tenants row matches the inbound assistant/phone. Did provisioning run?",
    }, 404);
  }

  if (!call?.id) return json({ error: "missing_call_id" }, 400);
  const callRow = await upsertCall(supabase, {
    tenantId:     tenant.id,
    vapiCallId:   call.id,
    callerNumber: call.customer?.number ?? null,
  });

  const results = await Promise.all(toolCalls.map(async (tc) => {
    const args = typeof tc.function.arguments === "string"
      ? safeParse(tc.function.arguments)
      : tc.function.arguments ?? {};
    const result = await runTool({
      supabase,
      tenantId: tenant.id,
      callId:   callRow.id,
      name:     tc.function.name,
      input:    args,
      vapiToolCallId: tc.id,
    });
    return result.status === "ok"
      ? { toolCallId: tc.id, result: result.output }
      : { toolCallId: tc.id, error:  result.error  };
  }));

  return json({ results });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function safeParse(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}
