import type { CalendarAdapter, CalendarSlot, CalendarEvent } from "@/lib/adapters/types";
import { getValidAccessToken } from "@/lib/google/oauth";
import { DEFAULT_BOOKING_CONFIG, isSlotWithinHours } from "@/lib/booking";
import { fetchWithRetry } from "@/lib/http";

// Real Google Calendar adapter. Uses the per-tenant OAuth token (see
// lib/google/oauth.ts). findOpenSlots derives free windows from the freeBusy
// API; createEvent writes to the staff member's calendar.
//
// Docs: https://developers.google.com/calendar/api/v3/reference

const CAL_BASE = "https://www.googleapis.com/calendar/v3";

async function googleFetch(tenantId: string, path: string, init: RequestInit): Promise<any> {
  const token = await getValidAccessToken(tenantId);
  const res = await fetchWithRetry(`${CAL_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  }, { timeoutMs: 15_000, retries: 2 });
  if (!res.ok) throw new Error(`Google Calendar ${init.method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export const calendarReal: CalendarAdapter = {
  async findOpenSlots(input): Promise<CalendarSlot[]> {
    const tenantId = input.tenant.id;
    if (input.staffCalendarIds.length === 0) return [];

    const cfg = input.businessHours ?? DEFAULT_BOOKING_CONFIG;
    const slotMs = cfg.slotMinutes * 60_000;

    const fb = await googleFetch(tenantId, "/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: input.rangeStart.toISOString(),
        timeMax: input.rangeEnd.toISOString(),
        items: input.staffCalendarIds.map((s) => ({ id: s.calendar_id })),
      }),
    });

    const out: CalendarSlot[] = [];
    for (const { staff_id, calendar_id } of input.staffCalendarIds) {
      const busy: { start: string; end: string }[] = fb?.calendars?.[calendar_id]?.busy ?? [];
      // Walk the window in slot steps; offer a slot if it's inside the
      // business's open hours (in their timezone) and overlaps no busy block.
      for (let t = ceilToSlot(input.rangeStart, slotMs); t + slotMs <= input.rangeEnd.getTime(); t += slotMs) {
        const start = new Date(t);
        const end = new Date(t + slotMs);
        if (!isSlotWithinHours(start, cfg)) continue;
        const overlaps = busy.some((b) => new Date(b.start).getTime() < end.getTime() && new Date(b.end).getTime() > start.getTime());
        if (overlaps) continue;
        out.push({ start: start.toISOString(), end: end.toISOString(), staff_id });
        if (out.length >= 6) return out;
      }
    }
    return out;
  },

  async createEvent(input): Promise<CalendarEvent> {
    const tenantId = input.tenant.id;
    const event = await googleFetch(tenantId, `/calendars/${encodeURIComponent(input.calendarId)}/events`, {
      method: "POST",
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.start.toISOString() },
        end: { dateTime: input.end.toISOString() },
        attendees: (input.attendees ?? [])
          .filter((a) => a.email)
          .map((a) => ({ email: a.email, displayName: a.name })),
      }),
    });

    return {
      google_event_id: event.id,
      start_at: event.start?.dateTime ?? input.start.toISOString(),
      end_at: event.end?.dateTime ?? input.end.toISOString(),
      htmlLink: event.htmlLink,
    };
  },
};

function ceilToSlot(d: Date, slotMs: number): number {
  return Math.ceil(d.getTime() / slotMs) * slotMs;
}
