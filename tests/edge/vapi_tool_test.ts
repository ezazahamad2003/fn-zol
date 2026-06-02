// Fix #4: one tool whose bookkeeping write rejects must not take down the
// whole batch (which would 500 and make VAPI retry the entire webhook).
import { assertEquals, assert } from "jsr:@std/assert";
import { handleToolCall } from "../../supabase/functions/vapi-tool/index.ts";
import { makeMockSupabase, vapiRequest, type QuerySpec } from "../helpers/mock_supabase.ts";

function stubAuthEnv() {
  Deno.env.set("USE_STUBS", "true");
  Deno.env.delete("VAPI_WEBHOOK_SECRET");
}

function baseResponder(s: QuerySpec): { data: unknown; error: unknown } {
  if (s.table === "tenants") return { data: { id: "tenant-1", name: "Acme" }, error: null };
  if (s.table === "calls") return { data: { id: "call-1", status: "in_progress" }, error: null };
  if (s.table === "tasks" && s.op === "insert") return { data: { id: "task-1" }, error: null };
  if (s.table === "tool_calls") return { data: null, error: null };
  return { data: null, error: null };
}

function payload(toolCalls: { id: string; name: string; args: Record<string, unknown> }[]) {
  return {
    message: {
      type: "tool-calls",
      assistant: { id: "asst-1" },
      call: { id: "vapi-call-1", customer: { number: "+15551112222" } },
      toolCalls: toolCalls.map((t) => ({ id: t.id, function: { name: t.name, arguments: t.args } })),
    },
  };
}

Deno.test("two successful tool calls both return results (200)", async () => {
  stubAuthEnv();
  const db = makeMockSupabase(baseResponder);
  const req = vapiRequest(payload([
    { id: "tc-1", name: "create_task", args: { title: "Task A" } },
    { id: "tc-2", name: "create_task", args: { title: "Task B" } },
  ]));
  // deno-lint-ignore no-explicit-any
  const res = await handleToolCall(req, db.client as any);
  assertEquals(res.status, 200);
  const body = await res.json() as { results: { toolCallId: string; result?: unknown; error?: string }[] };
  assertEquals(body.results.length, 2);
  assert(body.results.every((r) => r.result && !r.error));
});

Deno.test("a tool whose DB write REJECTS is isolated — batch still returns 200 with a per-tool error", async () => {
  stubAuthEnv();
  // Make the dedup SELECT for tc-bad reject (simulates a transient DB blip),
  // which would otherwise reject Promise.all and 500 the whole webhook.
  const responder = (s: QuerySpec) => {
    if (s.table === "tool_calls" && s.op === "select") {
      const id = s.filters.find((f) => f.method === "eq")?.args?.[1];
      if (id === "tc-bad") throw new Error("connection reset");
    }
    return baseResponder(s);
  };
  const db = makeMockSupabase(responder);
  const req = vapiRequest(payload([
    { id: "tc-good", name: "create_task", args: { title: "Good" } },
    { id: "tc-bad", name: "create_task", args: { title: "Bad" } },
  ]));
  // deno-lint-ignore no-explicit-any
  const res = await handleToolCall(req, db.client as any);

  assertEquals(res.status, 200); // NOT 500 — the key guarantee
  const body = await res.json() as { results: { toolCallId: string; result?: unknown; error?: string }[] };
  assertEquals(body.results.length, 2);
  const good = body.results.find((r) => r.toolCallId === "tc-good")!;
  const bad = body.results.find((r) => r.toolCallId === "tc-bad")!;
  assert(good.result && !good.error, "good tool succeeded");
  assert(bad.error, "bad tool surfaced an error instead of crashing the batch");
});

Deno.test("rejects unauthorized requests in production mode", async () => {
  Deno.env.set("USE_STUBS", "false");
  Deno.env.set("VAPI_WEBHOOK_SECRET", "real-secret");
  try {
    const db = makeMockSupabase(baseResponder);
    const req = vapiRequest(payload([{ id: "tc-1", name: "create_task", args: { title: "X" } }]), { secret: "wrong" });
    // deno-lint-ignore no-explicit-any
    const res = await handleToolCall(req, db.client as any);
    assertEquals(res.status, 401);
    // no DB work happened
    assertEquals(db.calls.length, 0);
  } finally {
    Deno.env.set("USE_STUBS", "true");
    Deno.env.delete("VAPI_WEBHOOK_SECRET");
  }
});

Deno.test("returns 404 when no tenant matches the inbound assistant/phone", async () => {
  stubAuthEnv();
  const db = makeMockSupabase((s) => {
    if (s.table === "tenants") return { data: null, error: null }; // no match
    return baseResponder(s);
  });
  const req = vapiRequest(payload([{ id: "tc-1", name: "create_task", args: { title: "X" } }]));
  // deno-lint-ignore no-explicit-any
  const res = await handleToolCall(req, db.client as any);
  assertEquals(res.status, 404);
});
