// Edge-function (Deno) twin of apps/web/lib/adapters. Same shape, but lives
// here because Deno can't import from the Next.js app.

import { getValidAccessToken } from "./google.ts";

const USE_STUBS = (Deno.env.get("USE_STUBS") ?? "true").toLowerCase() === "true";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

async function googleFetch(tenantId: string, path: string, init: RequestInit): Promise<any> {
  const token = await getValidAccessToken(tenantId);
  const res = await fetch(`${CAL_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(10_000), // caller is on the line — fail fast
  });
  if (!res.ok) throw new Error(`Google Calendar ${init.method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

function ceilToSlot(d: Date, slotMs: number): number {
  return Math.ceil(d.getTime() / slotMs) * slotMs;
}

// --- business-hours helpers (Deno twin of apps/web/lib/booking.ts) ---
type DayHours = { open: boolean; start: string; end: string };
export type BusinessHours = {
  timezone: string;
  slotMinutes: number;
  days: Record<string, DayHours>;
};
const SHORT_TO_KEY: Record<string, string> = {
  Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun",
};
const toMin = (hhmm: string): number => {
  const [h, m] = (hhmm ?? "0:0").split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
};
const DEFAULT_DAY = (open: boolean): DayHours => ({ open, start: "09:00", end: "17:00" });
export function normalizeBookingConfig(raw: unknown): BusinessHours {
  const r = (raw ?? {}) as Partial<BusinessHours>;
  const defaults: Record<string, boolean> = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };
  const days: Record<string, DayHours> = {};
  for (const d of Object.keys(defaults)) {
    const v = (r.days as Record<string, DayHours> | undefined)?.[d];
    days[d] = { open: v?.open ?? defaults[d], start: v?.start ?? "09:00", end: v?.end ?? "17:00" };
  }
  return {
    timezone: r.timezone || "America/New_York",
    slotMinutes: r.slotMinutes && r.slotMinutes > 0 ? r.slotMinutes : 30,
    days,
  };
}

function isSlotWithinHours(start: Date, cfg: BusinessHours): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: cfg.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(start);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = SHORT_TO_KEY[get("weekday")] ?? "mon";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  const d = cfg.days?.[day];
  if (!d?.open) return false;
  return minutes >= toMin(d.start) && minutes + cfg.slotMinutes <= toMin(d.end);
}

export type CalendarSlot = { start: string; end: string; staff_id: string };
export type CalendarEvent = { google_event_id: string; start_at: string; end_at: string };

export interface CalendarAdapter {
  findOpenSlots(input: {
    tenantId: string;
    staffCalendarIds: { staff_id: string; calendar_id: string }[];
    rangeStart: Date;
    rangeEnd: Date;
    slotMinutes: number;
    businessHours?: BusinessHours;
  }): Promise<CalendarSlot[]>;

  createEvent(input: {
    tenantId: string;
    calendarId: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
  }): Promise<CalendarEvent>;
}

// ---------- stub ----------

let _seq = 0;

const calendarStub: CalendarAdapter = {
  async findOpenSlots({ staffCalendarIds, rangeStart, rangeEnd, slotMinutes }) {
    const out: CalendarSlot[] = [];
    const cur = new Date(rangeStart);
    cur.setMinutes(0, 0, 0);
    let i = 0;
    while (cur < rangeEnd && out.length < 6) {
      const hour = cur.getHours();
      if (hour >= 9 && hour < 17 && cur.getDay() !== 0 && cur.getDay() !== 6 && i % 5 !== 0) {
        const staff = staffCalendarIds[i % staffCalendarIds.length];
        if (staff) {
          out.push({
            start:    new Date(cur).toISOString(),
            end:      new Date(cur.getTime() + slotMinutes * 60_000).toISOString(),
            staff_id: staff.staff_id,
          });
        }
      }
      cur.setMinutes(cur.getMinutes() + slotMinutes);
      i++;
    }
    return out;
  },

  async createEvent({ start, end }) {
    return {
      google_event_id: `stub-gcal-${Date.now()}-${++_seq}`,
      start_at:        start.toISOString(),
      end_at:          end.toISOString(),
    };
  },
};

// ---------- real (TODO) ----------

const calendarReal: CalendarAdapter = {
  async findOpenSlots({ tenantId, staffCalendarIds, rangeStart, rangeEnd, slotMinutes, businessHours }) {
    if (staffCalendarIds.length === 0) return [];
    const cfg: BusinessHours = businessHours ?? {
      timezone: "America/New_York", slotMinutes,
      days: {
        mon: { open: true, start: "09:00", end: "17:00" }, tue: { open: true, start: "09:00", end: "17:00" },
        wed: { open: true, start: "09:00", end: "17:00" }, thu: { open: true, start: "09:00", end: "17:00" },
        fri: { open: true, start: "09:00", end: "17:00" }, sat: { open: false, start: "09:00", end: "17:00" },
        sun: { open: false, start: "09:00", end: "17:00" },
      },
    };
    const slotMs = cfg.slotMinutes * 60_000;

    const fb = await googleFetch(tenantId, "/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
        items: staffCalendarIds.map((s) => ({ id: s.calendar_id })),
      }),
    });

    const out: CalendarSlot[] = [];
    for (const { staff_id, calendar_id } of staffCalendarIds) {
      const busy: { start: string; end: string }[] = fb?.calendars?.[calendar_id]?.busy ?? [];
      for (let t = ceilToSlot(rangeStart, slotMs); t + slotMs <= rangeEnd.getTime(); t += slotMs) {
        const start = new Date(t);
        const end = new Date(t + slotMs);
        if (!isSlotWithinHours(start, cfg)) continue;
        const overlaps = busy.some((b) =>
          new Date(b.start).getTime() < end.getTime() && new Date(b.end).getTime() > start.getTime());
        if (overlaps) continue;
        out.push({ start: start.toISOString(), end: end.toISOString(), staff_id });
        if (out.length >= 6) return out;
      }
    }
    return out;
  },

  async createEvent({ tenantId, calendarId, title, description, start, end }) {
    const event = await googleFetch(tenantId, `/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      body: JSON.stringify({
        summary: title,
        description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    });
    return {
      google_event_id: event.id,
      start_at: event.start?.dateTime ?? start.toISOString(),
      end_at: event.end?.dateTime ?? end.toISOString(),
    };
  },
};

export const adapters = {
  calendar: USE_STUBS ? calendarStub : calendarReal,
};
