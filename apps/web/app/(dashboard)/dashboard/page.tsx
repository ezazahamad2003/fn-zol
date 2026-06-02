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

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Calls</h1>
          <p className="text-xs text-muted-foreground">Most recent calls for {tenant.name}.</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Inbound number:{" "}
          <span className="font-mono">{tenant.vapi_phone_number ?? "(not provisioned)"}</span>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>Recent</CardTitle></CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="p-6"><EmptyState title="No calls yet." hint="Trigger a tool from POST /api/dev/trigger or wait for VAPI to call in." /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">When</th>
                  <th className="text-left font-medium px-4 py-2">Caller</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                  <th className="text-left font-medium px-4 py-2">Duration</th>
                  <th className="text-left font-medium px-4 py-2">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums text-xs text-muted-foreground">{relativeTime(c.started_at)}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{c.caller_number ?? "—"}</td>
                    <td className="px-4 py-2"><Badge variant={statusVariant(c.status)}>{c.status}</Badge></td>
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums text-xs">{callDuration(c.started_at, c.ended_at)}</td>
                    <td className="px-4 py-2 max-w-[480px]">
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
