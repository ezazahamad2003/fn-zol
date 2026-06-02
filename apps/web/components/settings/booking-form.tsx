"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Label, Input } from "@/components/ui/primitives";
import { updateBookingConfig } from "@/app/(dashboard)/settings/actions";
import { DAY_ORDER, DAY_LABEL, COMMON_TIMEZONES, type BookingConfig, type DayKey } from "@/lib/booking";

const SLOT_OPTIONS = [15, 30, 45, 60];
const fieldCls = "flex h-9 rounded-md border border-border bg-background px-2 text-sm";

export function BookingForm({ config }: { config: BookingConfig }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<BookingConfig>(config);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);

  function setDay(day: DayKey, patch: Partial<BookingConfig["days"][DayKey]>) {
    setCfg({ ...cfg, days: { ...cfg.days, [day]: { ...cfg.days[day], ...patch } } });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setStatus(null);
    const res = await updateBookingConfig(cfg);
    setPending(false);
    if (res.ok) { setStatus({ kind: "ok", msg: "Booking hours saved." }); router.refresh(); }
    else setStatus({ kind: "error", msg: res.error });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business hours &amp; booking</CardTitle>
        <CardDescription>When the agent is allowed to book appointments. Slots outside these hours are never offered.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Timezone</Label>
              <select value={cfg.timezone} onChange={(e) => setCfg({ ...cfg, timezone: e.target.value })} className={`${fieldCls} w-full`}>
                {COMMON_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                {!COMMON_TIMEZONES.includes(cfg.timezone) && <option value={cfg.timezone}>{cfg.timezone}</option>}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Appointment length</Label>
              <select value={cfg.slotMinutes} onChange={(e) => setCfg({ ...cfg, slotMinutes: Number(e.target.value) })} className={`${fieldCls} w-full`}>
                {SLOT_OPTIONS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                {!SLOT_OPTIONS.includes(cfg.slotMinutes) && <option value={cfg.slotMinutes}>{cfg.slotMinutes} minutes</option>}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {DAY_ORDER.map((day) => {
              const d = cfg.days[day];
              return (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-32 text-sm">
                    <input type="checkbox" checked={d.open} onChange={(e) => setDay(day, { open: e.target.checked })} />
                    {DAY_LABEL[day]}
                  </label>
                  <Input type="time" value={d.start} disabled={!d.open} onChange={(e) => setDay(day, { start: e.target.value })} className="w-32 disabled:opacity-40" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="time" value={d.end} disabled={!d.open} onChange={(e) => setDay(day, { end: e.target.value })} className="w-32 disabled:opacity-40" />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save hours"}</Button>
            {status && <span className={status.kind === "ok" ? "text-xs text-emerald-700" : "text-xs text-red-600"}>{status.msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
