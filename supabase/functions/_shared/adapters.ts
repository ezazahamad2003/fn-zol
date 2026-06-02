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
  });
  if (!res.ok) throw new Error(`Google Calendar ${init.method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

function ceilToSlot(d: Date, slotMs: number): number {
  return Math.ceil(d.getTime() / slotMs) * slotMs;
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
  async findOpenSlots({ tenantId, staffCalendarIds, rangeStart, rangeEnd, slotMinutes }) {
    if (staffCalendarIds.length === 0) return [];
    const fb = await googleFetch(tenantId, "/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
        items: staffCalendarIds.map((s) => ({ id: s.calendar_id })),
      }),
    });

    const slotMs = slotMinutes * 60_000;
    const out: CalendarSlot[] = [];
    for (const { staff_id, calendar_id } of staffCalendarIds) {
      const busy: { start: string; end: string }[] = fb?.calendars?.[calendar_id]?.busy ?? [];
      for (let t = ceilToSlot(rangeStart, slotMs); t + slotMs <= rangeEnd.getTime(); t += slotMs) {
        const start = new Date(t);
        const end = new Date(t + slotMs);
        const hour = start.getHours();
        const day = start.getDay();
        if (hour < 9 || hour >= 17 || day === 0 || day === 6) continue;
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
