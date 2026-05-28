import type { RouteCallInput, RouteCallOutput, ToolHandler } from "@/lib/tools/types";

export const routeCall: ToolHandler<RouteCallInput, RouteCallOutput> = async (ctx, input) => {
  if (!input.staff_role && !input.staff_name) {
    throw new Error("route_call: provide staff_role or staff_name");
  }

  let q = ctx.supabase
    .from("staff")
    .select("id, name, phone")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .not("phone", "is", null)
    .limit(1);
  if (input.staff_name) q = q.ilike("name", `%${input.staff_name}%`);
  else if (input.staff_role) q = q.eq("role", input.staff_role);

  const { data, error } = await q;
  if (error) throw error;
  const staff = data?.[0];
  if (!staff) throw new Error(`route_call: no staff match for ${JSON.stringify(input)}`);

  return {
    staff_id:        staff.id,
    staff_name:      staff.name,
    transfer_number: staff.phone!,
  };
};
