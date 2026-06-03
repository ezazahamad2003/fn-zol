import type { VapiAdapter, VapiAssistantConfig, VapiVoice, ProvisionedTenantVapi } from "@/lib/adapters/types";
import { env } from "@/lib/env";
import { buildVapiTools } from "@/lib/adapters/vapi/tools";
import { fetchWithRetry } from "@/lib/http";

// Real VAPI integration. Docs: https://docs.vapi.ai/api-reference
//
// Provisioning a tenant = create an assistant (model + Flux transcriber + voice
// + our 5 tools + low-latency speaking plans), then create a free VAPI phone
// number bound to that assistant. Tool calls are POSTed to the vapi-tool edge
// function (per-tool server.url); the end-of-call report goes to the assistant
// server.url (vapi-end-of-call).

const VAPI_BASE = "https://api.vapi.ai";

async function vapiFetch(path: string, init: RequestInit): Promise<any> {
  const key = env.vapiApiKey();
  if (!key) throw new Error("VAPI_API_KEY is not set");
  const res = await fetchWithRetry(`${VAPI_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  }, { timeoutMs: 20_000, retries: 2 });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const detail = body?.message ?? body?.error ?? text;
    throw new Error(`VAPI ${init.method} ${path} failed (${res.status}): ${JSON.stringify(detail)}`);
  }
  return body;
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return { raw: s }; }
}

function voiceBlock(voice: VapiVoice) {
  return {
    provider: voice.provider,
    voiceId: voice.voiceId,
    ...(voice.model ? { model: voice.model } : {}),
  };
}

// The assistant payload. Tuned for ~500ms, natural turn-taking.
function assistantPayload(input: VapiAssistantConfig) {
  const base = env.functionsBase();
  const secret = env.vapiWebhookSecret() || undefined;

  return {
    name: input.name,
    firstMessage: input.firstMessage ?? "Hello! How can I help you today?",
    model: {
      provider: "openai",
      model: input.model,
      temperature: 0.5,
      messages: [{ role: "system", content: input.systemPrompt }],
      tools: buildVapiTools(`${base}/vapi-tool`, secret),
    },
    voice: voiceBlock(input.voice),
    transcriber: {
      // Deepgram Flux: built-in turn detection + ultra-low latency.
      provider: "deepgram",
      model: "flux-general-en",
      language: "en",
    },
    // Low-latency turn-taking.
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingPlan: { provider: "vapi" },
    },
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.2,
      backoffSeconds: 1.0,
    },
    backgroundDenoisingEnabled: true,
    // End-of-call report → vapi-end-of-call edge function.
    server: {
      url: `${base}/vapi-end-of-call`,
      ...(secret ? { secret } : {}),
    },
    serverMessages: ["end-of-call-report"],
  };
}

export const vapiReal: VapiAdapter = {
  async provisionTenant(input: VapiAssistantConfig): Promise<ProvisionedTenantVapi> {
    // 1. Create the assistant.
    const assistant = await vapiFetch("/assistant", {
      method: "POST",
      body: JSON.stringify(assistantPayload(input)),
    });
    const assistantId = assistant?.id as string | undefined;
    if (!assistantId) throw new Error("VAPI assistant create returned no id");

    // 2. Create a free VAPI phone number bound to the assistant.
    const phone = await vapiFetch("/phone-number", {
      method: "POST",
      body: JSON.stringify({
        provider: "vapi",
        name: `${input.name} — main line`,
        assistantId,
      }),
    });
    const phoneId = phone?.id as string | undefined;
    const phoneNumber = phone?.number as string | undefined;
    if (!phoneId || !phoneNumber) {
      throw new Error("VAPI phone-number create returned no id/number");
    }

    return {
      vapi_assistant_id: assistantId,
      vapi_phone_number: phoneNumber,
      vapi_phone_id: phoneId,
    };
  },

  async updateAssistant(assistantId: string, input: Partial<VapiAssistantConfig>): Promise<void> {
    if (!assistantId) throw new Error("updateAssistant: missing assistantId");
    const base = env.functionsBase();
    const secret = env.vapiWebhookSecret() || undefined;

    const patch: Record<string, unknown> = {};
    if (input.name) patch.name = input.name;
    if (input.firstMessage !== undefined) patch.firstMessage = input.firstMessage;
    if (input.voice) patch.voice = voiceBlock(input.voice);

    // Model / system prompt / tools all live under the `model` block, which
    // VAPI replaces wholesale — so resend tools + system prompt together.
    if (input.model || input.systemPrompt !== undefined) {
      patch.model = {
        provider: "openai",
        model: input.model ?? "gpt-4o",
        temperature: 0.5,
        ...(input.systemPrompt !== undefined
          ? { messages: [{ role: "system", content: input.systemPrompt }] }
          : {}),
        tools: buildVapiTools(`${base}/vapi-tool`, secret),
      };
    }

    if (Object.keys(patch).length === 0) return;
    await vapiFetch(`/assistant/${assistantId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
};
