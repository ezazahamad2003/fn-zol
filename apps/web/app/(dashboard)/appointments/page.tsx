import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { normalizeBookingConfig } from "@/lib/booking";
import type { Appointment, Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "muted" | "danger"> = {
  confirmed: "success", completed: "muted", cancelled: "danger",
};

export default async function AppointmentsPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No business." /></div>;

  const tz = normalizeBookingConfig(tenant.booking_config).timezone;
  const supabase = supabaseServer();
  const [{ data: appts }, { data: staff }] = await Promise.all([
    supabase.from("appointments").select("*").eq("tenant_id", tenant.id).order("start_at", { ascending: true }),
    supabase.from("staff").select("id, name").eq("tenant_id", tenant.id),
  ]);

  const staffById = new Map((staff as Pick<Staff, "id" | "name">[] | null ?? []).map((s) => [s.id, s.name]));
  const list = (appts as Appointment[] | null ?? []);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-lg font-semibold">Appointments</h1>
        <p className="text-xs text-muted-foreground">Booked by the agent on staff calendars · times in {tz}.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Upcoming &amp; past</CardTitle></CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? <div className="p-4"><EmptyState title="No appointments yet." hint="They'll appear here when the agent books one." /></div> : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">When</th>
                  <th className="text-left font-medium px-4 py-2">Customer</th>
                  <th className="text-left font-medium px-4 py-2">With</th>
                  <th className="text-left font-medium px-4 py-2">Purpose</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{fmt(a.start_at)}</td>
                    <td className="px-4 py-2">
                      {a.customer_name}
                      {a.customer_phone && <span className="block text-[11px] text-muted-foreground font-mono">{a.customer_phone}</span>}
                    </td>
                    <td className="px-4 py-2">{a.staff_id ? (staffById.get(a.staff_id) ?? "—") : "—"}</td>
                    <td className="px-4 py-2">{a.purpose ?? "—"}</td>
                    <td className="px-4 py-2"><Badge variant={STATUS_VARIANT[a.status] ?? "muted"}>{a.status}</Badge></td>
                    <td className="px-4 py-2 text-right">{a.call_id && <Link href={`/calls/${a.call_id}`} className="underline text-xs">call</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
