"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Badge, EmptyState } from "@/components/ui/primitives";
import { upsertStaff, setStaffActive } from "@/app/(dashboard)/settings/actions";
import type { Staff } from "@/lib/db/types";

const EMPTY = { id: undefined as string | undefined, name: "", role: "", phone: "", email: "", googleCalendarId: "", isBookable: true };

export function StaffManager({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(s: Staff) {
    setError(null);
    setForm({
      id: s.id, name: s.name, role: s.role,
      phone: s.phone ?? "", email: s.email ?? "", googleCalendarId: s.google_calendar_id ?? "",
      isBookable: s.is_bookable,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await upsertStaff(form);
    setPending(false);
    if (!res.ok) { setError(res.error); return; }
    setForm({ ...EMPTY });
    router.refresh();
  }

  async function toggle(s: Staff) {
    await setStaffActive(s.id, !s.is_active);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff &amp; routing</CardTitle>
        <CardDescription>Who the agent can transfer to, take messages for, and book on a calendar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {staff.length === 0 ? <EmptyState title="No staff yet." hint="Add your first team member below." /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-2">Name</th>
                <th className="text-left font-medium py-2">Role</th>
                <th className="text-left font-medium py-2">Phone</th>
                <th className="text-left font-medium py-2">Calendar</th>
                <th className="text-left font-medium py-2">Bookable</th>
                <th className="text-left font-medium py-2">Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.name}</td>
                  <td className="py-2 capitalize">{s.role}</td>
                  <td className="py-2 font-mono text-xs">{s.phone ?? "—"}</td>
                  <td className="py-2 font-mono text-xs truncate max-w-[160px]">{s.google_calendar_id ?? "—"}</td>
                  <td className="py-2">{s.is_bookable ? <Badge variant="success">yes</Badge> : <Badge variant="muted">no</Badge>}</td>
                  <td className="py-2">{s.is_active ? <Badge variant="success">on</Badge> : <Badge variant="muted">off</Badge>}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => edit(s)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(s)}>{s.is_active ? "Disable" : "Enable"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={save} className="space-y-3 border-t border-border pt-4">
          <div className="text-xs font-medium">{form.id ? "Edit staff member" : "Add staff member"}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Name"  v={form.name}  onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Role"  v={form.role}  onChange={(v) => setForm({ ...form, role: v })} placeholder="sales / billing / owner" required />
            <Field label="Phone (for transfers)" v={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+15555550123" />
            <Field label="Email" v={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Google calendar id" v={form.googleCalendarId} onChange={(v) => setForm({ ...form, googleCalendarId: v })} placeholder="person@company.com" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} />
            Available for appointment booking
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : form.id ? "Update" : "Add"}</Button>
            {form.id && <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...EMPTY })}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field(props: { label: string; v: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label>{props.label}</Label>
      <Input value={props.v} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} required={props.required} />
    </div>
  );
}
