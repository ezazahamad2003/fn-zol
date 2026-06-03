"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBusiness } from "./actions";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Input, Label, Textarea,
} from "@/components/ui/primitives";
import {
  VOICE_PRESETS, DEFAULT_VOICE_PRESET_ID, MODEL_PRESETS, DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT, DEFAULT_FIRST_MESSAGE,
} from "@/lib/voice-presets";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [firstMessage, setFirstMessage] = useState(DEFAULT_FIRST_MESSAGE);
  const [voicePreset, setVoicePreset] = useState(DEFAULT_VOICE_PRESET_ID);
  const [model, setModel] = useState(DEFAULT_MODEL);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ phone: string | null } | null>(null);
  const canRetryInSettings = error?.startsWith("Business created, but provisioning");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createBusiness({ name, systemPrompt, firstMessage, voicePreset, model });
    setPending(false);
    if (!res.ok) { setError(res.error); return; }
    setDone({ phone: res.phoneNumber });
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Your voice agent is live</CardTitle>
            <CardDescription>Callers reach your agent at this number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-slate-50 text-2xl font-mono font-semibold text-center py-5">
              {done.phone ?? "(number pending)"}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              You can edit the personality, greeting, and voice anytime in Settings.
            </p>
            <Button className="w-full" onClick={() => { router.push("/dashboard"); router.refresh(); }}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader className="p-6">
          <CardTitle className="text-lg">Set up your voice agent</CardTitle>
          <CardDescription>Name the business, choose a voice, and set the first thing callers hear.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Acme Apparel" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="voice">Voice</Label>
                <select id="voice" value={voicePreset} onChange={(e) => setVoicePreset(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                  {VOICE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {VOICE_PRESETS.find((p) => p.id === voicePreset)?.description}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="model">In-call intelligence</Label>
                <select id="model" value={model} onChange={(e) => setModel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                  {MODEL_PRESETS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="first">Greeting</Label>
              <Textarea id="first" value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} rows={2} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prompt">Personality and instructions</Label>
              <Textarea id="prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={10}
                className="font-mono text-xs" />
              <p className="text-[11px] text-muted-foreground">You can keep editing this later in Settings.</p>
            </div>

            {error && (
              <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs text-rose-700">{error}</p>
                {canRetryInSettings && (
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/settings")}>
                    Open settings to retry
                  </Button>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating your agent..." : "Create agent and get my number"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
