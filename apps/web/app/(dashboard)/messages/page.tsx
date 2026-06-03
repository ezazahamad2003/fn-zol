import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";
import type { Message, Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No business." /></div>;

  const supabase = supabaseServer();
  const [{ data: msgs }, { data: staff }] = await Promise.all([
    supabase.from("messages").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
    supabase.from("staff")   .select("*").eq("tenant_id", tenant.id),
  ]);

  const staffById = new Map((staff as Staff[] | null ?? []).map((s) => [s.id, s.name]));
  const list = (msgs as Message[] | null ?? []);
  const urgent = list.filter((m) => m.urgency === "urgent" || m.urgency === "high").length;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Caller messages captured by the agent.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Metric label="Messages" value={list.length} />
        <Metric label="High urgency" value={urgent} tone={urgent > 0 ? "danger" : "muted"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="p-4"><EmptyState title="No messages yet." /></div>
          ) : (
            <div className="divide-y divide-border">
              {list.map((m) => (
                <div key={m.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{m.customer_name ?? "(anonymous)"}</span>
                        {m.customer_phone && <span className="text-[11px] text-muted-foreground font-mono">{m.customer_phone}</span>}
                      </div>
                      <p className="text-sm leading-6 mt-1">{m.body}</p>
                    </div>
                    <Badge variant={m.urgency === "urgent" || m.urgency === "high" ? "danger" : "muted"}>{m.urgency}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3">
                    <span>{m.routed_to ? `Routed to ${staffById.get(m.routed_to) ?? "staff"}` : "Unrouted"}</span>
                    <span className="flex items-center gap-2">
                      <span>{relativeTime(m.created_at)}</span>
                      {m.call_id && <Link href={`/calls/${m.call_id}`} className="underline">call</Link>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" | "muted" }) {
  const color = tone === "danger" ? "text-rose-700" : tone === "muted" ? "text-slate-500" : "text-slate-900";
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
