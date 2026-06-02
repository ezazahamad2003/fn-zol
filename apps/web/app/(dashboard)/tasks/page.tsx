import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/utils";
import type { Task, Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No tenant." /></div>;

  const supabase = supabaseServer();
  const [{ data: tasks }, { data: staff }] = await Promise.all([
    supabase.from("tasks").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
    supabase.from("staff").select("*").eq("tenant_id", tenant.id),
  ]);

  const staffById = new Map((staff as Staff[] | null ?? []).map((s) => [s.id, s.name]));
  const open = (tasks as Task[] | null ?? []).filter((t) => t.status === "open");
  const done = (tasks as Task[] | null ?? []).filter((t) => t.status === "done");

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-lg font-semibold">Tasks</h1>
        <p className="text-xs text-muted-foreground">Follow-ups extracted from calls or created via create_task.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskColumn title={`Open (${open.length})`} tasks={open} staffById={staffById} />
        <TaskColumn title={`Done (${done.length})`} tasks={done} staffById={staffById} />
      </div>
    </div>
  );
}

function TaskColumn({ title, tasks, staffById }: { title: string; tasks: Task[]; staffById: Map<string, string> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-3 space-y-2">
        {tasks.length === 0 && <EmptyState title="Nothing here." />}
        {tasks.map((t) => (
          <div key={t.id} className="border border-border rounded-md p-3 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm">{t.title}</div>
              <Badge variant={t.status === "done" ? "success" : "muted"}>{t.status}</Badge>
            </div>
            {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
            <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-muted-foreground">
              <span>{t.assigned_to ? staffById.get(t.assigned_to) ?? "(staff)" : "Unassigned"}</span>
              <span className="flex items-center gap-2">
                <span>{relativeTime(t.created_at)}</span>
                {t.call_id && <Link href={`/calls/${t.call_id}`} className="underline">call</Link>}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
