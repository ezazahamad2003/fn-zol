import { supabaseServer } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, EmptyState } from "@/components/ui/primitives";
import { DevTriggerPanel } from "@/components/dev-trigger-panel";
import { PhoneLineCard } from "@/components/settings/phone-line-card";
import { AgentForm } from "@/components/settings/agent-form";
import { StaffManager } from "@/components/settings/staff-manager";
import { BookingForm } from "@/components/settings/booking-form";
import { RoutingForm } from "@/components/settings/routing-form";
import { getConnection, googleConfigured } from "@/lib/google/oauth";
import { normalizeBookingConfig } from "@/lib/booking";
import { normalizeRoutingRules } from "@/lib/agent-prompt";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_FIRST_MESSAGE, DEFAULT_VOICE_PRESET_ID } from "@/lib/voice-presets";
import type { Staff } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { google?: string } }) {
  const tenant = await getActiveTenant();
  if (!tenant) return <div className="p-6"><EmptyState title="No business." /></div>;

  const supabase = supabaseServer();
  const { data: staff } = await supabase.from("staff").select("*").eq("tenant_id", tenant.id).order("role");
  const list = (staff as Staff[] | null ?? []);
  const voicePreset = (tenant.voice_config?.preset as string | undefined) ?? DEFAULT_VOICE_PRESET_ID;
  const bookingConfig = normalizeBookingConfig(tenant.booking_config);
  const routingRules = normalizeRoutingRules(tenant.routing_rules);
  const roles = Array.from(new Set(list.map((s) => s.role).filter(Boolean)));

  const gConfigured = googleConfigured();
  const gConn = gConfigured ? await getConnection(tenant.id) : null;
  const gFlash = searchParams?.google;

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <header>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">Your agent's personality, voice, and staff routing.</p>
      </header>

      <PhoneLineCard
        businessName={tenant.name}
        phoneNumber={tenant.vapi_phone_number}
        assistantId={tenant.vapi_assistant_id}
        phoneId={tenant.vapi_phone_id}
      />

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>Connect Google so the agent can check availability and book appointments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!gConfigured ? (
            <p className="text-xs text-muted-foreground">
              Calendar isn't configured on this deployment yet. Add the <code>GOOGLE_*</code> environment
              variables to enable it.
            </p>
          ) : gConn ? (
            <div className="flex items-center gap-2">
              <Badge variant="success">connected</Badge>
              <span className="text-muted-foreground">{gConn.google_email ?? "Google account linked"}</span>
              <a href="/api/google/connect"><Button size="sm" variant="outline">Reconnect</Button></a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a href="/api/google/connect"><Button size="sm">Connect Google Calendar</Button></a>
              {gFlash === "error" && <span className="text-xs text-red-600">Connection failed — try again.</span>}
              {gFlash === "forbidden" && <span className="text-xs text-red-600">Not allowed for this business.</span>}
            </div>
          )}
          {gFlash === "connected" && <p className="text-xs text-emerald-700">Google Calendar connected.</p>}
          <p className="text-[11px] text-muted-foreground">
            Add each staff member's calendar id (their Google email) under Staff &amp; routing below.
          </p>
        </CardContent>
      </Card>

      <AgentForm
        systemPrompt={tenant.system_prompt ?? DEFAULT_SYSTEM_PROMPT}
        firstMessage={tenant.first_message ?? DEFAULT_FIRST_MESSAGE}
        voicePreset={voicePreset}
        model={tenant.model}
        hasAssistant={Boolean(tenant.vapi_assistant_id)}
      />

      <StaffManager staff={list} />

      <BookingForm config={bookingConfig} />

      <RoutingForm rules={routingRules} roles={roles} />

      <DevTriggerPanel tenantId={tenant.id} staff={list.map((s) => ({ id: s.id, name: s.name, role: s.role }))} />
    </div>
  );
}
