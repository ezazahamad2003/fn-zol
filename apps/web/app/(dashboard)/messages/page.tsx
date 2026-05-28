import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";
import type { Message, Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No tenant." /></div>;

  const supabase = supabaseAdmin();
  const [{ data: msgs }, { data: staff }] = await Promise.all([
    supabase.from("messages").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
    supabase.from("staff")   .select("*").eq("tenant_id", tenant.id),
  ]);

  const staffById = new Map((staff as Staff[] | null ?? []).map((s) => [s.id, s.name]));
  const list = (msgs as Message[] | null ?? []);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-lg font-semibold">Messages</h1>
        <p className="text-xs text-muted-foreground">Voicemail-style captures, routed to staff by urgency.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
        <CardContent className="p-3">
          {list.length === 0 ? <EmptyState title="No messages yet." /> : (
            <ul className="space-y-2">
              {list.map((m) => (
                <li key={m.id} className="border border-border rounded-md p-3 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.customer_name ?? "(anonymous)"}</span>
                      {m.customer_phone && <span className="text-[11px] text-muted-foreground font-mono">{m.customer_phone}</span>}
                    </div>
                    <Badge variant={m.urgency === "urgent" || m.urgency === "high" ? "danger" : "muted"}>{m.urgency}</Badge>
                  </div>
                  <p className="text-sm mt-1">{m.body}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                    <span>{m.routed_to ? `Routed to ${staffById.get(m.routed_to) ?? "staff"}` : "Unrouted"}</span>
                    <span className="flex items-center gap-2">
                      <span>{relativeTime(m.created_at)}</span>
                      {m.call_id && <Link href={`/calls/${m.call_id}`} className="underline">call</Link>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
