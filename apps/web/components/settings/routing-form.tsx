"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from "@/components/ui/primitives";
import { updateRoutingRules } from "@/app/(dashboard)/settings/actions";
import type { RoutingRule } from "@/lib/agent-prompt";

export function RoutingForm({ rules, roles }: { rules: RoutingRule[]; roles: string[] }) {
  const router = useRouter();
  const [list, setList] = useState<RoutingRule[]>(rules.length ? rules : [{ intent: "", role: "" }]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);

  const setRow = (i: number, patch: Partial<RoutingRule>) =>
    setList(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setList([...list, { intent: "", role: "" }]);
  const removeRow = (i: number) => setList(list.filter((_, idx) => idx !== i));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setStatus(null);
    const clean = list.filter((r) => r.intent.trim() && r.role.trim());
    const res = await updateRoutingRules(clean);
    setPending(false);
    if (res.ok) { setStatus({ kind: "ok", msg: "Routing rules saved and pushed live." }); router.refresh(); }
    else setStatus({ kind: "error", msg: res.error });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call routing rules</CardTitle>
        <CardDescription>Tell the agent who to transfer to. &quot;If the caller… → route to a role.&quot; Roles come from your staff.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-3">
          {list.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">If the caller</span>
              <Input value={r.intent} onChange={(e) => setRow(i, { intent: e.target.value })}
                placeholder="asks about billing or an invoice" className="flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">→ route to</span>
              <input list="routing-roles" value={r.role} onChange={(e) => setRow(i, { role: e.target.value })}
                placeholder="billing"
                className="flex h-9 w-36 rounded-md border border-border bg-background px-3 text-sm" />
              <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(i)}>✕</Button>
            </div>
          ))}
          <datalist id="routing-roles">{roles.map((r) => <option key={r} value={r} />)}</datalist>

          <div className="flex items-center gap-3">
            <Button type="button" size="sm" variant="outline" onClick={addRow}>+ Add rule</Button>
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save rules"}</Button>
            {status && <span className={status.kind === "ok" ? "text-xs text-emerald-700" : "text-xs text-red-600"}>{status.msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
