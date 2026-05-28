import type { VapiAdapter, VapiAssistantConfig, ProvisionedTenantVapi } from "@/lib/adapters/types";

let counter = 0;
const nextId = (prefix: string) => `stub-${prefix}-${Date.now()}-${++counter}`;

export const vapiStub: VapiAdapter = {
  async provisionTenant(_input: VapiAssistantConfig): Promise<ProvisionedTenantVapi> {
    return {
      vapi_assistant_id: nextId("assistant"),
      vapi_phone_number: `+1555555${String(1000 + counter).padStart(4, "0")}`,
      vapi_phone_id:     nextId("phone"),
    };
  },

  async updateAssistant(_assistantId, _input) {
    // no-op in stub mode
  },
};
