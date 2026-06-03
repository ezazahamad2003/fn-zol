import type {
  CheckAvailabilityInput,
  CheckAvailabilityOutput,
  ToolHandler,
} from "@/lib/tools/types";
import { normalizeBookingConfig, type BookingConfig } from "@/lib/booking";

export const PRIMARY_CALENDAR_STAFF_ID = "primary";

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

function parseRange(raw: { start: string; end: string }, cfg: BookingConfig): { rangeStart: Date; rangeEnd: Date } {
  const rangeStart = DATE_ONLY_RE.test(raw.start) ? zonedDateToUtc(raw.start, "00:00:00", cfg.timezone) : new Date(raw.start);
  let rangeEnd = DATE_ONLY_RE.test(raw.end) ? zonedDateToUtc(raw.end, "23:59:59", cfg.timezone) : new Date(raw.end);
  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    throw new Error("check_availability: invalid date_range; use ISO dates or datetimes");
  }
  if (rangeEnd <= rangeStart) rangeEnd = new Date(rangeStart.getTime() + 24 * 60 * 60_000);
  return { rangeStart, rangeEnd };
}

export const checkAvailability: ToolHandler<CheckAvailabilityInput, CheckAvailabilityOutput> = async (
  ctx,
  input,
) => {
  // Load the business's booking hours (slot length + open windows).
  const { data: tenant } = await ctx.supabase
    .from("tenants").select("booking_config").eq("id", ctx.tenantId).maybeSingle();
  const cfg = normalizeBookingConfig(tenant?.booking_config);
  const { rangeStart, rangeEnd } = parseRange(input.date_range, cfg);

  let q = ctx.supabase
    .from("staff")
    .select("id, name, google_calendar_id, role")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .eq("is_bookable", true);
  if (input.staff_role) q = q.eq("role", input.staff_role);
  if (input.staff_id && input.staff_id !== PRIMARY_CALENDAR_STAFF_ID) q = q.eq("id", input.staff_id);

  const { data: staff, error } = await q;
  if (error) throw error;
  const staffRows = staff ?? [];
  const staffWithCalendars = staffRows.filter((s) => s.google_calendar_id);
  const targets = staffWithCalendars.length > 0
    ? staffWithCalendars.map((s) => ({ staff_id: s.id, staff_name: s.name as string, calendar_id: s.google_calendar_id! }))
    : staffRows.length > 0
      ? [{ staff_id: staffRows[0].id, staff_name: staffRows[0].name as string, calendar_id: "primary" }]
      : [{ staff_id: PRIMARY_CALENDAR_STAFF_ID, staff_name: "Primary calendar", calendar_id: "primary" }];

  const slots = await ctx.adapters.calendar.findOpenSlots({
    tenant: { id: ctx.tenantId },
    staffCalendarIds: targets.map((s) => ({ staff_id: s.staff_id, calendar_id: s.calendar_id })),
    rangeStart,
    rangeEnd,
    slotMinutes: cfg.slotMinutes,
    businessHours: cfg,
  });

  const nameById = new Map(targets.map((s) => [s.staff_id, s.staff_name]));
  return {
    slots: slots.map((s) => ({
      start: s.start,
      end: s.end,
      staff_id: s.staff_id,
      staff_name: nameById.get(s.staff_id) ?? "Unknown",
    })),
  };
};
