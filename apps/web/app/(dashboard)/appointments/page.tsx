import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { normalizeBookingConfig } from "@/lib/booking";
import type { Appointment, Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "muted" | "danger"> = {
  confirmed: "success",
  completed: "muted",
  cancelled: "danger",
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
  const now = Date.now();
  const upcoming = list.filter((a) => new Date(a.start_at).getTime() >= now && a.status === "confirmed").length;

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-7xl">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Booked by the agent, shown in {tz}.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric label="Upcoming" value={upcoming} tone="success" />
        <Metric label="Total booked" value={list.length} />
        <Metric label="Timezone" value={0} text={tz.replace("America/", "")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {list.length === 0 ? (
            <div className="p-4"><EmptyState title="No appointments yet." hint="They will appear here when the agent books one." /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">When</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3">Calendar</th>
                  <th className="text-left font-medium px-4 py-3">Purpose</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(a.start_at)}</td>
                    <td className="px-4 py-3">
                      {a.customer_name}
                      {a.customer_phone && <span className="block text-[11px] text-muted-foreground font-mono">{a.customer_phone}</span>}
                    </td>
                    <td className="px-4 py-3">{a.staff_id ? (staffById.get(a.staff_id) ?? "Staff calendar") : "Primary calendar"}</td>
                    <td className="px-4 py-3 max-w-[360px]"><span className="line-clamp-1">{a.purpose ?? "-"}</span></td>
                    <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[a.status] ?? "muted"}>{a.status}</Badge></td>
                    <td className="px-4 py-3 text-right">{a.call_id && <Link href={`/calls/${a.call_id}`} className="underline text-xs">call</Link>}</td>
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

function Metric({ label, value, tone = "default", text }: { label: string; value: number; tone?: "default" | "success"; text?: string }) {
  const color = tone === "success" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>{text ?? value}</div>
    </div>
  );
}
