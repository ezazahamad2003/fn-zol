import { normalizeBookingConfig, describeHours } from "@/lib/booking";

// Routing rules compile into the agent's prompt so they stay point-and-click in
// the UI but reach the model as plain instructions.
export type RoutingRule = { intent: string; role: string };

export function normalizeRoutingRules(raw: unknown): RoutingRule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => ({ intent: String((r as RoutingRule)?.intent ?? "").trim(), role: String((r as RoutingRule)?.role ?? "").trim() }))
    .filter((r) => r.intent && r.role)
    .slice(0, 30);
}

// Build the full system prompt sent to VAPI: the owner's personality text, plus
// generated sections for routing rules and booking hours. The owner only ever
// edits the base personality; routing + hours are managed in their own panels.
export function composeSystemPrompt(input: {
  systemPrompt: string | null | undefined;
  bookingConfig: unknown;
  routingRules: unknown;
}): string {
  const parts: string[] = [(input.systemPrompt ?? "").trim()];

  const rules = normalizeRoutingRules(input.routingRules);
  if (rules.length > 0) {
    parts.push(
      "# Call routing\n" +
        "When the caller's need matches one of these, call the route_call tool with the matching role:\n" +
        rules.map((r) => `- If the caller ${r.intent} → route to "${r.role}".`).join("\n"),
    );
  }

  const cfg = normalizeBookingConfig(input.bookingConfig);
  parts.push("# Booking hours\n" + describeHours(cfg));

  return parts.filter(Boolean).join("\n\n");
}
