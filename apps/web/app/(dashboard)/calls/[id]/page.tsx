import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { Transcript } from "@/components/transcript";
import { RunTrace } from "@/components/run-trace";
import { callDuration, formatDateTime } from "@/lib/utils";
import type { Appointment, Call, Message, Task, ToolCall } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: call } = await supabase.from("calls").select("*").eq("id", params.id).maybeSingle();
  if (!call) notFound();
  const c = call as Call;

  const [{ data: toolCalls }, { data: tasks }, { data: appointments }, { data: messages }] = await Promise.all([
    supabase.from("tool_calls").select("*").eq("call_id", c.id).order("created_at", { ascending: true }),
    supabase.from("tasks")      .select("*").eq("call_id", c.id).order("created_at", { ascending: true }),
    supabase.from("appointments").select("*").eq("call_id", c.id).order("start_at", { ascending: true }),
    supabase.from("messages")   .select("*").eq("call_id", c.id).order("created_at", { ascending: true }),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:underline">Back to calls</Link>
          <h1 className="text-2xl font-semibold mt-2">
            <span className="font-mono">{c.caller_number ?? "(unknown caller)"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateTime(c.started_at)} / {callDuration(c.started_at, c.ended_at)}
          </p>
        </div>
        <Badge variant={c.status === "completed" ? "success" : c.status === "failed" ? "danger" : "warning"}>
          {c.status}
        </Badge>
      </div>

      {c.summary && (
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6">{c.summary}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Transcript</CardTitle></CardHeader>
          <CardContent className="p-4"><Transcript value={c.transcript} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Run trace</CardTitle></CardHeader>
          <CardContent className="p-4"><RunTrace toolCalls={(toolCalls ?? []) as ToolCall[]} /></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OutcomeCard title="Appointments" count={(appointments ?? []).length}>
          {(appointments ?? []).length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
          {(appointments as Appointment[] | null)?.map((a) => (
            <div key={a.id} className="py-3 border-b border-border last:border-0">
              <div className="font-medium">{a.customer_name}</div>
              <div className="text-xs text-muted-foreground">{formatDateTime(a.start_at)} to {formatDateTime(a.end_at)}</div>
              {a.purpose && <div className="text-xs mt-1">{a.purpose}</div>}
              {a.google_event_id && <div className="text-[10px] text-muted-foreground font-mono mt-1">gcal {a.google_event_id}</div>}
            </div>
          ))}
        </OutcomeCard>

        <OutcomeCard title="Tasks" count={(tasks ?? []).length}>
          {(tasks ?? []).length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
          {(tasks as Task[] | null)?.map((t) => (
            <div key={t.id} className="py-3 border-b border-border last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t.title}</span>
                <Badge variant={t.status === "done" ? "success" : "muted"}>{t.status}</Badge>
              </div>
              {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
            </div>
          ))}
        </OutcomeCard>

        <OutcomeCard title="Messages" count={(messages ?? []).length}>
          {(messages ?? []).length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
          {(messages as Message[] | null)?.map((m) => (
            <div key={m.id} className="py-3 border-b border-border last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{m.customer_name ?? "(anonymous)"}</span>
                <Badge variant={m.urgency === "urgent" || m.urgency === "high" ? "danger" : "muted"}>{m.urgency}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{m.body}</div>
              {m.customer_phone && <div className="text-[10px] text-muted-foreground font-mono mt-1">{m.customer_phone}</div>}
            </div>
          ))}
        </OutcomeCard>
      </div>
    </div>
  );
}

function OutcomeCard({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} ({count})</CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm">
        {children}
      </CardContent>
    </Card>
  );
}
