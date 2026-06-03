import type {
  CheckAvailabilityInput,
  CheckAvailabilityOutput,
  ToolHandler,
} from "@/lib/tools/types";
import { normalizeBookingConfig, type BookingConfig } from "@/lib/booking";

export const PRIMARY_CALENDAR_STAFF_ID = "primary";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

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

function zonedToday(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function relativeDate(raw: string, timeZone: string): string | null {
  const value = raw.toLowerCase().trim();
  const today = zonedToday(timeZone);
  if (value === "today" || value.includes("today")) return today;
  if (value.includes("day after tomorrow")) return addDays(today, 2);
  if (value === "tomorrow" || value.includes("tomorrow")) return addDays(today, 1);

  const weekday = Object.entries(WEEKDAYS).find(([name]) => value.includes(name));
  if (!weekday) return null;
  const [year, month, day] = today.split("-").map(Number);
  const currentDow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  let delta = (weekday[1] - currentDow + 7) % 7;
  if (delta === 0 || value.includes("next ")) delta += 7;
  return addDays(today, delta);
}

function parseDateBoundary(raw: string, boundary: "start" | "end", cfg: BookingConfig): Date {
  const date = DATE_ONLY_RE.test(raw) ? raw : relativeDate(raw, cfg.timezone);
  if (date) {
    return zonedDateToUtc(date, boundary === "start" ? "00:00:00" : "23:59:59", cfg.timezone);
  }
  return new Date(raw);
}

function parseRange(raw: { start: string; end: string }, cfg: BookingConfig): { rangeStart: Date; rangeEnd: Date } {
  const rangeStart = parseDateBoundary(raw.start, "start", cfg);
  let rangeEnd = parseDateBoundary(raw.end, "end", cfg);
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
