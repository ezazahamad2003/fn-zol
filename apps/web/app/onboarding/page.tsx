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
      <main className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Your voice agent is live 🎉</CardTitle>
            <CardDescription>Callers reach your agent at this number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-mono font-semibold text-center py-4">
              {done.phone ?? "(number pending)"}
            </div>
            <p className="text-xs text-muted-foreground">
              You can edit the personality, greeting, and voice anytime in Settings —
              changes go live on your next call.
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
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-xl my-8">
        <CardHeader>
          <CardTitle>Set up your voice agent</CardTitle>
          <CardDescription>Name your business, shape how it sounds, and we'll give you a phone number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Acme Apparel" required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="voice">Voice</Label>
              <select id="voice" value={voicePreset} onChange={(e) => setVoicePreset(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                {VOICE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {VOICE_PRESETS.find((p) => p.id === voicePreset)?.description}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="model">In-call intelligence</Label>
              <select id="model" value={model} onChange={(e) => setModel(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                {MODEL_PRESETS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="first">Greeting (first thing callers hear)</Label>
              <Textarea id="first" value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} rows={2} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prompt">Personality &amp; instructions</Label>
              <Textarea id="prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={10}
                className="font-mono text-xs" />
              <p className="text-[11px] text-muted-foreground">You can keep editing this later in Settings.</p>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating your agent…" : "Create agent & get my number"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
