import type {
  CheckAvailabilityInput,
  CheckAvailabilityOutput,
  ToolHandler,
} from "@/lib/tools/types";
import { normalizeBookingConfig } from "@/lib/booking";

export const checkAvailability: ToolHandler<CheckAvailabilityInput, CheckAvailabilityOutput> = async (
  ctx,
  input,
) => {
  const rangeStart = new Date(input.date_range.start);
  const rangeEnd   = new Date(input.date_range.end);
  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    throw new Error("check_availability: invalid date_range");
  }

  // Load the business's booking hours (slot length + open windows).
  const { data: tenant } = await ctx.supabase
    .from("tenants").select("booking_config").eq("id", ctx.tenantId).maybeSingle();
  const cfg = normalizeBookingConfig(tenant?.booking_config);

  let q = ctx.supabase
    .from("staff")
    .select("id, name, google_calendar_id, role")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .eq("is_bookable", true)
    .not("google_calendar_id", "is", null);
  if (input.staff_role) q = q.eq("role", input.staff_role);
  if (input.staff_id)   q = q.eq("id", input.staff_id);

  const { data: staff, error } = await q;
  if (error) throw error;
  if (!staff || staff.length === 0) {
    return { slots: [] };
  }

  const slots = await ctx.adapters.calendar.findOpenSlots({
    tenant: { id: ctx.tenantId },
    staffCalendarIds: staff.map((s) => ({ staff_id: s.id, calendar_id: s.google_calendar_id! })),
    rangeStart,
    rangeEnd,
    slotMinutes: cfg.slotMinutes,
    businessHours: cfg,
  });

  const nameById = new Map(staff.map((s) => [s.id, s.name as string]));
  return {
    slots: slots.map((s) => ({
      start: s.start,
      end: s.end,
      staff_id: s.staff_id,
      staff_name: nameById.get(s.staff_id) ?? "Unknown",
    })),
  };
};
