// Per-business booking configuration: hours, slot length, timezone. Shared by
// the settings UI, the calendar adapter (slot generation), and the prompt
// composer. Stored on tenants.booking_config.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABEL: Record<DayKey, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export type DayHours = { open: boolean; start: string; end: string }; // "HH:MM"
export type BookingConfig = {
  timezone: string;
  slotMinutes: number;
  days: Record<DayKey, DayHours>;
};

const weekday = (open: boolean): DayHours => ({ open, start: "09:00", end: "17:00" });

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  timezone: "America/New_York",
  slotMinutes: 30,
  days: {
    mon: weekday(true), tue: weekday(true), wed: weekday(true),
    thu: weekday(true), fri: weekday(true),
    sat: weekday(false), sun: weekday(false),
  },
};

export const COMMON_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "UTC",
  "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Dubai", "Australia/Sydney",
];

// Merge a stored (possibly partial/empty) config with defaults.
export function normalizeBookingConfig(raw: unknown): BookingConfig {
  const r = (raw ?? {}) as Partial<BookingConfig>;
  const days = {} as Record<DayKey, DayHours>;
  for (const d of DAY_ORDER) {
    const v = (r.days as Record<string, DayHours> | undefined)?.[d];
    days[d] = {
      open: v?.open ?? DEFAULT_BOOKING_CONFIG.days[d].open,
      start: v?.start ?? "09:00",
      end: v?.end ?? "17:00",
    };
  }
  return {
    timezone: r.timezone || DEFAULT_BOOKING_CONFIG.timezone,
    slotMinutes: r.slotMinutes && r.slotMinutes > 0 ? r.slotMinutes : DEFAULT_BOOKING_CONFIG.slotMinutes,
    days,
  };
}

const SHORT_TO_KEY: Record<string, DayKey> = {
  Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun",
};

// The weekday + minutes-since-midnight of an instant, in the given timezone.
export function zonedDayAndMinutes(date: Date, timeZone: string): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = SHORT_TO_KEY[get("weekday")] ?? "mon";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some runtimes emit "24" for midnight
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  return { day, minutes };
}

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
};

// Is a slot [start, start+slotMinutes) fully inside the business's open window
// for that day, in the business timezone?
export function isSlotWithinHours(start: Date, cfg: BookingConfig): boolean {
  const { day, minutes } = zonedDayAndMinutes(start, cfg.timezone);
  const d = cfg.days[day];
  if (!d?.open) return false;
  const open = toMin(d.start);
  const close = toMin(d.end);
  return minutes >= open && minutes + cfg.slotMinutes <= close;
}

// One-line, human-readable summary for the agent's prompt.
export function describeHours(cfg: BookingConfig): string {
  const open = DAY_ORDER.filter((d) => cfg.days[d].open)
    .map((d) => `${DAY_LABEL[d]} ${cfg.days[d].start}–${cfg.days[d].end}`);
  if (open.length === 0) return "Booking is currently closed (no open days configured).";
  return `Appointments can be booked ${cfg.timezone} in ${cfg.slotMinutes}-minute slots: ${open.join("; ")}. Only offer times within these hours.`;
}
