// Fix #3: end-of-call must be idempotent. A VAPI retry must NOT create
// duplicate tasks. Implemented as a compare-and-swap on the call status.
import { assertEquals, assert } from "jsr:@std/assert";
import { handleEndOfCall } from "../../supabase/functions/vapi-end-of-call/index.ts";
import { makeMockSupabase, vapiRequest, type QuerySpec } from "../helpers/mock_supabase.ts";

function stubAuthEnv() {
  Deno.env.set("USE_STUBS", "true");
  Deno.env.delete("VAPI_WEBHOOK_SECRET");
  Deno.env.delete("OPENAI_API_KEY"); // force the deterministic regex fallback
}

function payload(over: Record<string, unknown> = {}) {
  return {
    message: {
      type: "end-of-call-report",
      assistant: { id: "asst-1" },
      call: { id: "vapi-call-1", customer: { number: "+15551112222" } },
      transcript: "Agent: I will send the quote to the customer tomorrow.",
      summary: "Customer asked for a quote.",
      startedAt: "2026-06-08T14:00:00.000Z",
      endedAt: "2026-06-08T14:05:00.000Z",
      ...over,
    },
  };
}

// Stateful DB: status flips to "completed" on the first successful CAS update.
function statefulDb(opts?: { taskInsertError?: boolean }) {
  let status = "in_progress";
  const responder = (s: QuerySpec) => {
    if (s.table === "tenants") return { data: { id: "tenant-1", name: "Acme" }, error: null };
    if (s.table === "calls" && s.op === "select") return { data: { id: "call-1", status }, error: null };
    if (s.table === "calls" && s.op === "update") {
      if (status === "completed") return { data: [], error: null }; // CAS lost — already done
      status = "completed";
      return { data: [{ id: "call-1" }], error: null }; // CAS won
    }
    if (s.table === "tasks" && s.op === "insert") {
      return opts?.taskInsertError ? { data: null, error: { message: "insert boom" } } : { data: null, error: null };
    }
    return { data: null, error: null };
  };
  return makeMockSupabase(responder);
}

Deno.test("first end-of-call persists the call and creates tasks", async () => {
  stubAuthEnv();
  const db = statefulDb();
  // deno-lint-ignore no-explicit-any
  const res = await handleEndOfCall(vapiRequest(payload()), db.client as any);
  assertEquals(res.status, 200);
  const body = await res.json() as { ok: boolean; tasks_created: number; idempotent?: boolean };
  assertEquals(body.ok, true);
  assert(body.tasks_created >= 1, "regex fallback extracted a follow-up task");
  assert(!body.idempotent);
  assertEquals(db.inserts("tasks").length, 1);
});

Deno.test("IDEMPOTENT: a retried end-of-call creates NO duplicate tasks", async () => {
  stubAuthEnv();
  const db = statefulDb();
  // deno-lint-ignore no-explicit-any
  const first = await handleEndOfCall(vapiRequest(payload()), db.client as any);
  // deno-lint-ignore no-explicit-any
  const second = await handleEndOfCall(vapiRequest(payload()), db.client as any);

  assertEquals(first.status, 200);
  assertEquals(second.status, 200);
  const b2 = await second.json() as { tasks_created: number; idempotent?: boolean };
  assertEquals(b2.idempotent, true);
  assertEquals(b2.tasks_created, 0);
  // THE guarantee: tasks inserted exactly once across the original + retry
  assertEquals(db.inserts("tasks").length, 1);
});

Deno.test("surfaces a 500 when the task insert fails (so VAPI can retry)", async () => {
  stubAuthEnv();
  const db = statefulDb({ taskInsertError: true });
  // deno-lint-ignore no-explicit-any
  const res = await handleEndOfCall(vapiRequest(payload()), db.client as any);
  assertEquals(res.status, 500);
  const body = await res.json() as { error: string };
  assertEquals(body.error, "task_insert_failed");
});

Deno.test("no tasks extracted → 200 with tasks_created 0 and no insert", async () => {
  stubAuthEnv();
  const db = statefulDb();
  // deno-lint-ignore no-explicit-any
  const res = await handleEndOfCall(vapiRequest(payload({ transcript: "", summary: null })), db.client as any);
  assertEquals(res.status, 200);
  const body = await res.json() as { tasks_created: number };
  assertEquals(body.tasks_created, 0);
  assertEquals(db.inserts("tasks").length, 0);
});

Deno.test("missing call id → 400", async () => {
  stubAuthEnv();
  const db = statefulDb();
  // deno-lint-ignore no-explicit-any
  const res = await handleEndOfCall(vapiRequest(payload({ call: {} })), db.client as any);
  assertEquals(res.status, 400);
});

Deno.test("unauthorized in production mode → 401", async () => {
  Deno.env.set("USE_STUBS", "false");
  Deno.env.set("VAPI_WEBHOOK_SECRET", "real-secret");
  Deno.env.delete("OPENAI_API_KEY");
  try {
    const db = statefulDb();
    // deno-lint-ignore no-explicit-any
    const res = await handleEndOfCall(vapiRequest(payload(), { secret: "wrong" }), db.client as any);
    assertEquals(res.status, 401);
    assertEquals(db.calls.length, 0);
  } finally {
    Deno.env.set("USE_STUBS", "true");
    Deno.env.delete("VAPI_WEBHOOK_SECRET");
  }
});
