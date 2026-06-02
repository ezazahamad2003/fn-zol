import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { adapters, normalizeBookingConfig } from "./adapters.ts";

// Deno twin of apps/web/lib/tools — same shapes, same DB writes.
// Kept side-by-side because Deno can't reach the Next.js workspace.

export type ToolName =
  | "check_availability"
  | "book_appointment"
  | "route_call"
  | "capture_message"
  | "create_task";

type Ctx = { supabase: SupabaseClient; tenantId: string; callId: string };

const tools: Record<ToolName, (c: Ctx, i: Record<string, unknown>) => Promise<unknown>> = {
  // -----------------------------------------------------------------
  async check_availability(ctx, input) {
    const dr = (input.date_range ?? {}) as { start?: string; end?: string };
    if (!dr.start || !dr.end) throw new Error("check_availability: invalid date_range");
    const rangeStart = new Date(dr.start);
    const rangeEnd   = new Date(dr.end);

    const { data: tenantRow } = await ctx.supabase
      .from("tenants").select("booking_config").eq("id", ctx.tenantId).maybeSingle();
    const cfg = normalizeBookingConfig(tenantRow?.booking_config);

    let q = ctx.supabase
      .from("staff")
      .select("id, name, google_calendar_id, role")
      .eq("tenant_id", ctx.tenantId)
      .eq("is_active", true)
      .eq("is_bookable", true)
      .not("google_calendar_id", "is", null);
    if (input.staff_role) q = q.eq("role", input.staff_role as string);
    if (input.staff_id)   q = q.eq("id", input.staff_id as string);

    const { data: staff, error } = await q;
    if (error) throw error;
    if (!staff || staff.length === 0) return { slots: [] };

    const slots = await adapters.calendar.findOpenSlots({
      tenantId: ctx.tenantId,
      staffCalendarIds: staff.map((s: { id: string; google_calendar_id: string }) =>
        ({ staff_id: s.id, calendar_id: s.google_calendar_id })),
      rangeStart, rangeEnd,
      slotMinutes: cfg.slotMinutes,
      businessHours: cfg,
    });
    const nameById = new Map(staff.map((s: { id: string; name: string }) => [s.id, s.name]));
    return {
      slots: slots.map((s) => ({
        start: s.start, end: s.end, staff_id: s.staff_id,
        staff_name: nameById.get(s.staff_id) ?? "Unknown",
      })),
    };
  },

  // -----------------------------------------------------------------
  async book_appointment(ctx, input) {
    let q = ctx.supabase
      .from("staff")
      .select("id, name, google_calendar_id")
      .eq("tenant_id", ctx.tenantId)
      .eq("is_active", true)
      .eq("is_bookable", true)
      .not("google_calendar_id", "is", null)
      .limit(1);
    if (input.staff_id)        q = q.eq("id", input.staff_id as string);
    else if (input.staff_role) q = q.eq("role", input.staff_role as string);

    const { data: rows, error: e1 } = await q;
    if (e1) throw e1;
    const staff = rows?.[0];
    if (!staff) throw new Error("book_appointment: no eligible staff member");

    const start = new Date(input.start_at as string);
    const end   = input.end_at
      ? new Date(input.end_at as string)
      : new Date(start.getTime() + 15 * 60_000);

    const event = await adapters.calendar.createEvent({
      tenantId:   ctx.tenantId,
      calendarId: staff.google_calendar_id as string,
      title:      `ZOL: ${(input.purpose as string) ?? "Appointment"} (${input.customer_name as string})`,
      description: [
        `Customer: ${input.customer_name}`,
        input.customer_phone ? `Phone: ${input.customer_phone}` : null,
        input.purpose ? `Purpose: ${input.purpose}` : null,
      ].filter(Boolean).join("\n"),
      start, end,
    });

    const { data: appt, error: e2 } = await ctx.supabase
      .from("appointments")
      .insert({
        tenant_id:       ctx.tenantId,
        call_id:         ctx.callId,
        staff_id:        staff.id,
        google_event_id: event.google_event_id,
        customer_name:   input.customer_name,
        customer_phone:  input.customer_phone ?? null,
        start_at:        event.start_at,
        end_at:          event.end_at,
        purpose:         input.purpose ?? null,
      })
      .select("id")
      .single();
    if (e2) throw e2;

    return {
      appointment_id:  appt.id,
      google_event_id: event.google_event_id,
      start_at:        event.start_at,
      end_at:          event.end_at,
    };
  },

  // -----------------------------------------------------------------
  async route_call(ctx, input) {
    if (!input.staff_role && !input.staff_name) {
      throw new Error("route_call: provide staff_role or staff_name");
    }
    let q = ctx.supabase
      .from("staff")
      .select("id, name, phone")
      .eq("tenant_id", ctx.tenantId)
      .eq("is_active", true)
      .not("phone", "is", null)
      .limit(1);
    if (input.staff_name) q = q.ilike("name", `%${input.staff_name}%`);
    else if (input.staff_role) q = q.eq("role", input.staff_role as string);

    const { data, error } = await q;
    if (error) throw error;
    const staff = data?.[0];
    if (!staff) throw new Error(`route_call: no staff match for ${JSON.stringify(input)}`);

    return { staff_id: staff.id, staff_name: staff.name, transfer_number: staff.phone };
  },

  // -----------------------------------------------------------------
  async capture_message(ctx, input) {
    if (!input.body) throw new Error("capture_message: body is required");
    const urgency = (input.urgency as string) ?? "normal";
    const routeRole = (input.staff_role as string) ??
      (urgency === "urgent" || urgency === "high" ? "owner" : "sales");

    const { data: routed } = await ctx.supabase
      .from("staff").select("id")
      .eq("tenant_id", ctx.tenantId).eq("is_active", true).eq("role", routeRole)
      .limit(1);
    const routedToId = routed?.[0]?.id ?? null;

    const { data, error } = await ctx.supabase
      .from("messages")
      .insert({
        tenant_id:      ctx.tenantId,
        call_id:        ctx.callId,
        customer_name:  input.customer_name ?? null,
        customer_phone: input.customer_phone ?? null,
        body:           input.body,
        urgency,
        routed_to:      routedToId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { message_id: data.id, routed_to_staff_id: routedToId };
  },

  // -----------------------------------------------------------------
  async create_task(ctx, input) {
    if (!input.title) throw new Error("create_task: title is required");
    const { data, error } = await ctx.supabase
      .from("tasks")
      .insert({
        tenant_id:   ctx.tenantId,
        call_id:     ctx.callId,
        title:       input.title,
        description: input.description ?? null,
        assigned_to: input.assigned_to ?? null,
        due_at:      input.due_at ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { task_id: data.id };
  },
};

export async function runTool(args: {
  supabase: SupabaseClient;
  tenantId: string;
  callId: string;
  name: string;
  input: Record<string, unknown>;
}): Promise<{ status: "ok" | "error"; output: unknown; error?: string; duration_ms: number }> {
  const handler = tools[args.name as ToolName];
  const started = Date.now();
  if (!handler) {
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId,
      tool_name: args.name, input: args.input, output: null,
      duration_ms: 0, status: "error", error: `Unknown tool: ${args.name}`,
    });
    return { status: "error", output: null, error: `Unknown tool: ${args.name}`, duration_ms: 0 };
  }
  try {
    const output = await handler({ supabase: args.supabase, tenantId: args.tenantId, callId: args.callId }, args.input);
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
