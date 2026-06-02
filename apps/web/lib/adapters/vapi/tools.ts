// VAPI function-tool definitions — the in-call brain calls these, and VAPI
// POSTs each invocation to the tool's `server.url` (our vapi-tool edge
// function). Schemas mirror the input types in apps/web/lib/tools/types.ts.

type VapiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
  server: { url: string; secret?: string };
};

export function buildVapiTools(toolWebhookUrl: string, secret?: string): VapiTool[] {
  const server = secret ? { url: toolWebhookUrl, secret } : { url: toolWebhookUrl };
  const fn = (
    name: string,
    description: string,
    properties: Record<string, unknown>,
    required: string[] = [],
  ): VapiTool => ({
    type: "function",
    function: { name, description, parameters: { type: "object", properties, required } },
    server,
  });

  return [
    fn(
      "check_availability",
      "Find open appointment slots before offering times to the caller.",
      {
        date_range: {
          type: "object",
          description: "ISO start/end of the window to search.",
          properties: { start: { type: "string" }, end: { type: "string" } },
          required: ["start", "end"],
        },
        staff_role: { type: "string", description: "Limit to a role, e.g. 'sales'." },
        staff_id: { type: "string", description: "Limit to a specific staff member." },
        slot_minutes: { type: "number", description: "Slot length in minutes (default 15)." },
      },
      ["date_range"],
    ),
    fn(
      "book_appointment",
      "Book an appointment on the calendar once the caller has chosen a time.",
      {
        customer_name: { type: "string" },
        customer_phone: { type: "string" },
        start_at: { type: "string", description: "ISO start time." },
        end_at: { type: "string", description: "ISO end time (optional; defaults to +15m)." },
        purpose: { type: "string", description: "What the appointment is for." },
        staff_id: { type: "string" },
        staff_role: { type: "string" },
      },
      ["customer_name", "start_at"],
    ),
    fn(
      "route_call",
      "Transfer the caller to the right staff member. Returns a number to dial.",
      {
        staff_role: { type: "string", description: "e.g. 'sales', 'billing', 'owner'." },
        staff_name: { type: "string", description: "Name of the person to reach." },
      },
    ),
    fn(
      "capture_message",
      "Take a message when no one is available. Mark urgency so it routes correctly.",
      {
        customer_name: { type: "string" },
        customer_phone: { type: "string" },
        body: { type: "string", description: "The message content." },
        urgency: { type: "string", enum: ["low", "normal", "high", "urgent"] },
        staff_role: { type: "string", description: "Who the message is for." },
      },
      ["body"],
    ),
    fn(
      "create_task",
      "Create a follow-up task so nothing gets missed after the call.",
      {
        title: { type: "string" },
        description: { type: "string" },
        assigned_to: { type: "string", description: "Staff id to assign (optional)." },
        due_at: { type: "string", description: "ISO due date (optional)." },
      },
      ["title"],
    ),
  ];
}
