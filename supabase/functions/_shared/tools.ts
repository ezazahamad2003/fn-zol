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
const PRIMARY_CALENDAR_STAFF_ID = "primary";
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function timezoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    hour,
    Number(get("minute")),
    Number(get("second")),
  );
  return asUtc - date.getTime();
}

function zonedDateToUtc(date: string, time: "00:00:00" | "23:59:59", timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = time.split(":").map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  guess = new Date(guess.getTime() - timezoneOffsetMs(guess, timeZone));
  return new Date(guess.getTime() - timezoneOffsetMs(guess, timeZone));
}

function parseAvailabilityRange(raw: { start?: string; end?: string }, cfg: { timezone: string }) {
  if (!raw.start || !raw.end) throw new Error("check_availability: invalid date_range");
  const rangeStart = DATE_ONLY_RE.test(raw.start) ? zonedDateToUtc(raw.start, "00:00:00", cfg.timezone) : new Date(raw.start);
  let rangeEnd = DATE_ONLY_RE.test(raw.end) ? zonedDateToUtc(raw.end, "23:59:59", cfg.timezone) : new Date(raw.end);
  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    throw new Error("check_availability: invalid date_range; use ISO dates or datetimes");
  }
  if (rangeEnd <= rangeStart) rangeEnd = new Date(rangeStart.getTime() + 24 * 60 * 60_000);
  return { rangeStart, rangeEnd };
}

const tools: Record<ToolName, (c: Ctx, i: Record<string, unknown>) => Promise<unknown>> = {
  // -----------------------------------------------------------------
  async check_availability(ctx, input) {
    const dr = (input.date_range ?? {}) as { start?: string; end?: string };
    const { data: tenantRow } = await ctx.supabase
      .from("tenants").select("booking_config").eq("id", ctx.tenantId).maybeSingle();
    const cfg = normalizeBookingConfig(tenantRow?.booking_config);
    const { rangeStart, rangeEnd } = parseAvailabilityRange(dr, cfg);

    let q = ctx.supabase
      .from("staff")
      .select("id, name, google_calendar_id, role")
      .eq("tenant_id", ctx.tenantId)
      .eq("is_active", true)
      .eq("is_bookable", true);
    if (input.staff_role) q = q.eq("role", input.staff_role as string);
    if (input.staff_id && input.staff_id !== PRIMARY_CALENDAR_STAFF_ID) q = q.eq("id", input.staff_id as string);

    const { data: staff, error } = await q;
    if (error) throw error;
    const staffRows = staff ?? [];
    const staffWithCalendars = staffRows.filter((s: { google_calendar_id?: string | null }) => s.google_calendar_id);
    const targets = staffWithCalendars.length > 0
      ? staffWithCalendars.map((s: { id: string; name: string; google_calendar_id: string }) =>
        ({ staff_id: s.id, staff_name: s.name, calendar_id: s.google_calendar_id }))
      : staffRows.length > 0
        ? [{ staff_id: staffRows[0].id, staff_name: staffRows[0].name, calendar_id: "primary" }]
        : [{ staff_id: PRIMARY_CALENDAR_STAFF_ID, staff_name: "Primary calendar", calendar_id: "primary" }];

    const slots = await adapters.calendar.findOpenSlots({
      tenantId: ctx.tenantId,
      staffCalendarIds: targets.map((s: { staff_id: string; calendar_id: string }) =>
        ({ staff_id: s.staff_id, calendar_id: s.calendar_id })),
      rangeStart, rangeEnd,
      slotMinutes: cfg.slotMinutes,
      businessHours: cfg,
    });
    const nameById = new Map(targets.map((s: { staff_id: string; staff_name: string }) => [s.staff_id, s.staff_name]));
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
      .limit(1);
    if (input.staff_id && input.staff_id !== PRIMARY_CALENDAR_STAFF_ID) q = q.eq("id", input.staff_id as string);
    else if (input.staff_role) q = q.eq("role", input.staff_role as string);

    const { data: rows, error: e1 } = await q;
    if (e1) throw e1;
    const staff = rows?.[0];
    const calendarId = (staff?.google_calendar_id as string | null | undefined) ?? "primary";

    const start = new Date(input.start_at as string);
    const end   = input.end_at
      ? new Date(input.end_at as string)
      : new Date(start.getTime() + 15 * 60_000);

    const event = await adapters.calendar.createEvent({
      tenantId:   ctx.tenantId,
      calendarId,
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
        staff_id:        staff?.id ?? null,
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
  vapiToolCallId?: string;
}): Promise<{ status: "ok" | "error"; output: unknown; error?: string; duration_ms: number }> {
  // Idempotency: if VAPI re-sends a tool call we've already handled, return the
  // stored result instead of running the side effect (e.g. booking) again.
  if (args.vapiToolCallId) {
    const { data: prior } = await args.supabase
      .from("tool_calls").select("output, status, error")
      .eq("vapi_tool_call_id", args.vapiToolCallId).maybeSingle();
    if (prior) {
      return { status: prior.status as "ok" | "error", output: prior.output, error: prior.error ?? undefined, duration_ms: 0 };
    }
  }

  const handler = tools[args.name as ToolName];
  const started = Date.now();
  if (!handler) {
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId, vapi_tool_call_id: args.vapiToolCallId ?? null,
      tool_name: args.name, input: args.input, output: null,
      duration_ms: 0, status: "error", error: `Unknown tool: ${args.name}`,
    });
    return { status: "error", output: null, error: `Unknown tool: ${args.name}`, duration_ms: 0 };
  }
  try {
    const output = await handler({ supabase: args.supabase, tenantId: args.tenantId, callId: args.callId }, args.input);
    const duration_ms = Date.now() - started;
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId, vapi_tool_call_id: args.vapiToolCallId ?? null,
      tool_name: args.name, input: args.input, output: output as Record<string, unknown>,
      duration_ms, status: "ok",
    });
    return { status: "ok", output, duration_ms };
  } catch (err) {
    const duration_ms = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    await args.supabase.from("tool_calls").insert({
      tenant_id: args.tenantId, call_id: args.callId, vapi_tool_call_id: args.vapiToolCallId ?? null,
      tool_name: args.name, input: args.input, output: null,
      duration_ms, status: "error", error: message,
    });
    return { status: "error", output: null, error: message, duration_ms };
  }
}
