import type { Tenant } from "@/lib/db/types";

// ----------------------------------------------------------------------------
// VAPI
// ----------------------------------------------------------------------------

export type VapiAssistantConfig = {
  name: string;
  model: string;
  systemPrompt: string;
  voice: Record<string, unknown>;
};

export type ProvisionedTenantVapi = {
  vapi_assistant_id: string;
  vapi_phone_number: string;
  vapi_phone_id: string;
};

export interface VapiAdapter {
  /** One-time provisioning at tenant onboarding. Writes assistant id +
   *  phone number that get stored on the `tenants` row. */
  provisionTenant(input: VapiAssistantConfig): Promise<ProvisionedTenantVapi>;

  /** Push updated assistant config (e.g. new system prompt). */
  updateAssistant(assistantId: string, input: Partial<VapiAssistantConfig>): Promise<void>;
}

// ----------------------------------------------------------------------------
// Calendar
// ----------------------------------------------------------------------------

export type CalendarSlot = {
  start: string;       // ISO
  end: string;         // ISO
  staff_id: string;
};

export type CalendarEvent = {
  google_event_id: string;
  start_at: string;
  end_at: string;
  htmlLink?: string;
};

export interface CalendarAdapter {
  /** Free/busy lookup across the given staff calendars within a date range. */
  findOpenSlots(input: {
    tenant: Pick<Tenant, "id">;
    staffCalendarIds: { staff_id: string; calendar_id: string }[];
    rangeStart: Date;
    rangeEnd: Date;
    slotMinutes: number;
  }): Promise<CalendarSlot[]>;

  /** Create an event on a specific calendar. */
  createEvent(input: {
    tenant: Pick<Tenant, "id">;
    calendarId: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    attendees?: { name?: string; phone?: string; email?: string }[];
  }): Promise<CalendarEvent>;
}

// ----------------------------------------------------------------------------
// Model (LLM) — used for offline tasks like end-of-call extraction.
// VAPI handles the in-call model; this adapter is for our background jobs.
// ----------------------------------------------------------------------------

export type ExtractedTask = {
  title: string;
  description?: string;
  assignee_hint?: string;
};

export interface ModelAdapter {
  /** Given a transcript + summary, extract follow-up tasks. */
  extractTasks(input: {
    transcript: string;
    summary?: string | null;
  }): Promise<ExtractedTask[]>;
}
