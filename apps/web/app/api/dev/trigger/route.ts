import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runTool, type ToolName } from "@/lib/tools";

// =============================================================================
// POST /api/dev/trigger
// Local-only convenience endpoint to fire any of the 5 tools without VAPI.
// Mirrors the path the edge function would take, including tool_calls logging.
//
// Body:
//   { tenantId, tool, args, callId?, vapiCallId?, callerNumber? }
//
// If callId is omitted, we look up the call by vapiCallId; if that's also
// missing we create a fresh "in_progress" call so the tool has somewhere to
// hang its tool_calls / appointments / tasks / messages rows.
// =============================================================================

const VALID_TOOLS: ToolName[] = [
  "check_availability",
  "book_appointment",
  "route_call",
  "capture_message",
  "create_task",
];

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled_in_production" }, { status: 403 });
  }

  let body: {
    tenantId?: string;
    tool?: string;
    args?: Record<string, unknown>;
    callId?: string;
    vapiCallId?: string;
    callerNumber?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.tenantId)                                          return NextResponse.json({ error: "tenantId required" },         { status: 400 });
  if (!body.tool || !VALID_TOOLS.includes(body.tool as ToolName)) return NextResponse.json({ error: `tool must be one of ${VALID_TOOLS.join(", ")}` }, { status: 400 });

  const supabase = supabaseAdmin();

  // Resolve / create a call row to attach this tool invocation to.
  let callId = body.callId;
  if (!callId) {
    if (body.vapiCallId) {
      const { data } = await supabase
        .from("calls").select("id").eq("vapi_call_id", body.vapiCallId).maybeSingle();
      if (data) callId = data.id;
    }
  }
  if (!callId) {
    const vapiCallId = body.vapiCallId ?? `dev-trigger-${Date.now()}`;
    const { data, error } = await supabase
      .from("calls")
      .insert({
        tenant_id:     body.tenantId,
        vapi_call_id:  vapiCallId,
        caller_number: body.callerNumber ?? "+15555550000",
        status:        "in_progress",
        summary:       "(dev) created by /api/dev/trigger",
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    callId = data.id;
  }

  const result = await runTool({
    supabase,
    tenantId: body.tenantId,
    callId,
    name: body.tool as ToolName,
    input: body.args ?? {},
  });

  return NextResponse.json({ callId, ...result }, { status: result.status === "ok" ? 200 : 500 });
}
