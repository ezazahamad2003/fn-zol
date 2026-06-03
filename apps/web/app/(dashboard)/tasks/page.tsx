import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";
import type { Task, Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No business." /></div>;

  const supabase = supabaseServer();
  const [{ data: tasks }, { data: staff }] = await Promise.all([
    supabase.from("tasks").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
    supabase.from("staff").select("*").eq("tenant_id", tenant.id),
  ]);

  const staffById = new Map((staff as Staff[] | null ?? []).map((s) => [s.id, s.name]));
  const all = (tasks as Task[] | null ?? []);
  const open = all.filter((t) => t.status === "open");
  const done = all.filter((t) => t.status === "done");

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Follow-ups created from calls.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric label="Open" value={open.length} tone="warning" />
        <Metric label="Done" value={done.length} tone="success" />
        <Metric label="Total" value={all.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskColumn title="Open" tasks={open} staffById={staffById} />
        <TaskColumn title="Done" tasks={done} staffById={staffById} />
      </div>
    </div>
  );
}

function TaskColumn({ title, tasks, staffById }: { title: string; tasks: Task[]; staffById: Map<string, string> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <div className="p-4"><EmptyState title="Nothing here." /></div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((t) => (
              <div key={t.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{t.title}</div>
                    {t.description && <p className="text-xs leading-5 text-muted-foreground mt-1">{t.description}</p>}
                  </div>
                  <Badge variant={t.status === "done" ? "success" : "warning"}>{t.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 text-[11px] text-muted-foreground">
                  <span>{t.assigned_to ? staffById.get(t.assigned_to) ?? "(staff)" : "Unassigned"}</span>
                  <span className="flex items-center gap-2">
                    <span>{relativeTime(t.created_at)}</span>
                    {t.call_id && <Link href={`/calls/${t.call_id}`} className="underline">call</Link>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" }) {
  const color = tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
