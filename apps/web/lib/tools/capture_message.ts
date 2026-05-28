import type {
  CaptureMessageInput,
  CaptureMessageOutput,
  ToolHandler,
} from "@/lib/tools/types";

const ROLE_FOR_URGENCY: Record<string, string> = {
  urgent: "owner",
  high:   "owner",
  normal: "sales",
  low:    "sales",
};

export const captureMessage: ToolHandler<CaptureMessageInput, CaptureMessageOutput> = async (
  ctx,
  input,
) => {
  if (!input.body) throw new Error("capture_message: body is required");
  const urgency = input.urgency ?? "normal";
  const routeRole = input.staff_role ?? ROLE_FOR_URGENCY[urgency] ?? "sales";

  // Best-effort routing — pick the first active staff member with that role.
  const { data: routedRows } = await ctx.supabase
    .from("staff")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .eq("role", routeRole)
    .limit(1);
  const routedToId = routedRows?.[0]?.id ?? null;

  const { data, error } = await ctx.supabase
    .from("messages")
    .insert({
      tenant_id:      ctx.tenantId,
      call_id:        ctx.callId,
      customer_name:  input.customer_name ?? null,
      customer_phone: input.customer_phone ?? null,
      body:           input.body,
      urgency,
      routed_to:      routedToId,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { message_id: data.id, routed_to_staff_id: routedToId };
};
