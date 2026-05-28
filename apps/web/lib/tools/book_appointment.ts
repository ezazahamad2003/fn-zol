import type {
  BookAppointmentInput,
  BookAppointmentOutput,
  ToolHandler,
} from "@/lib/tools/types";

export const bookAppointment: ToolHandler<BookAppointmentInput, BookAppointmentOutput> = async (
  ctx,
  input,
) => {
  // Resolve target staff: explicit id wins, then role, then first active w/ calendar.
  let staffQuery = ctx.supabase
    .from("staff")
    .select("id, name, google_calendar_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .not("google_calendar_id", "is", null)
    .limit(1);
  if (input.staff_id)        staffQuery = staffQuery.eq("id", input.staff_id);
  else if (input.staff_role) staffQuery = staffQuery.eq("role", input.staff_role);

  const { data: staffRows, error: staffErr } = await staffQuery;
  if (staffErr) throw staffErr;
  const staff = staffRows?.[0];
  if (!staff) throw new Error("book_appointment: no eligible staff member found");

  const start = new Date(input.start_at);
  if (isNaN(start.getTime())) throw new Error("book_appointment: invalid start_at");
  const end = input.end_at ? new Date(input.end_at) : new Date(start.getTime() + 15 * 60_000);

  const event = await ctx.adapters.calendar.createEvent({
    tenant:     { id: ctx.tenantId },
    calendarId: staff.google_calendar_id!,
    title:      `ZOL: ${input.purpose ?? "Appointment"} (${input.customer_name})`,
    description: [
      `Customer: ${input.customer_name}`,
      input.customer_phone ? `Phone: ${input.customer_phone}` : null,
      input.purpose ? `Purpose: ${input.purpose}` : null,
    ].filter(Boolean).join("\n"),
    start,
    end,
    attendees: [{ name: input.customer_name, phone: input.customer_phone }],
  });

  const { data: appt, error: insertErr } = await ctx.supabase
    .from("appointments")
    .insert({
      tenant_id:       ctx.tenantId,
      call_id:         ctx.callId,
      staff_id:        staff.id,
      google_event_id: event.google_event_id,
      customer_name:   input.customer_name,
      customer_phone:  input.customer_phone ?? null,
      start_at:        event.start_at,
      end_at:          event.end_at,
      purpose:         input.purpose ?? null,
    })
    .select("id")
    .single();
  if (insertErr) throw insertErr;

  return {
    appointment_id:  appt.id,
    google_event_id: event.google_event_id,
    start_at:        event.start_at,
    end_at:          event.end_at,
  };
};
