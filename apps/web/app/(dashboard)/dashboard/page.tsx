import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { callDuration, relativeTime } from "@/lib/utils";
import type { Call, CallStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

function statusVariant(s: CallStatus): "success" | "warning" | "danger" | "muted" {
  switch (s) {
    case "completed":   return "success";
    case "in_progress": return "warning";
    case "failed":      return "danger";
    default:            return "muted";
  }
}

export default async function DashboardPage() {
  const tenant = await getActiveTenant();
  if (!tenant) {
    return (
      <div className="p-6">
        <EmptyState title="No tenants in the database." hint="Run `supabase db reset` to load the FNS seed." />
      </div>
    );
  }

  const supabase = supabaseServer();
  const { data: calls } = await supabase
    .from("calls")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("started_at", { ascending: false })
    .limit(50);

  const list = (calls ?? []) as Call[];
  const completed = list.filter((c) => c.status === "completed").length;
  const active = list.filter((c) => c.status === "in_progress").length;
  const failed = list.filter((c) => c.status === "failed").length;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-7xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calls</h1>
          <p className="text-sm text-muted-foreground mt-1">Live call activity for {tenant.name}.</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <span>Inbound number</span>
          <span className="ml-2 font-mono text-slate-900">{tenant.vapi_phone_number ?? "(not provisioned)"}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric label="Total calls" value={list.length} />
        <Metric label="Completed" value={completed} tone="success" />
        <Metric label="Needs attention" value={active + failed} tone={active + failed > 0 ? "warning" : "muted"} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent calls</CardTitle>
            <p className="text-xs text-muted-foreground">Latest 50 conversations and outcomes.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {list.length === 0 ? (
            <div className="p-6"><EmptyState title="No calls yet." hint="Calls will appear here once VAPI sends events." /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">When</th>
                  <th className="text-left font-medium px-4 py-3">Caller</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Duration</th>
                  <th className="text-left font-medium px-4 py-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-xs text-muted-foreground">{relativeTime(c.started_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{c.caller_number ?? "-"}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(c.status)}>{c.status}</Badge></td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-xs">{callDuration(c.started_at, c.ended_at)}</td>
                    <td className="px-4 py-3 max-w-[520px]">
                      <Link href={`/calls/${c.id}`} className="hover:underline">
                        <span className="line-clamp-1">{c.summary ?? <span className="text-muted-foreground italic">(no summary)</span>}</span>
                      </Link>
                    </td>
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

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "muted" }) {
  const dot = {
    default: "bg-sky-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    muted: "bg-slate-400",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
