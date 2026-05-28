import type { CalendarAdapter, CalendarSlot, CalendarEvent } from "@/lib/adapters/types";

let eventSeq = 0;
const nextEventId = () => `stub-gcal-${Date.now()}-${++eventSeq}`;

// Generate plausible 15-min slots within business hours for each staff calendar.
function* enumerateSlots(start: Date, end: Date, slotMinutes: number): Generator<{ s: Date; e: Date }> {
  const cur = new Date(start);
  cur.setMinutes(0, 0, 0);
  while (cur < end) {
    const hour = cur.getHours();
    if (hour >= 9 && hour < 17 && cur.getDay() !== 0 && cur.getDay() !== 6) {
      const s = new Date(cur);
      const e = new Date(cur.getTime() + slotMinutes * 60_000);
      yield { s, e };
    }
    cur.setMinutes(cur.getMinutes() + slotMinutes);
  }
}

export const calendarStub: CalendarAdapter = {
  async findOpenSlots({ staffCalendarIds, rangeStart, rangeEnd, slotMinutes }): Promise<CalendarSlot[]> {
    const out: CalendarSlot[] = [];
    let i = 0;
    for (const slot of enumerateSlots(rangeStart, rangeEnd, slotMinutes)) {
      const staff = staffCalendarIds[i % staffCalendarIds.length];
      // Pretend a couple of arbitrary slots are busy.
      if (i % 5 !== 0) {
        out.push({ start: slot.s.toISOString(), end: slot.e.toISOString(), staff_id: staff.staff_id });
      }
      if (out.length >= 6) break;
      i++;
    }
    return out;
  },

  async createEvent({ start, end }): Promise<CalendarEvent> {
    return {
      google_event_id: nextEventId(),
      start_at: start.toISOString(),
      end_at:   end.toISOString(),
    };
  },
};
