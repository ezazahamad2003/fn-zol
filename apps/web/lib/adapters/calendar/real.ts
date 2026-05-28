import type { CalendarAdapter, CalendarSlot, CalendarEvent } from "@/lib/adapters/types";

// TODO: wire real Google Calendar.
// Reference: https://developers.google.com/calendar/api/v3/reference
//
// Recommended approach:
//   - Use a service account with domain-wide delegation (impersonate each
//     staff member's calendar), OR per-tenant OAuth tokens stored encrypted.
//   - findOpenSlots → POST https://www.googleapis.com/calendar/v3/freeBusy
//   - createEvent   → POST /calendars/{calendarId}/events
//
// Keep the implementation in this file — the rest of the app only talks to
// the CalendarAdapter interface.

export const calendarReal: CalendarAdapter = {
  async findOpenSlots(_input): Promise<CalendarSlot[]> {
    throw new Error("calendarReal.findOpenSlots not implemented — set USE_STUBS=true or wire Google Calendar");
  },

  async createEvent(_input): Promise<CalendarEvent> {
    throw new Error("calendarReal.createEvent not implemented — set USE_STUBS=true or wire Google Calendar");
  },
};
