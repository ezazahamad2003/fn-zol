import type { SupabaseClient } from "@supabase/supabase-js";
import { adapters } from "@/lib/adapters";
import type { ToolContext, ToolName } from "@/lib/tools/types";

import { checkAvailability } from "@/lib/tools/check_availability";
import { bookAppointment }   from "@/lib/tools/book_appointment";
import { routeCall }         from "@/lib/tools/route_call";
import { captureMessage }    from "@/lib/tools/capture_message";
import { createTask }        from "@/lib/tools/create_task";

export const tools = {
  check_availability: checkAvailability,
  book_appointment:   bookAppointment,
  route_call:         routeCall,
  capture_message:    captureMessage,
  create_task:        createTask,
} as const;

export type ToolMap = typeof tools;

// Dispatches a tool by name, wraps it in tool_calls logging, returns result.
// This is the single entry point used by both the dev endpoint and any
// server-side caller. Edge Functions have their own (Deno) twin of this.
export async function runTool(args: {
  supabase: SupabaseClient;
  tenantId: string;
  callId: string;
  name: ToolName;
  input: Record<string, unknown>;
}): Promise<{ status: "ok" | "error"; output: unknown; error?: string; duration_ms: number }> {
  const ctx: ToolContext = {
    supabase: args.supabase,
    adapters,
    tenantId: args.tenantId,
    callId:   args.callId,
  };

  const handler = tools[args.name] as ((c: ToolContext, i: unknown) => Promise<unknown>) | undefined;
  if (!handler) {
    const duration_ms = 0;
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId,
      tool_name: args.name, input: args.input, output: null,
      duration_ms, status: "error", error: `Unknown tool: ${args.name}`,
    });
    return { status: "error", output: null, error: `Unknown tool: ${args.name}`, duration_ms };
  }

  const started = Date.now();
  try {
    const output = await handler(ctx, args.input);
    const duration_ms = Date.now() - started;
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId,
      tool_name: args.name, input: args.input, output: output as Record<string, unknown>,
      duration_ms, status: "ok",
    });
    return { status: "ok", output, duration_ms };
  } catch (err) {
    const duration_ms = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId,
      tool_name: args.name, input: args.input, output: null,
      duration_ms, status: "error", error: message,
    });
    return { status: "error", output: null, error: message, duration_ms };
  }
}

export type { ToolName, ToolContext } from "@/lib/tools/types";
