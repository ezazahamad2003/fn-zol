// Edge-function (Deno) twin of apps/web/lib/adapters. Same shape, but lives
// here because Deno can't import from the Next.js app.

const USE_STUBS = (Deno.env.get("USE_STUBS") ?? "true").toLowerCase() === "true";

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
  async findOpenSlots() {
    // TODO: wire Google Calendar freeBusy. See apps/web/lib/adapters/calendar/real.ts.
    throw new Error("calendarReal.findOpenSlots not implemented in edge function");
  },
  async createEvent() {
    // TODO: wire Google Calendar events.insert.
    throw new Error("calendarReal.createEvent not implemented in edge function");
  },
};

export const adapters = {
  calendar: USE_STUBS ? calendarStub : calendarReal,
};
