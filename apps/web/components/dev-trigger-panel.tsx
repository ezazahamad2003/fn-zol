"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui/primitives";

const PRESETS: Record<string, (staffId: string) => Record<string, unknown>> = {
  check_availability: () => ({
    date_range: { start: new Date().toISOString(), end: new Date(Date.now() + 7 * 86400_000).toISOString() },
    staff_role: "sales",
  }),
  book_appointment: (staffId) => ({
    customer_name: "Dev Tester",
    customer_phone: "+15555550000",
    start_at: new Date(Date.now() + 86400_000).toISOString(),
    purpose: "Triggered from /settings dev panel",
    staff_id: staffId,
  }),
  route_call: () => ({ staff_role: "sales" }),
  capture_message: () => ({
    customer_name: "Dev Tester",
    customer_phone: "+15555550000",
    body: "Test message from the dev panel.",
    urgency: "normal",
  }),
  create_task: () => ({
    title: "Test task from dev panel",
    description: "Manually triggered.",
  }),
};

export function DevTriggerPanel({ tenantId, staff }: { tenantId: string; staff: { id: string; name: string; role: string }[] }) {
  const [tool, setTool] = useState<keyof typeof PRESETS>("capture_message");
  const firstStaff = staff[0]?.id ?? "";
  const [args, setArgs] = useState(JSON.stringify(PRESETS[tool](firstStaff), null, 2));
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onSelectTool(next: keyof typeof PRESETS) {
    setTool(next);
    setArgs(JSON.stringify(PRESETS[next](firstStaff), null, 2));
    setResult(null);
  }

  async function fire() {
    setPending(true); setResult(null);
    try {
      const parsed = JSON.parse(args);
      const r = await fetch("/api/dev/trigger", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, tool, args: parsed }),
      });
      const body = await r.json();
      setResult(JSON.stringify(body, null, 2));
    } catch (e) {
      setResult(`error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dev: trigger a tool</CardTitle>
        <CardDescription>
          Fires the tool against the stub adapters, logs a tool_calls row, and writes the resulting
          rows. Same code path the VAPI webhook uses in production.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((t) => (
            <Button key={t} size="sm" variant={t === tool ? "default" : "outline"} onClick={() => onSelectTool(t)}>
              {t}
            </Button>
          ))}
        </div>
        <div className="space-y-1">
          <Label htmlFor="args">args (JSON)</Label>
          <Textarea id="args" value={args} onChange={(e) => setArgs(e.target.value)} className="font-mono text-xs h-40" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fire} disabled={pending}>{pending ? "Firing…" : "Fire tool"}</Button>
          <Input value={tenantId} readOnly className="font-mono text-xs flex-1" />
        </div>
        {result && (
          <pre className="text-xs font-mono whitespace-pre-wrap break-words border border-border rounded-md p-3 bg-muted/40">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
