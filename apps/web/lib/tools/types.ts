import type { SupabaseClient } from "@supabase/supabase-js";
import type { adapters } from "@/lib/adapters";

export type ToolName =
  | "check_availability"
  | "book_appointment"
  | "route_call"
  | "capture_message"
  | "create_task";

export type ToolContext = {
  supabase: SupabaseClient;   // service-role client
  adapters: typeof adapters;
  tenantId: string;
  callId: string;             // a call row must exist before tools fire
};

export type ToolHandler<TInput = unknown, TOutput = unknown> =
  (ctx: ToolContext, input: TInput) => Promise<TOutput>;

// ----- input/output shapes (also the wire contract for VAPI) -------------

export type CheckAvailabilityInput = {
  date_range: { start: string; end: string };
  staff_role?: string;
  staff_id?: string;
  slot_minutes?: number;
};

export type CheckAvailabilityOutput = {
  slots: { start: string; end: string; staff_id: string; staff_name: string }[];
};

export type BookAppointmentInput = {
  customer_name: string;
  customer_phone?: string;
  start_at: string;
  end_at?: string;
  purpose?: string;
  staff_id?: string;
  staff_role?: string;
};

export type BookAppointmentOutput = {
  appointment_id: string;
  google_event_id: string;
  start_at: string;
  end_at: string;
};

export type RouteCallInput = {
  staff_role?: string;
  staff_name?: string;
};

export type RouteCallOutput = {
  staff_id: string;
  staff_name: string;
  transfer_number: string;
};

export type CaptureMessageInput = {
  customer_name?: string;
  customer_phone?: string;
  body: string;
  urgency?: "low" | "normal" | "high" | "urgent";
  staff_role?: string;
};

export type CaptureMessageOutput = {
  message_id: string;
  routed_to_staff_id: string | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  assigned_to?: string;
  due_at?: string;
};

export type CreateTaskOutput = {
  task_id: string;
};
