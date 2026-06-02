// Hand-written DB row types. Replace with `supabase gen types typescript`
// output once the schema stabilizes.

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  vapi_assistant_id: string | null;
  vapi_phone_number: string | null;
  vapi_phone_id: string | null;
  model: string;
  system_prompt: string | null;
  first_message: string | null;
  voice_config: Record<string, unknown>;
  booking_config: Record<string, unknown>;
  routing_rules: { intent: string; role: string }[];
  created_at: string;
};

export type Staff = {
  id: string;
  tenant_id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  google_calendar_id: string | null;
  is_active: boolean;
  is_bookable: boolean;
  created_at: string;
};

export type CallStatus = "in_progress" | "completed" | "failed" | "no_answer";

export type Call = {
  id: string;
  tenant_id: string;
  vapi_call_id: string | null;
  caller_number: string | null;
  started_at: string;
  ended_at: string | null;
  status: CallStatus;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  created_at: string;
};

export type ToolCallStatus = "ok" | "error";

export type ToolCall = {
  id: string;
  call_id: string;
  tenant_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  duration_ms: number | null;
  status: ToolCallStatus;
  error: string | null;
  created_at: string;
};

export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  tenant_id: string;
  call_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  due_at: string | null;
  created_at: string;
};

export type AppointmentStatus = "confirmed" | "cancelled" | "completed";

export type Appointment = {
  id: string;
  tenant_id: string;
  call_id: string | null;
  staff_id: string | null;
  google_event_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  start_at: string;
  end_at: string;
  purpose: string | null;
  status: AppointmentStatus;
  created_at: string;
};

export type Urgency = "low" | "normal" | "high" | "urgent";

export type Message = {
  id: string;
  tenant_id: string;
  call_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  body: string;
  urgency: Urgency;
  routed_to: string | null;
  created_at: string;
};
