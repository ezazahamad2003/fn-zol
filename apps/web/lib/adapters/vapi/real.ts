import type { VapiAdapter, VapiAssistantConfig, ProvisionedTenantVapi } from "@/lib/adapters/types";

// TODO: wire real VAPI.
// Reference: https://docs.vapi.ai/api-reference
//
// Provisioning flow at tenant onboarding:
//   1. POST /assistant       — create assistant (model, voice, systemPrompt, toolIds)
//   2. POST /phone-number    — buy or attach a Twilio/VAPI number
//   3. PATCH /phone-number/:id — bind that number to the assistant
//   4. Return the three ids — they get persisted to tenants.{vapi_assistant_id,
//      vapi_phone_number, vapi_phone_id}.

export const vapiReal: VapiAdapter = {
  async provisionTenant(_input: VapiAssistantConfig): Promise<ProvisionedTenantVapi> {
    throw new Error("vapiReal.provisionTenant not implemented — set USE_STUBS=true or wire VAPI");
  },

  async updateAssistant(_assistantId, _input) {
    throw new Error("vapiReal.updateAssistant not implemented — set USE_STUBS=true or wire VAPI");
  },
};
