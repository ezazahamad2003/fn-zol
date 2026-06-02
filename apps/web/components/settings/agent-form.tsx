"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Label, Textarea } from "@/components/ui/primitives";
import { VOICE_PRESETS, MODEL_PRESETS, DEFAULT_VOICE_PRESET_ID, DEFAULT_MODEL } from "@/lib/voice-presets";
import { updateAgent } from "@/app/(dashboard)/settings/actions";

export function AgentForm(props: {
  systemPrompt: string;
  firstMessage: string;
  voicePreset: string;
  model: string;
  hasAssistant: boolean;
}) {
  const router = useRouter();
  const [systemPrompt, setSystemPrompt] = useState(props.systemPrompt);
  const [firstMessage, setFirstMessage] = useState(props.firstMessage);
  const [voicePreset, setVoicePreset] = useState(props.voicePreset || DEFAULT_VOICE_PRESET_ID);
  const [model, setModel] = useState(props.model || DEFAULT_MODEL);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus(null);
    const res = await updateAgent({ systemPrompt, firstMessage, voicePreset, model });
    setPending(false);
    if (res.ok) {
      setStatus({ kind: "ok", msg: props.hasAssistant ? "Saved and pushed live to your agent." : "Saved." });
      router.refresh();
    } else {
      setStatus({ kind: "error", msg: res.error });
    }
  }

  const selFieldCls = "flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent personality &amp; voice</CardTitle>
        <CardDescription>Edit anytime — changes go live on your next call.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="voice">Voice</Label>
              <select id="voice" value={voicePreset} onChange={(e) => setVoicePreset(e.target.value)} className={selFieldCls}>
                {VOICE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {VOICE_PRESETS.find((p) => p.id === voicePreset)?.description}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="model">In-call intelligence</Label>
              <select id="model" value={model} onChange={(e) => setModel(e.target.value)} className={selFieldCls}>
                {MODEL_PRESETS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="first">Greeting</Label>
            <Textarea id="first" value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="prompt">Personality &amp; instructions</Label>
            <Textarea id="prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={12}
              className="font-mono text-xs" />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
            {status && (
              <span className={status.kind === "ok" ? "text-xs text-emerald-700" : "text-xs text-red-600"}>
                {status.msg}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
