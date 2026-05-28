import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, EmptyState } from "@/components/ui/primitives";
import { DevTriggerPanel } from "@/components/dev-trigger-panel";
import type { Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No tenant." /></div>;

  const supabase = supabaseAdmin();
  const { data: staff } = await supabase.from("staff").select("*").eq("tenant_id", tenant.id).order("role");
  const list = (staff as Staff[] | null ?? []);

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <header>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">Tenant config, voice agent personality, staff routing.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>VAPI assistant</CardTitle>
          <CardDescription>Per-tenant credentials — provisioned at onboarding, stored on the tenants row.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <KV k="Tenant name"        v={tenant.name} />
          <KV k="Tenant slug"        v={tenant.slug} />
          <KV k="Model"              v={tenant.model} />
          <KV k="Inbound number"     v={tenant.vapi_phone_number ?? "(not provisioned)"} />
          <KV k="VAPI assistant id"  v={tenant.vapi_assistant_id ?? "(not provisioned)"} />
          <KV k="VAPI phone id"      v={tenant.vapi_phone_id ?? "(not provisioned)"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System prompt</CardTitle>
          <CardDescription>The agent's personality. Pushed to VAPI on update (see VapiAdapter.updateAssistant).</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap font-mono border border-border rounded-md p-3 bg-muted/40 max-h-[360px] overflow-auto">
            {tenant.system_prompt ?? "(empty)"}
          </pre>
          {/* TODO: replace with an editable form — on submit, update tenants.system_prompt
              and call adapters.vapi.updateAssistant(tenant.vapi_assistant_id, { systemPrompt }). */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff &amp; routing</CardTitle>
          <CardDescription>Targets for route_call, capture_message routing, and book_appointment.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? <EmptyState title="No staff yet." /> : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Name</th>
                  <th className="text-left font-medium px-4 py-2">Role</th>
                  <th className="text-left font-medium px-4 py-2">Phone</th>
                  <th className="text-left font-medium px-4 py-2">Calendar</th>
                  <th className="text-left font-medium px-4 py-2">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2 capitalize">{s.role}</td>
                    <td className="px-4 py-2 font-mono text-xs">{s.phone ?? "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{s.google_calendar_id ?? "—"}</td>
                    <td className="px-4 py-2">{s.is_active ? <Badge variant="success">on</Badge> : <Badge variant="muted">off</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <DevTriggerPanel tenantId={tenant.id} staff={list.map((s) => ({ id: s.id, name: s.name, role: s.role }))} />
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-mono text-xs break-all">{v}</div>
    </div>
  );
}
