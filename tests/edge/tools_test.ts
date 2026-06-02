// Tool-handler correctness + idempotency dedup in runTool.
// Requires USE_STUBS=true (default) so the calendar adapter is the stub.
import { assertEquals, assert, assertStringIncludes } from "jsr:@std/assert";
import { runTool, type ToolName } from "../../supabase/functions/_shared/tools.ts";
import { makeMockSupabase, type QuerySpec } from "../helpers/mock_supabase.ts";

const TENANT = "tenant-1";
const CALL = "call-1";

function run(name: ToolName | string, input: Record<string, unknown>, responder: (s: QuerySpec) => { data: unknown; error: unknown }, vapiToolCallId?: string) {
  const db = makeMockSupabase(responder);
  return {
    db,
    // deno-lint-ignore no-explicit-any
    result: runTool({ supabase: db.client as any, tenantId: TENANT, callId: CALL, name, input, vapiToolCallId }),
  };
}

// ---- create_task ----------------------------------------------------------
Deno.test("create_task inserts a task and returns its id", async () => {
  const { db, result } = run("create_task", { title: "Call back Jane", description: "re: quote" }, (s) => {
    if (s.table === "tasks" && s.op === "insert") return { data: { id: "task-1" }, error: null };
    if (s.table === "tool_calls") return { data: null, error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "ok");
  assertEquals((r.output as { task_id: string }).task_id, "task-1");
  // bookkeeping row written once
  assertEquals(db.inserts("tool_calls").length, 1);
  const taskInsert = db.inserts("tasks")[0].payload as Record<string, unknown>;
  assertEquals(taskInsert.tenant_id, TENANT);
  assertEquals(taskInsert.title, "Call back Jane");
});

Deno.test("create_task without a title returns an error result (not a throw)", async () => {
  const { db, result } = run("create_task", {}, () => ({ data: null, error: null }));
  const r = await result;
  assertEquals(r.status, "error");
  assertStringIncludes(r.error ?? "", "title is required");
  // error is still recorded as a tool_calls row
  assertEquals(db.inserts("tool_calls").length, 1);
  assertEquals((db.inserts("tool_calls")[0].payload as { status: string }).status, "error");
});

// ---- idempotency dedup ----------------------------------------------------
Deno.test("runTool returns the stored result on a duplicate vapi_tool_call_id (no re-execution)", async () => {
  let stored: { output: unknown; status: string; error: string | null } | null = null;
  const responder = (s: QuerySpec) => {
    if (s.table === "tool_calls" && s.op === "select") return { data: stored, error: null };
    if (s.table === "tool_calls" && s.op === "insert") {
      const p = s.payload as { output: unknown; status: string; error?: string };
      stored = { output: p.output, status: p.status, error: p.error ?? null };
      return { data: null, error: null };
    }
    if (s.table === "tasks" && s.op === "insert") return { data: { id: "task-1" }, error: null };
    return { data: null, error: null };
  };

  const db = makeMockSupabase(responder);
  // deno-lint-ignore no-explicit-any
  const call = () => runTool({ supabase: db.client as any, tenantId: TENANT, callId: CALL, name: "create_task", input: { title: "Once only" }, vapiToolCallId: "tc-42" });

  const first = await call();
  const second = await call();

  assertEquals(first.status, "ok");
  assertEquals(second.status, "ok");
  assertEquals((second.output as { task_id: string }).task_id, "task-1");
  assertEquals(second.duration_ms, 0); // 0 == served from the dedup cache
  // CRITICAL: the side effect (task insert) ran exactly once across both calls
  assertEquals(db.inserts("tasks").length, 1);
});

// ---- book_appointment -----------------------------------------------------
Deno.test("book_appointment books one slot and returns a stub calendar event", async () => {
  const { db, result } = run("book_appointment", {
    customer_name: "Jane Doe", customer_phone: "+15551234567",
    purpose: "consult", start_at: "2026-06-08T14:00:00.000Z",
  }, (s) => {
    if (s.table === "staff") return { data: [{ id: "staff-1", name: "Dana", google_calendar_id: "cal-1" }], error: null };
    if (s.table === "appointments" && s.op === "insert") return { data: { id: "appt-1" }, error: null };
    if (s.table === "tool_calls") return { data: null, error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "ok");
  const out = r.output as { appointment_id: string; google_event_id: string };
  assertEquals(out.appointment_id, "appt-1");
  assertStringIncludes(out.google_event_id, "stub-gcal-");
  // exactly one appointment row written
  assertEquals(db.inserts("appointments").length, 1);
  const appt = db.inserts("appointments")[0].payload as Record<string, unknown>;
  assertEquals(appt.tenant_id, TENANT);
  assertEquals(appt.staff_id, "staff-1");
  assertEquals(appt.customer_name, "Jane Doe");
});

Deno.test("book_appointment errors when no eligible staff", async () => {
  const { result } = run("book_appointment", { customer_name: "X", start_at: "2026-06-08T14:00:00.000Z" }, (s) => {
    if (s.table === "staff") return { data: [], error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "error");
  assertStringIncludes(r.error ?? "", "no eligible staff");
});

// ---- check_availability ---------------------------------------------------
Deno.test("check_availability returns a slots array when staff exist", async () => {
  const { result } = run("check_availability", {
    date_range: { start: "2026-06-08T08:00:00.000Z", end: "2026-06-08T20:00:00.000Z" },
  }, (s) => {
    if (s.table === "tenants") return { data: { booking_config: null }, error: null };
    if (s.table === "staff") return { data: [{ id: "staff-1", name: "Dana", google_calendar_id: "cal-1", role: "sales" }], error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "ok");
  assert(Array.isArray((r.output as { slots: unknown[] }).slots));
});

Deno.test("check_availability returns empty slots when no bookable staff", async () => {
  const { result } = run("check_availability", {
    date_range: { start: "2026-06-08T08:00:00.000Z", end: "2026-06-08T20:00:00.000Z" },
  }, (s) => {
    if (s.table === "tenants") return { data: { booking_config: null }, error: null };
    if (s.table === "staff") return { data: [], error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "ok");
  assertEquals((r.output as { slots: unknown[] }).slots.length, 0);
});

Deno.test("check_availability rejects a missing date_range", async () => {
  const { result } = run("check_availability", {}, () => ({ data: null, error: null }));
  const r = await result;
  assertEquals(r.status, "error");
  assertStringIncludes(r.error ?? "", "date_range");
});

// ---- route_call -----------------------------------------------------------
Deno.test("route_call returns the matched staff transfer number", async () => {
  const { result } = run("route_call", { staff_role: "owner" }, (s) => {
    if (s.table === "staff") return { data: [{ id: "staff-9", name: "Owner", phone: "+15559999999" }], error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "ok");
  assertEquals((r.output as { transfer_number: string }).transfer_number, "+15559999999");
});

Deno.test("route_call errors when nothing matches", async () => {
  const { result } = run("route_call", { staff_role: "nobody" }, (s) => {
    if (s.table === "staff") return { data: [], error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "error");
  assertStringIncludes(r.error ?? "", "no staff match");
});

// ---- capture_message ------------------------------------------------------
Deno.test("capture_message stores a message and resolves routing", async () => {
  const { db, result } = run("capture_message", { body: "Please call me back", urgency: "urgent" }, (s) => {
    if (s.table === "staff") return { data: [{ id: "owner-1" }], error: null };
    if (s.table === "messages" && s.op === "insert") return { data: { id: "msg-1" }, error: null };
    return { data: null, error: null };
  });
  const r = await result;
  assertEquals(r.status, "ok");
  const out = r.output as { message_id: string; routed_to_staff_id: string };
  assertEquals(out.message_id, "msg-1");
  assertEquals(out.routed_to_staff_id, "owner-1");
  const msg = db.inserts("messages")[0].payload as Record<string, unknown>;
  assertEquals(msg.urgency, "urgent");
});

// ---- unknown tool ---------------------------------------------------------
Deno.test("unknown tool name yields an error result and is recorded", async () => {
  const { db, result } = run("does_not_exist", {}, () => ({ data: null, error: null }));
  const r = await result;
  assertEquals(r.status, "error");
  assertStringIncludes(r.error ?? "", "Unknown tool");
  assertEquals(db.inserts("tool_calls").length, 1);
});
